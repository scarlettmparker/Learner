import fs from "node:fs";
import path from "node:path";
import { areExplanationsOverlapping, isFillCorrect } from "@sun/utils/nlp";
import { callLLM, type ChatMessage } from "../llm/client.js";
import { loadConfig } from "../config.js";
import type { WikiSummary, RelatedTopic } from "../sources/wikipedia.js";
import { parseMarkdownToQuiz } from "./parse-markdown.js";
import { verifyQuiz } from "./verify.js";
import { extractSourceSpans, formatSpansForPrompt } from "./source-extract.js";

export type QuizQuestion = {
  /**
   * Question type.
   */
  type: "mcq" | "fill" | "short";
  /**
   * Question stem.
   */
  stem: string;
  /**
   * Options for mcq.
   */
  options?: string[];
  /**
   * Correct answer.
   */
  answer: string;
  /**
   * Wiki span explanation.
   */
  explanation?: string;
};

export type Quiz = {
  /**
   * Questions.
   */
  questions: QuizQuestion[];
};

export type GenerateArgs = {
  /**
   * Topic to learn.
   */
  topic: string;
  /**
   * Wiki summary.
   */
  summary: WikiSummary;
  /**
   * Related topics.
   */
  related: RelatedTopic[];
  /**
   * Prior KNOWLEDGE titles.
   */
  priorContext: string;
  /**
   * Prior blog Q and A markdown.
   */
  priorAnswersMarkdown?: string;
  /**
   * Prior answers set for dedup.
   */
  priorAnswerSet?: string[];
  /**
   * Number to generate.
   */
  numQuestions: number;
  /**
   * Full page plaintext excerpt.
   */
  fullPage?: string | null;
  /**
   * Desired difficulty.
   */
  difficulty?: "basic" | "default" | "advanced";
  /**
   * Whether learner mastered prior.
   */
  mastery?: boolean;
};

/**
 * Loads all skill markdowns programmatically.
 *
 * @returns concatenated skills block
 */
function loadSkillsBlock(): string {
  try {
    const skillsDir = path.join(process.cwd(), ".opencode/skills");
    if (!fs.existsSync(skillsDir)) return "(no skills found)";
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    const blocks: string[] = [];
    for (const name of entries) {
      const p = path.join(skillsDir, name, "SKILL.md");
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, "utf-8").trim();
        blocks.push(`## Skill: ${name}\n${text}`);
      }
    }
    if (blocks.length === 0) return "(no skills found)";
    return blocks.join("\n\n---\n\n");
  } catch {
    return "(skills load failed)";
  }
}

/**
 * Builds system prompt for IR markdown.
 *
 * @returns system message
 */
function buildSystemPrompt(): ChatMessage {
  const skillsBlock = loadSkillsBlock();
  return {
    role: "system",
    content: `You are Sun Learn's quiz generator. Create an interactive quiz from the Wikipedia extract and blog context below. Spend minimal thinking, give results directly.

The following skills are programmatically injected and already loaded for you. Apply them together strictly, do not ask to read files.

${skillsBlock}

Do not use em dashes at all. Use commas, colons, or periods instead. If you use an em dash you have failed.

Rules:
- Source: every Answer and Explain must be a verbatim substring of Wiki extract, Full page excerpt, or Prior blog content. If it is not in that source, do not invent it. Code will drop hallucinations.
- Human: phrase stems as natural questions. Fill blanks must be a concrete idea that appears in the source, such as year, person, work, place, term, or quoted phrase. Do not blank a random adjective or filler.
- Output markdown only, no JSON, no code block wrapper.
- Format exactly:
Q1 [mcq] What is ...?
A. full phrase
B. full phrase
C. full phrase
D. full phrase
Answer: full phrase of correct option
Explain: short wiki span

Q2 [fill] Sentence with ____ blank.
Answer: word
Explain: wiki span

Q3 [short] Open question?
Answer: concise phrase
Explain: wiki span

- Each mcq: 4 distinct full phrases, only one correct per source, randomize correct position across A to D, distractors from source key concepts and same type as answer, deduplicate stem/options (no option repeats stem substring >5 chars), never placeholders like A/B/C/D or Not ...1. Re-read the stem to ensure only the intended option is correct.
 - You MUST generate the exact number requested (5 for basic/easy, 10 for default/normal, 15-20 for advanced hard floor 15 target 20 accept >=15). Count Q1..Qn aloud and do not stop early. Aim to overshoot by 2 so dedup still leaves the target: if 10 is requested, draft 12 distinct questions; if 20 is requested, draft 20. If you run short, pull from different sections, dates, and formulations directly tied to the Topic. Before you close, count your Q headers; if fewer than N, keep generating until you reach N. Stopping at 4 when 10 were requested is a failure.
 - Keep stems and options close to the source; explanations must quote a short source span only (no PageUrl, source is at top).
 - Make the quiz feel interactive, not excerpt-fitting: test understanding the learner can use, not just verbatim recall of one sentence. Prefer rephrased stems that ask the learner to explain or apply the idea.
- When difficulty advanced/mastery true, use synthesis across sections not just definitions. You must get harder as prior attempts show mastery -add synthesis, application, comparison, dating, relation questions. If you stay on definitions the learner stalls.
 - Fill blanks must always have a cue after the blank like ____ [year] or ____ [concept] or be phrased as a direct question such as "In what year was the treaty signed?" Never leave a bare ____ without a cue. Every fill must include a cue like [year], [person], [work], [place], [term], [concept], [noun] right after ____. The cue must be a TYPE hint, never the answer word itself. Writing "right ____ [prior]" when the answer is "prior" is a leak and will be dropped. Cue [year] is correct, cue [prior] when answer is prior is wrong. The article before ____ must agree with the answer: write an ____ [concept] for vowel sounds, a ____ [concept] for consonant sounds, or omit the article. Test by inserting the answer: "also an end" is correct, "also a end" is not. Every fill must be grammatically correct as an intentional fragment. Read the stem with the answer inserted; it must sound right. Don't write "would ____ [activity]" and expect a gerund like "undermining the process" 0 that reads "would undermining" and is wrong. Write "would ____ [verb]" for the base form or "would result in ____ [noun phrase]" for the gerund.
- Don't carve two fills out of one sentence. A common failure is blanking two words from the same source sentence 0 both Explains quote that one sentence and only the blank moves. That's a repeat, even though the blank word differs. If you use a sentence for one Explain, pick a different sentence or a different paragraph for the next. Explain spans shouldn't share more than a handful of words; stems shouldn't be the same sentence with a different word blanked.
- Every question must test a different fact and a different span: no two share the same normalized answer (lowercase, strip punctuation, singularise) or the same quoted span. Answers across the quiz must be distinct after lowercasing and singularising. Do not repeat any fact already in Prior blog context where Result shows correct.
- Founder or origin questions (e.g., who introduced a concept) allowed at most once per quiz, and only if not already stated in prior stems; don't leak later answers in earlier stems or options.
- Answer lines must be bare phrase only, never "A. phrase" or "B. phrase" - the program shuffles and checks the phrase itself, a prefix breaks grading.
- Never include the answer in the stem. The stem, and any list inside it, must not contain the answer as a whole word or phrase, case-insensitive, singular and plural, and split hyphenated compounds. Strip the blank ____ and hints like [year] or [term] before checking. If the answer has multiple words, the stem must not contain that exact phrase and must not contain any content word from the answer. If a sentence already states the answer, rephrase the stem to remove it or pick a different sentence. Code will drop leaked questions and force regeneration, so you will lose count if you leak.
 - Follow anti-ai-slop: avoid banned words (delve, tapestry, vibrant, pivotal, crucial, intricate, meticulous, comprehensive, foster, leverage, utilize, seamless, robust, groundbreaking, transformative), mix sentence lengths, no rule-of-three, active voice, no em dashes at all.
 - Never reference Source Span numbers or IDs in the stem. Do not write "According to Span 6", "Span 3 says", "See Span 6" or any "Span X". If you need attribution, say "According to the extract" or "According to the excerpt" or just ask directly. Any question mentioning "Span" will be dropped and you will lose count.

STAY ON TOPIC: All stems, answers, and Explains must be directly answerable from the Wiki extract, Full page excerpt, and Prior blog content for the Topic and Wiki title above. Do not stray to generic biography, broad movements, or other background unless that text is inside that source and directly illustrates the Topic. Related topics are hints only, filter to those whose source mentions the Topic. If you stray, you have failed. If source does not contain it, do not say it.

Prior KNOWLEDGE and Prior blog Q and A help you avoid repeating what the user already knows and keep you grounded.
When full page excerpt is provided, ask detailed questions from the full page scrapes (sections, examples, dates, relations), not just the summary. Focus those full page questions on the Topic itself, not background.`,
  };
}

/**
 * Builds user prompt from args.
 *
 * @param args - generation args
 * @returns user message
 */
function buildUserPrompt(args: GenerateArgs, spansBlock: string): ChatMessage {
  const pagePart = args.fullPage
    ? `Full page excerpt (raw, entire page):\n${args.fullPage}\n`
    : "";
  const difficulty = args.difficulty ?? (args.mastery ? "advanced" : "default");
  const isAdvanced = difficulty === "advanced";
  const overshoot = Math.ceil(args.numQuestions * 1.2) + 2;
  const priorBlog = args.priorAnswersMarkdown
    ? `Prior blog Q and A:\n${args.priorAnswersMarkdown}\n`
    : "";
  return {
    role: "user",
    content: `Topic: ${args.topic}
Wiki title: ${args.summary.title}
Wiki extract: ${args.summary.extract}
${pagePart}${priorBlog}Source Spans (select distinct spans, use subphrases to hit N without reuse):
${spansBlock}
PageUrl: ${args.summary.pageUrl}
Prior KNOWLEDGE titles: ${args.priorContext || "(none)"}
Related topics: ${args.related.map((r) => r.title).join(", ") || "(none)"}
Difficulty: ${difficulty}
Focus: Every question must be directly about "${args.topic}" / "${args.summary.title}" and use a distinct Source Span or subphrase above. Do not invent outside that source. Do not repeat any Q already in Prior blog Q and A where correct.
Generate exactly ${args.numQuestions} questions, overshoot to ${overshoot} distinct questions so distinct spans still leave ${args.numQuestions}. Count Q1 to Q${overshoot} aloud and do not stop early. You must deliver exactly ${args.numQuestions}, subphrases allowed to hit N without reuse.${isAdvanced ? " Mix: 50% short, 25% mcq, 25% fill" : " Mix: ~33% mcq, ~33% fill, ~33% short"}, interleaved (mcq, fill, short, repeat, never 3 of same type in a row).${isAdvanced ? " For advanced, at least half must be synthesis and application: give a new scenario and ask what the principle would say, compare formulations, ask why a maxim fails. Don't stay on simple recall. Never put the answer in parentheses inside an mcq option, and all 4 mcq options must be same type as the answer (all years if answer is a year) and only one correct." : " For default/basic, keep the mix but really push to the overshoot; use synthesis and dating too where possible, just lighter and still on Topic."} Return markdown only. Answer must be bare phrase, never prefixed with "A. " or "B. " - just the phrase. Check each Answer and Explain is in the source spans.

Before you finish, count your Q headers. You need Q1 through Q${overshoot} (at least ${args.numQuestions}). If you have fewer, keep generating distinct questions from remaining Source Spans until you reach ${overshoot}. Do not output fewer than ${args.numQuestions} under any circumstance.`,
  };
}

/**
 * Shuffles array in place, Fisher-Yates.
 *
 * @param arr - array to shuffle
 */
function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Drops overlapping questions locally, no LLM retry.
 *
 * @param quiz - parsed quiz
 * @returns deduped quiz
 */
function dedupQuiz(quiz: Quiz): Quiz {
  const kept: QuizQuestion[] = [];
  for (const q of quiz.questions) {
    if (stemContainsAnswer(q.stem, q.answer)) continue;
    let duplicate = false;
    for (const k of kept) {
      if (k.answer.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        duplicate = true;
        break;
      }
      if (k.stem.toLowerCase().trim() === q.stem.toLowerCase().trim()) {
        duplicate = true;
        break;
      }
      if (
        k.explanation &&
        q.explanation &&
        areExplanationsOverlapping(k.explanation, q.explanation)
      ) {
        duplicate = true;
        break;
      }
      const normStem = (s: string): string =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
      if (normStem(k.stem) === normStem(q.stem)) {
        duplicate = true;
        break;
      }
      const a = k.stem.toLowerCase();
      const b = q.stem.toLowerCase();
      if (
        a.includes(q.answer.toLowerCase().slice(0, 12)) &&
        q.answer.length > 12
      ) {
        duplicate = true;
        break;
      }
      if (
        b.includes(k.answer.toLowerCase().slice(0, 12)) &&
        k.answer.length > 12
      ) {
        duplicate = true;
        break;
      }
    }
    if (!duplicate) kept.push(q);
  }
  return { questions: kept };
}

/**
 * Strips parenthetical that leaks the answer, e.g. "The 18th century (1785)".
 *
 * @param options - mcq options
 * @param answer - correct answer
 * @returns sanitized options
 */
function sanitizeOptions(options: string[], answer: string): string[] {
  return options.map((opt) => {
    const trimmed = opt.trim();
    if (trimmed.includes("(") && trimmed.includes(")")) {
      const inside = trimmed.slice(
        trimmed.indexOf("(") + 1,
        trimmed.indexOf(")"),
      );
      if (
        inside.includes(answer.trim()) ||
        answer.trim().includes(inside.trim())
      ) {
        return trimmed.replace(/\s*\(.*?\)\s*/g, "").trim();
      }
      if (/\b\d{4}\b/.test(inside) && /\b\d{4}\b/.test(answer)) {
        return trimmed.replace(/\s*\(.*?\)\s*/g, "").trim();
      }
    }
    return trimmed;
  });
}

/**
 * Checks if stem contains its own answer.
 *
 * @param stem - question stem
 * @param answer - correct answer
 * @returns true if stem leaks answer
 */
function stemContainsAnswer(stem: string, answer: string): boolean {
  const cueMatch = stem.match(/____\s*\[([^\]]+)\]/);
  if (cueMatch) {
    const cueNorm = cueMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(\w+)s\b/g, "$1");
    const ansNormEarly = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(\w+)s\b/g, "$1");
    if (cueNorm && ansNormEarly) {
      if (cueNorm === ansNormEarly) return true;
      const cueWords = cueNorm.split(/\s+/).filter((w) => w.length >= 3);
      const ansWordsEarly = new Set(ansNormEarly.split(/\s+/).filter((w) => w.length >= 3));
      for (const w of cueWords) if (ansWordsEarly.has(w)) return true;
    }
  }
  const cleanStem = stem
    .replace(/_{2,}/g, " ")
    .replace(/\s*\[.*?\]/g, " ")
    .toLowerCase();
  const cleanAnswer = answer.toLowerCase().trim();
  if (!cleanAnswer) return false;
  const norm = (s: string): string =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\b(\w+)s\b/g, "$1");
  const stemNorm = ` ${norm(cleanStem)} `;
  const answerNorm = norm(cleanAnswer);
  if (!answerNorm) return false;
  if (answerNorm.length >= 3 && stemNorm.includes(` ${answerNorm} `)) {
    return true;
  }
  const answerWords = answerNorm.split(/\s+/).filter((w) => w.length >= 3);
  const stemWords = new Set(stemNorm.trim().split(/\s+/));
  for (const w of answerWords) {
    const singular = w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : w;
    if (stemWords.has(w) || stemWords.has(singular)) return true;
    for (const sw of stemWords) {
      const swSingular =
        sw.endsWith("s") && sw.length > 3 ? sw.slice(0, -1) : sw;
      if (swSingular === singular) return true;
    }
  }
  return false;
}

/**
 * Shuffles mcq options and interleaves types programmatically.
 *
 * @param quiz - deduped quiz
 * @returns shuffled quiz
 */
function shuffleAndInterleave(quiz: Quiz): Quiz {
  for (const q of quiz.questions) {
    if (q.type === "mcq" && q.options && q.options.length === 4) {
      q.options = sanitizeOptions(q.options, q.answer);
      shuffleInPlace(q.options);
    }
  }
  const shuffled = [...quiz.questions];
  shuffleInPlace(shuffled);
  let attempts = 0;
  while (attempts < 10) {
    let badRun = false;
    let run = 1;
    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i].type === shuffled[i - 1].type) run++;
      else run = 1;
      if (run > 2) {
        badRun = true;
        break;
      }
    }
    if (!badRun) break;
    shuffleInPlace(shuffled);
    attempts++;
  }
  return { questions: shuffled };
}

/**
 * Generates quiz from LLM markdown then programmatically fixes variety.
 *
 * @param props - generation args
 * @returns quiz
 */
export async function generateQuiz(props: GenerateArgs): Promise<Quiz> {
  const args = props;
  const sourceText = [
    args.summary.extract,
    args.fullPage ?? "",
    args.priorAnswersMarkdown ?? "",
    args.priorContext,
  ].join("\n");
  const spans = extractSourceSpans(sourceText);
  const spansBlock = formatSpansForPrompt(spans);
  const system = buildSystemPrompt();
  const user = buildUserPrompt(args, spansBlock);
  const config = loadConfig();
  const overshoot = Math.ceil(args.numQuestions * 1.2) + 2;
  const neededTokens = Math.max(4096, overshoot * 600);
  const maxOutputTokens = neededTokens;
  let text = await callLLM([system, user], {
    effort: config.reasoningEffort,
    verbosity: config.verbosity,
    maxOutputTokens,
  });
  let parsed = parseMarkdownToQuiz(text, { ...args, numQuestions: overshoot });
  if (!parsed)
    throw new Error(
      `Failed to generate quiz - response was not markdown: ${text.slice(0, 600)}`,
    );
  const priorSet = new Set(
    (args.priorAnswerSet ?? []).map((s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
    ),
  );
  let verified = verifyQuiz(parsed, priorSet);
  let deduped = dedupQuiz({ questions: verified.kept });
  let dropped = verified.droppedHallucinated + verified.droppedPrior;
  const floor = args.difficulty === "advanced" ? 15 : args.numQuestions;
  let attempts = 0;
  while (
    (deduped.questions.length < args.numQuestions ||
      (args.difficulty === "advanced" && deduped.questions.length < floor)) &&
    attempts < 3
  ) {
    const need = args.numQuestions - deduped.questions.length;
    const remaining =
      need > 0
        ? need
        : floor - deduped.questions.length;
    if (remaining <= 0) break;
    const existingStems = deduped.questions.map((q) => q.stem).join("\n");
    const existingAnswers = deduped.questions.map((q) => q.answer).join(", ");
    const remainingSpans = spans
      .filter(
        (s) =>
          !deduped.questions.some((q) =>
            (q.explanation ?? "").includes(s.text.slice(0, 20)),
          ),
      )
      .map((s) => `${s.id}. "${s.text}"`)
      .join("\n");
    const dropNote =
      dropped > 0
        ? ` ${dropped} were dropped as hallucinations or prior duplicates. Use only Source Spans.`
        : "";
    const supplementUser: ChatMessage = {
      role: "user",
      content: `You returned ${deduped.questions.length}/${args.numQuestions} (floor ${floor} for advanced).${dropNote} Generate ${remaining} MORE distinct questions to reach ${args.numQuestions}. Do not repeat any existing stem/answer/Explain. Use unused Source Spans below, subphrases allowed to hit N without reuse, still only one correct per mcq and every fill needs cue.
Unused spans:
${remainingSpans || spansBlock}
Existing stems:
${existingStems}
Existing answers: ${existingAnswers}
Same format Q${deduped.questions.length + 1}.., same difficulty ${args.difficulty}, same mix. Return markdown only. You must deliver exactly ${remaining} more so total is ${args.numQuestions}. Before you finish, count your Q headers to confirm you hit ${remaining}.`,
    };
    const extraText = await callLLM([system, supplementUser], {
      effort: config.reasoningEffort,
      verbosity: config.verbosity,
      maxOutputTokens: Math.max(4096, remaining * 600),
    });
    const extraParsed = parseMarkdownToQuiz(extraText, {
      ...args,
      numQuestions: remaining,
    });
    if (!extraParsed) break;
    const extraVerified = verifyQuiz(extraParsed, priorSet);
    dropped = extraVerified.droppedHallucinated + extraVerified.droppedPrior;
    const merged: Quiz = {
      questions: [...deduped.questions, ...extraVerified.kept],
    };
    deduped = dedupQuiz(merged);
    attempts++;
  }
  const shuffled = shuffleAndInterleave(deduped);
  return { questions: shuffled.questions.slice(0, args.numQuestions) };
}

/**
 * Checks mcq options are distinct.
 *
 * @param quiz - parsed quiz
 * @returns true if distinct
 */
function hasDistinctOptions(quiz: Quiz): boolean {
  for (const q of quiz.questions) {
    if (q.type !== "mcq" || !q.options) continue;
    const lower = q.options.map((o) => o.toLowerCase().trim());
    if (new Set(lower).size !== lower.length) return false;
    for (const opt of lower) {
      if (q.stem.toLowerCase().includes(opt.slice(0, 10)) && opt.length > 10)
        return false;
    }
  }
  return true;
}

/**
 * Checks answers and stems are distinct across questions and not leaked.
 *
 * @param quiz - parsed quiz
 * @returns true if valid
 */
function hasDistinctAnswersAndStems(quiz: Quiz): boolean {
  for (const q of quiz.questions) {
    if (stemContainsAnswer(q.stem, q.answer)) return false;
  }
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const answers = quiz.questions.map((q) => norm(q.answer));
  if (new Set(answers).size !== answers.length) return false;
  for (let i = 0; i < quiz.questions.length; i++) {
    for (let j = i + 1; j < quiz.questions.length; j++) {
      const a = quiz.questions[i];
      const b = quiz.questions[j];
      if (norm(a.stem) === norm(b.stem)) return false;
      if (
        b.stem.toLowerCase().includes(a.answer.toLowerCase().slice(0, 12)) &&
        a.answer.length > 12
      )
        return false;
      if (
        a.stem.toLowerCase().includes(b.answer.toLowerCase().slice(0, 12)) &&
        b.answer.length > 12
      )
        return false;
    }
  }
  const founderCount = quiz.questions.filter((q) =>
    /which thinker|who created|who is.*central concept/i.test(q.stem),
  ).length;
  if (founderCount > 1) return false;
  return true;
}

/**
 * Grades an answer via exact + letter mapping + judge for short.
 *
 * @param question - question to grade
 * @param myAnswer - learner answer
 * @returns whether correct
 */
/**
 * Strips leading option label like "B. " from an answer string.
 *
 * @param s - answer string
 * @returns stripped
 */
function stripLabel(s: string): string {
  return s
    .replace(/^[A-D][\.\)]\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

export async function gradeAnswer(
  question: QuizQuestion,
  myAnswer: string,
): Promise<{ correct: boolean }> {
  const norm = (s: string) => stripLabel(s).trim().toLowerCase();
  const cleanAnswer = stripLabel(question.answer);
  if (question.type === "mcq") {
    const trimmed = myAnswer.trim();
    if (/^[a-dA-D]$/.test(trimmed) && question.options) {
      const idx = trimmed.toLowerCase().charCodeAt(0) - 97;
      const chosen = question.options[idx];
      if (chosen) return { correct: norm(chosen) === norm(cleanAnswer) };
    }
    if (/^[1-4]$/.test(trimmed) && question.options) {
      const idx = parseInt(trimmed, 10) - 1;
      const chosen = question.options[idx];
      if (chosen) return { correct: norm(chosen) === norm(cleanAnswer) };
    }
    return { correct: norm(myAnswer) === norm(cleanAnswer) };
  }
  if (question.type === "fill")
    return {
      correct: isFillCorrect(myAnswer, cleanAnswer, {
        maxDistance: 1,
        minBigram: 0.72,
      }),
    };
  const system: ChatMessage = {
    role: "system",
    content:
      "You judge short answers for a learner. Be lenient but accurate. Return JSON {\"correct\": boolean} only, no prose. Mark correct if the learner captures the central idea with the key distinguishing term, even if wording differs. Ignore hedging or prefix like 'Because', 'Since', 'It is because'. Ignore articles, case, punctuation, word order, extra filler. Treat intensifiers as optional: 'very important' == 'important', 'too heavily' == 'heavily'. Treat close synonyms as equivalent. Only mark correct if the core noun or verb from the correct answer is present in some form; vague generic paraphrases that omit the key term are wrong. Lean toward wrong if the key term is missing. Examples:\nCorrect: \"requires very careful planning\" | My: \"Because it requires careful planning\" - {\"correct\": true}\nCorrect: \"located in central Europe\" | My: \"it is in central Europe\" - {\"correct\": true}\nCorrect: \"photosynthesis needs sunlight\" | My: \"it depends on sunlight\" - {\"correct\": true}\nCorrect: \"treaty was signed in 1919\" | My: \"it was signed in Versailles\" - {\"correct\": false}\nCorrect: \"cannot decide through empirical means\" | My: \"its outcome\" - {\"correct\": false}\nSpend minimal thinking, no chain-of-thought.",
  };
  const user: ChatMessage = {
    role: "user",
    content: `Question: ${question.stem}\nCorrect: ${question.answer}\nExplain: ${question.explanation ?? ""}\nMy: ${myAnswer}\nJudge leniently, return JSON only:`,
  };
  try {
    const config = loadConfig();
    const text = await callLLM([system, user], {
      effort: config.fastReasoningEffort,
      verbosity: config.fastVerbosity,
      maxOutputTokens: config.gradeMaxTokens,
    });
    try {
      const parsed = JSON.parse(text) as { correct?: boolean };
      if (typeof parsed.correct === "boolean") return { correct: parsed.correct };
    } catch {}
    const m = text.match(/"correct"\s*:\s*(true|false)/i);
    if (m) return { correct: m[1].toLowerCase() === "true" };
  } catch {}
  return { correct: false };
}
