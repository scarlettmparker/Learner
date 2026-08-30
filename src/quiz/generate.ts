import { callMuseSpark, type ChatMessage } from "../llm/client.js";
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
};

/**
 * Generates quiz via Muse Spark with anti-ai-slop constraints.
 *
 * @param props - generation args
 * @param _token - unused auth token
 * @returns quiz
 */
export async function generateQuiz(
  props: GenerateArgs,
  _token: string,
): Promise<Quiz> {
  const args = props;
  const system: ChatMessage = {
    role: "system",
    content: `You are Sun Learn's quiz generator. Create an interactive quiz from the Wikipedia extract below.

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

- Each mcq: 4 distinct plausible full phrases, randomize correct position across A-D, distractors from extract's key concepts.
- Keep stems and options verbatim-friendly to the wiki extract; explanations must quote a short wiki span.
- Follow anti-ai-slop: avoid banned words (delve, tapestry, vibrant, pivotal, crucial, intricate, meticulous, comprehensive, foster, leverage, utilize, seamless, robust, groundbreaking, transformative), mix sentence lengths, no rule-of-three, active voice, ≤1 em dash per 500 words.

Prior KNOWLEDGE context helps you avoid repeating what the user already knows.`,
  };
  const user: ChatMessage = {
    role: "user",
    content: `Topic: ${args.topic}
Wiki title: ${args.summary.title}
Wiki extract: ${args.summary.extract}
PageUrl: ${args.summary.pageUrl}
Prior KNOWLEDGE titles: ${args.priorContext || "(none)"}
Related topics: ${args.related.map((r) => r.title).join(", ") || "(none)"}
Generate ${args.numQuestions} questions: 50% mcq, 25% fill, 25% short. Return markdown only.`,
  };
  const text = await callMuseSpark([system, user]);
  const parsed = parseMarkdownToQuiz(text, args);
  if (parsed) {
    return parsed;
  }

  throw new Error(`Failed to generate quiz - response was not markdown: ${text.slice(0, 600)}`);
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
  if (question.type === "fill") {
    return { correct: norm(myAnswer) === norm(question.answer) };
  }
  const system: ChatMessage = {
    role: "system",
    content: "You judge short answers. Return JSON {correct: boolean}.",
  };
  const user: ChatMessage = {
    role: "user",
    content: `Question: ${question.stem}\nCorrect: ${question.answer}\nMy: ${myAnswer}\nJudge:`,
  };
  try {
    const text = await callMuseSpark([system, user]);
    const parsed = JSON.parse(text) as { correct?: boolean };
    if (typeof parsed.correct === "boolean") return { correct: parsed.correct };
  } catch {}
  return {
    correct: norm(myAnswer).includes(norm(question.answer).slice(0, 10)),
  };
}
