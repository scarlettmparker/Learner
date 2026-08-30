import { callMuseSpark, type ChatMessage } from "../llm/client.js";
import type { WikiSummary, RelatedTopic } from "../sources/wikipedia.js";
import { parseQuizResponse } from "./parse.js";

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
 * Generates quiz via LLM with anti-ai-slop constraints.
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
- Output valid JSON only, no markdown, no code block, no extra text: {"questions":[{...}]}
- Each mcq: 4 distinct plausible options (full phrases, not "A" "B"), one correct, three distractors from the extract's key concepts. Randomize which position (A-D) holds the correct answer; do not always put it at A. Vary correct positions across questions.
- Each fill: sentence with ____ blank.
- Each short: open question with concise answer (1-2 words or short phrase).
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
Generate ${args.numQuestions} questions: 50% mcq, 25% fill, 25% short. Return JSON only with questions and no suggestions.`,
  };
  const text = await callMuseSpark([system, user]);
  const parsed = parseQuizResponse(text, args);
  if (parsed) return parsed;
  throw new Error(
    `Failed to generate quiz - response was not valid JSON: ${text.slice(0, 400)}`,
  );
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
