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
  difficulty?: "basic" | "same" | "advanced";
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

Before you write, read every skill in .opencode/skills/* and apply them together: fill-blank-clarity, quiz-dedup-guard, quiz-balance, quiz-markdown-writer, mastery-assessor, wiki-context-fetcher, knowledge-parent-picker, plus anti-ai-slop-writing references/banned-words.md. Don't skip one.

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
 - You MUST generate the exact number requested (5 for basic/easy, 10 for same/normal, 20 for advanced). Do not stop at 4. Count Q1..Qn and push to the full count; if you run short, pull from different sections, dates, and related topics.
 - Keep stems and options close to the wiki extract; explanations must quote a short wiki span only (no PageUrl, source is at top).
 - When difficulty advanced/mastery true, use synthesis across sections not just definitions. You must get harder as prior attempts show mastery -add synthesis, application, comparison, dating, relation questions. If you stay on definitions the learner stalls.
- Fill blanks must say what kind of answer you expect when it could be vague. Don't write "The treaty was signed in ____." when you want 1919 -write "The treaty was signed in ____ [year]." or "In what year was the treaty signed?" Same for titles, names, places: "in ____ [work]" or "the book ____ [title]". The blank itself doesn't tell the learner if you want a year, a name, or a title, so add [year], [person], [work], [place] or phrase it as a clear question instead of leaving it bare. Every fill must be grammatically correct as an intentional fragment. Read the stem with the answer inserted; it must sound right. Don't write "would ____ [activity]" and expect a gerund like "undermining the process" — that reads "would undermining" and is wrong. Write "would ____ [verb]" for the base form or "would result in ____ [noun phrase]" for the gerund.
- Don't carve two fills out of one sentence. A common failure is blanking two words from the same source sentence — both Explains quote that one sentence and only the blank moves. That's a repeat, even though the blank word differs. If you use a sentence for one Explain, pick a different sentence or a different paragraph for the next. Explain spans shouldn't share more than a handful of words; stems shouldn't be the same sentence with a different word blanked.
- Every question must test a different fact and a different span: no two share the same normalized answer (lowercase, strip punctuation, singularise) or the same quoted span. Answers across the quiz must be distinct after lowercasing and singularising.
 - Founder or origin questions (e.g., who introduced a concept) allowed at most once per quiz, and only if not already stated in prior stems; don't leak later answers in earlier stems or options.
 - Answer lines must be bare phrase only, never "A. phrase" or "B. phrase" - the program shuffles and checks the phrase itself, a prefix breaks grading.
 - Follow anti-ai-slop: avoid banned words (delve, tapestry, vibrant, pivotal, crucial, intricate, meticulous, comprehensive, foster, leverage, utilize, seamless, robust, groundbreaking, transformative), mix sentence lengths, no rule-of-three, active voice, ≤1 em dash per 500 words.

Prior KNOWLEDGE context helps you avoid repeating what the user already knows.
When full page excerpt is provided, ask detailed questions from the full page scrapes (sections, examples, dates, relations), not just the summary.`,
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
  const difficulty = args.difficulty ?? (args.mastery ? "advanced" : "same");
  const isAdvanced = difficulty === "advanced";
  return {
    role: "user",
    content: `Topic: ${args.topic}
Wiki title: ${args.summary.title}
Wiki extract: ${args.summary.extract}
${pagePart}PageUrl: ${args.summary.pageUrl}
Prior KNOWLEDGE titles: ${args.priorContext || "(none)"}
Related topics: ${args.related.map((r) => r.title).join(", ") || "(none)"}
Difficulty: ${difficulty}
Generate EXACTLY ${args.numQuestions} questions - count them Q1 to Q${args.numQuestions} and do not stop early. You MUST try to reach the full count; if you would normally stop at 4-6, keep going, use different spans, dates, relations, and examples from the full page to fill the rest.${isAdvanced ? " Mix: 50% short, 25% mcq, 25% fill" : " Mix: ~33% mcq, ~33% fill, ~33% short"}, interleaved (mcq, fill, short, repeat, never 3 of same type in a row).${isAdvanced ? " For advanced, at least half must be synthesis and application: give a new scenario and ask what the principle would say, compare formulations, ask why a maxim fails. Don't stay on simple recall. Never put the answer in parentheses inside an mcq option, and all 4 mcq options must be same type as the answer (all years if answer is a year)." : " For same/basic, keep the mix but really push to the full count; use synthesis and dating too where possible, just lighter."} Return markdown only. Answer must be bare phrase, never prefixed with "A. " or "B. " - just the phrase.`,
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
      const inside = trimmed.slice(trimmed.indexOf("(") + 1, trimmed.indexOf(")"));
      if (inside.includes(answer.trim()) || answer.trim().includes(inside.trim())) {
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
  const text = await callLLM([system, user], {
    effort: config.reasoningEffort,
    verbosity: config.verbosity,
    maxOutputTokens: config.maxOutputTokens,
  });
  const parsed = parseMarkdownToQuiz(text, args);
  if (parsed) {
    const deduped = dedupQuiz(parsed);
    return shuffleAndInterleave(deduped);
  }
  throw new Error(
    `Failed to generate quiz - response was not markdown: ${text.slice(0, 600)}`,
  );
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
 * Describes duplicate/leakage issues for retry prompt.
 *
 * @param quiz - parsed quiz with issues
 * @returns issue description
 */
function describeQuizIssues(quiz: Quiz): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const seen = new Map<string, number>();
  const issues: string[] = [];
  quiz.questions.forEach((q, idx) => {
    const n = norm(q.answer);
    const prev = seen.get(n);
    if (prev !== undefined)
      issues.push(`Q${prev + 1} and Q${idx + 1} share answer "${q.answer}"`);
    else seen.set(n, idx);
  });
  return (
    issues.join("; ") || "duplicate stems/answers or cross-question leakage"
  );
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
  return s.replace(/^[A-D][\.\)]\s*/i, "").replace(/^["']|["']$/g, "").trim();
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
      "You judge short answers. Read anti-ai-slop-writing references/banned-words.md and be lenient. Return JSON {correct: boolean} only. Accept paraphrase if core idea matches, ignore articles, hedging, order, or synonyms. \"You can never trust a promise\" and \"Promises lose all credibility...\" are the same idea for the farmer maxim. Mark correct when the learner captures the universalization collapse, even if wording differs. Spend minimal thinking, no chain-of-thought.",
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
