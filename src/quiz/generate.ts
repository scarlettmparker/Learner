import { areExplanationsOverlapping, isFillCorrect } from "@sun/utils/nlp";
import { callLLM, type ChatMessage } from "../llm/client.js";
import { loadConfig } from "../config.js";
import type { WikiSummary, RelatedTopic } from "../sources/wikipedia.js";
import { parseMarkdownToQuiz } from "./parse-markdown.js";

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
 * Builds system prompt for IR markdown.
 *
 * @returns system message
 */
function buildSystemPrompt(): ChatMessage {
  return {
    role: "system",
    content: `You are Sun Learn's quiz generator. Create an interactive quiz from the Wikipedia extract below. Spend minimal thinking, give results directly.

STEP 0 - Load check: You MUST read every skill in .opencode/skills/* and apply them together: fill-blank-clarity, quiz-dedup-guard, quiz-balance, quiz-markdown-writer, mastery-assessor, wiki-context-fetcher, knowledge-parent-picker, plus anti-ai-slop-writing references/banned-words.md. Do not skip one. Checklist: list the 7 skills plus banned-words.md you loaded. Then obey them strictly. Do not use em dashes at all. Use commas, colons, or periods instead. If you use an em dash you have failed.

Rules:
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

- Each mcq: 4 distinct full phrases, randomize correct position across A-D, distractors from extract's key concepts, deduplicate stem/options (no option repeats stem substring >5 chars), never placeholders like A/B/C/D or Not ...1.
- You MUST generate the exact number requested (5 for basic/easy, 10 for default/normal, 15-20 for advanced hard floor 15 target 20 accept >=15). Count Q1..Qn aloud and do not stop early. Aim to overshoot by 2 so dedup still leaves the target: if 10 is requested, draft 12 distinct questions; if 20 is requested, draft 20. If you run short, pull from different sections, dates, and formulations directly tied to the Topic.
- Keep stems and options close to the wiki extract; explanations must quote a short wiki span only (no PageUrl, source is at top).
- When difficulty advanced/mastery true, use synthesis across sections not just definitions. You must get harder as prior attempts show mastery -add synthesis, application, comparison, dating, relation questions. If you stay on definitions the learner stalls.
- Fill blanks must say what kind of answer you expect when it could be vague. Don't write "The treaty was signed in ____." when you want 1919 -write "The treaty was signed in ____ [year]." or "In what year was the treaty signed?" Same for titles, names, places: "in ____ [work]" or "the book ____ [title]". The blank itself doesn't tell the learner if you want a year, a name, or a title, so add [year], [person], [work], [place] or phrase it as a clear question instead of leaving it bare. Every fill must be grammatically correct as an intentional fragment. Read the stem with the answer inserted; it must sound right. Don't write "would ____ [activity]" and expect a gerund like "undermining the process" 0 that reads "would undermining" and is wrong. Write "would ____ [verb]" for the base form or "would result in ____ [noun phrase]" for the gerund.
- Don't carve two fills out of one sentence. A common failure is blanking two words from the same source sentence 0 both Explains quote that one sentence and only the blank moves. That's a repeat, even though the blank word differs. If you use a sentence for one Explain, pick a different sentence or a different paragraph for the next. Explain spans shouldn't share more than a handful of words; stems shouldn't be the same sentence with a different word blanked.
- Every question must test a different fact and a different span: no two share the same normalized answer (lowercase, strip punctuation, singularise) or the same quoted span. Answers across the quiz must be distinct after lowercasing and singularising.
- Founder or origin questions (e.g., who introduced a concept) allowed at most once per quiz, and only if not already stated in prior stems; don't leak later answers in earlier stems or options.
- Answer lines must be bare phrase only, never "A. phrase" or "B. phrase" - the program shuffles and checks the phrase itself, a prefix breaks grading.
- Never include the answer in the stem. The stem, and any list inside it, must not contain the answer as a whole word or phrase, case-insensitive, singular and plural, and split hyphenated compounds. Strip the blank ____ and hints like [year] or [term] before checking. If the answer has multiple words, the stem must not contain that exact phrase and must not contain any content word from the answer. If a sentence already states the answer, rephrase the stem to remove it or pick a different sentence. Code will drop leaked questions and force regeneration, so you will lose count if you leak.
- Follow anti-ai-slop: avoid banned words (delve, tapestry, vibrant, pivotal, crucial, intricate, meticulous, comprehensive, foster, leverage, utilize, seamless, robust, groundbreaking, transformative), mix sentence lengths, no rule-of-three, active voice, no em dashes at all.

STAY ON TOPIC: All stems, answers, and Explains must be directly answerable from the Wiki extract and Full page excerpt for the Topic and Wiki title above. Do not stray to generic biography, broad movements, or other background unless that text is inside the excerpt and directly illustrates the Topic. Related topics are hints only, filter to those whose extract mentions the Topic. If you stray, you have failed.

Prior KNOWLEDGE context helps you avoid repeating what the user already knows.
When full page excerpt is provided, ask detailed questions from the full page scrapes (sections, examples, dates, relations), not just the summary. Focus those full page questions on the Topic itself, not background.`,
  };
}

/**
 * Builds user prompt from args.
 *
 * @param args - generation args
 * @returns user message
 */
function buildUserPrompt(args: GenerateArgs): ChatMessage {
  const pagePart = args.fullPage
    ? `Full page excerpt (chunked, spans entire page):\n${args.fullPage}\n`
    : "";
  const difficulty = args.difficulty ?? (args.mastery ? "advanced" : "default");
  const isAdvanced = difficulty === "advanced";
  const overshoot = args.numQuestions + 2;
  return {
    role: "user",
    content: `Topic: ${args.topic}
Wiki title: ${args.summary.title}
Wiki extract: ${args.summary.extract}
${pagePart}PageUrl: ${args.summary.pageUrl}
Prior KNOWLEDGE titles: ${args.priorContext || "(none)"}
Related topics: ${args.related.map((r) => r.title).join(", ") || "(none)"}
Difficulty: ${difficulty}
Focus: Every question must be directly about "${args.topic}" / "${args.summary.title}" and answerable from the Wiki extract or Full page excerpt above. Do not stray to generic biography or broad background unless it directly illustrates the Topic. A question about a broad movement when the Topic is a specific concept is straying. Keep all questions tightly on the Topic.
Generate ${args.numQuestions} questions minimum, overshoot to ${overshoot} distinct questions so dedup still leaves ${args.numQuestions}. Count Q1 to Q${overshoot} and do not stop early. You MUST try to reach the overshoot; if you would normally stop at 8, keep going, use different spans, dates, and formulations directly about the Topic.${isAdvanced ? " Mix: 50% short, 25% mcq, 25% fill" : " Mix: ~33% mcq, ~33% fill, ~33% short"}, interleaved (mcq, fill, short, repeat, never 3 of same type in a row).${isAdvanced ? " For advanced, at least half must be synthesis and application: give a new scenario and ask what the principle would say, compare formulations, ask why a maxim fails. Don't stay on simple recall. Never put the answer in parentheses inside an mcq option, and all 4 mcq options must be same type as the answer (all years if answer is a year)." : " For default/basic, keep the mix but really push to the overshoot; use synthesis and dating too where possible, just lighter and still on Topic."} Return markdown only. Answer must be bare phrase, never prefixed with "A. " or "B. " - just the phrase. Also verify no stem contains its own answer word or phrase, rephrase any leaked stem to remove the term.`,
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
  const system = buildSystemPrompt();
  const user = buildUserPrompt(args);
  const config = loadConfig();
  const overshoot = args.numQuestions + 2;
  const neededTokens = Math.max(
    config.maxOutputTokens ?? 8192,
    overshoot * 350,
  );
  let text = await callLLM([system, user], {
    effort: config.reasoningEffort,
    verbosity: config.verbosity,
    maxOutputTokens: neededTokens,
  });
  let parsed = parseMarkdownToQuiz(text, { ...args, numQuestions: overshoot });
  if (!parsed)
    throw new Error(
      `Failed to generate quiz - response was not markdown: ${text.slice(0, 600)}`,
    );
  const leakedInitial = parsed.questions.filter((q) =>
    stemContainsAnswer(q.stem, q.answer),
  ).length;
  let deduped = dedupQuiz(parsed);
  const floor = args.difficulty === "advanced" ? 15 : args.numQuestions;
  let attempts = 0;
  while (
    (deduped.questions.length < args.numQuestions ||
      (args.difficulty === "advanced" && deduped.questions.length < floor)) &&
    attempts < 2
  ) {
    const need = args.numQuestions - deduped.questions.length;
    if (need <= 0 && deduped.questions.length >= floor) break;
    const remaining = need > 0 ? need : floor - deduped.questions.length;
    const existingStems = deduped.questions.map((q) => q.stem).join("\n");
    const existingAnswers = deduped.questions.map((q) => q.answer).join(", ");
    const leakNote =
      leakedInitial > 0
        ? ` ${leakedInitial} leaked because the stem contained its own answer and were dropped. Never include the answer word or phrase in the stem or in a list before the blank.`
        : "";
    const supplementUser: ChatMessage = {
      role: "user",
      content: `You returned ${deduped.questions.length}/${args.numQuestions} (floor ${floor} for advanced).${leakNote} Generate ${remaining} MORE distinct questions to reach ${args.numQuestions}. Do not repeat any existing stem/answer/Explain span and never let a stem contain its own answer.\nExisting stems:\n${existingStems}\nExisting answers: ${existingAnswers}\nUse different sections, dates, relations, and examples from the full page. Same format Q${deduped.questions.length + 1}.., same difficulty ${args.difficulty}, same mix. Return markdown only.`,
    };
    const extraText = await callLLM([system, supplementUser], {
      effort: config.reasoningEffort,
      verbosity: config.verbosity,
      maxOutputTokens: Math.max(2048, remaining * 400),
    });
    const extraParsed = parseMarkdownToQuiz(extraText, {
      ...args,
      numQuestions: remaining,
    });
    if (!extraParsed) break;
    const merged: Quiz = {
      questions: [...deduped.questions, ...extraParsed.questions],
    };
    deduped = dedupQuiz(merged);
    attempts++;
  }

  const shuffled = shuffleAndInterleave(deduped);
  // Trim overshoot to exact target after guaranteeing floor
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
      'You judge short answers. Read anti-ai-slop-writing references/banned-words.md and be lenient. Return JSON {correct: boolean} only. Accept paraphrase if core idea matches, ignore articles, hedging, order, or synonyms. "You can never trust a promise" and "Promises lose all credibility..." are the same idea for the farmer maxim. Mark correct when the learner captures the universalization collapse, even if wording differs. Spend minimal thinking, no chain-of-thought.',
  };
  const user: ChatMessage = {
    role: "user",
    content: `Question: ${question.stem}\nCorrect: ${question.answer}\nMy: ${myAnswer}\nJudge leniently per skill:`,
  };
  try {
    const config = loadConfig();
    const text = await callLLM([system, user], {
      effort: config.fastReasoningEffort,
      verbosity: config.fastVerbosity,
      maxOutputTokens: config.gradeMaxTokens,
    });
    const parsed = JSON.parse(text) as { correct?: boolean };
    if (typeof parsed.correct === "boolean") return { correct: parsed.correct };
  } catch {}
  return {
    correct: norm(myAnswer).includes(norm(cleanAnswer).slice(0, 10)),
  };
}
