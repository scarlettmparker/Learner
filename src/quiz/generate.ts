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

- Each mcq: 4 distinct plausible full phrases, randomize correct position across A-D, distractors from extract's key concepts, deduplicate stem/options (no option repeats stem substring >5 chars), never placeholders like A/B/C/D or Not ...1.
- Keep stems and options verbatim-friendly to the wiki extract; explanations must quote a short wiki span only (no PageUrl, source is at top).
- When difficulty advanced/mastery true, use synthesis across sections not just definitions. Must become harder over time as prior attempts show mastery: increase synthesis, application, comparison, dating, and relation questions. Spaced repetition of concepts is fine but avoid frequent near-duplicates.
- Founder/thinker questions (e.g., which thinker created ...) are allowed at most once per quiz, and only if not already stated in prior stems; do not leak later answers in earlier stems/options. Earlier questions must not name the entity that is the answer to a later question.
- Every question must test a different fact/span: no two questions share the same normalized answer (lowercase, strip punctuation) or the same quoted span. Answers across the quiz must be distinct.
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
  const pagePart = args.fullPage ? `Full page excerpt (plaintext, up to 12000 chars, use for detailed questions):\n${args.fullPage.slice(0, 8000)}\n` : "";
  const difficulty = args.difficulty ?? (args.mastery ? "advanced" : "same");
  return {
    role: "user",
    content: `Topic: ${args.topic}
Wiki title: ${args.summary.title}
Wiki extract: ${args.summary.extract}
${pagePart}PageUrl: ${args.summary.pageUrl}
Prior KNOWLEDGE titles: ${args.priorContext || "(none)"}
Related topics: ${args.related.map((r) => r.title).join(", ") || "(none)"}
Difficulty: ${difficulty}
Generate ${args.numQuestions} questions: ~33% mcq, ~33% fill, ~33% short (balanced). Return markdown only.`,
  };
}

/**
 * Generates quiz via Muse Spark with anti-ai-slop constraints.
 *
 * @param props - generation args
 * @param _token - unused auth token
 * @returns quiz
 */
export async function generateQuiz(props: GenerateArgs, _token: string): Promise<Quiz> {
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
  if (parsed) return parsed;
  throw new Error(`Failed to generate quiz - response was not markdown: ${text.slice(0, 600)}`);
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
      if (q.stem.toLowerCase().includes(opt.slice(0, 10)) && opt.length > 10) return false;
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
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const answers = quiz.questions.map((q) => norm(q.answer));
  if (new Set(answers).size !== answers.length) return false;
  for (let i = 0; i < quiz.questions.length; i++) {
    for (let j = i + 1; j < quiz.questions.length; j++) {
      const a = quiz.questions[i];
      const b = quiz.questions[j];
      if (norm(a.stem) === norm(b.stem)) return false;
      if (b.stem.toLowerCase().includes(a.answer.toLowerCase().slice(0, 12)) && a.answer.length > 12) return false;
      if (a.stem.toLowerCase().includes(b.answer.toLowerCase().slice(0, 12)) && b.answer.length > 12) return false;
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
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const seen = new Map<string, number>();
  const issues: string[] = [];
  quiz.questions.forEach((q, idx) => {
    const n = norm(q.answer);
    const prev = seen.get(n);
    if (prev !== undefined) issues.push(`Q${prev + 1} and Q${idx + 1} share answer "${q.answer}"`);
    else seen.set(n, idx);
  });
  return issues.join("; ") || "duplicate stems/answers or cross-question leakage";
}

/**
 * Grades an answer via exact + letter mapping + judge for short.
 */
export async function gradeAnswer(
  question: QuizQuestion,
  myAnswer: string,
  _token: string,
): Promise<{ correct: boolean }> {
  const norm = (s: string) => s.trim().toLowerCase();
  if (question.type === "mcq") {
    const trimmed = myAnswer.trim();
    if (/^[a-dA-D]$/.test(trimmed) && question.options) {
      const idx = trimmed.toLowerCase().charCodeAt(0) - 97;
      const chosen = question.options[idx];
      if (chosen) return { correct: norm(chosen) === norm(question.answer) };
    }
    if (/^[1-4]$/.test(trimmed) && question.options) {
      const idx = parseInt(trimmed, 10) - 1;
      const chosen = question.options[idx];
      if (chosen) return { correct: norm(chosen) === norm(question.answer) };
    }
    return { correct: norm(myAnswer) === norm(question.answer) };
  }
  if (question.type === "fill") return { correct: norm(myAnswer) === norm(question.answer) };
  const system: ChatMessage = {
    role: "system",
    content: "You judge short answers. Return JSON {correct: boolean} only. Spend minimal thinking, no chain-of-thought.",
  };
  const user: ChatMessage = {
    role: "user",
    content: `Question: ${question.stem}\nCorrect: ${question.answer}\nMy: ${myAnswer}\nJudge:`,
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
  return { correct: norm(myAnswer).includes(norm(question.answer).slice(0, 10)) };
}
