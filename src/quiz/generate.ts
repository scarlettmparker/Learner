import { callMuseSpark, type ChatMessage } from "../llm/client.js";
import type { WikiSummary, RelatedTopic } from "../sources/wikipedia.js";

export type QuizQuestion = {
  type: "mcq" | "fill" | "short";
  stem: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

export type Quiz = {
  questions: QuizQuestion[];
};

export type GenerateArgs = {
  topic: string;
  summary: WikiSummary;
  related: RelatedTopic[];
  priorContext: string;
  numQuestions: number;
};

/**
 * Generates quiz via Muse Spark with anti-ai-slop constraints.
 */
export async function generateQuiz(
  args: GenerateArgs,
  _token: string,
): Promise<Quiz> {
  const system: ChatMessage = {
    role: "system",
    content: `You generate quiz questions from Wikipedia. Follow anti-ai-slop: no banned words (delve, tapestry, vibrant etc.), no rule-of-three, mix sentence lengths, no parataxis, active voice, ≤1 em dash per 500w. Return JSON {questions:[{type:"mcq"|"fill"|"short", stem, options?, answer, explanation}], suggestions:[string]}. Use verbatim wiki spans for explanations.`,
  };
  const user: ChatMessage = {
    role: "user",
    content: `Topic: ${args.topic}\nWiki extract: ${args.summary.extract}\nPageUrl: ${args.summary.pageUrl}\nPrior KNOWLEDGE context: ${args.priorContext}\nRelated: ${args.related.map((r) => r.title).join(", ")}\nGenerate ${args.numQuestions} questions: 50% mcq, 25% fill, 25% short. Return JSON only.`,
  };
  const text = await callMuseSpark([system, user]);
  try {
    const parsed = JSON.parse(text) as Quiz;
    if (Array.isArray(parsed.questions) && parsed.questions.length)
      return parsed;
  } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as Quiz;
      if (Array.isArray(parsed.questions)) return parsed;
    } catch {}
  }
  return {
    questions: [
      {
        type: "mcq",
        stem: `What is ${args.topic} primarily about?`,
        options: ["A", "B", "C", "D"],
        answer: "A",
        explanation: args.summary.extract.slice(0, 200),
      },
    ],
  };
}

/**
 * Grades an answer via exact + Muse judge for short.
 */
export async function gradeAnswer(
  question: QuizQuestion,
  myAnswer: string,
  _token: string,
): Promise<{ correct: boolean }> {
  const norm = (s: string) => s.trim().toLowerCase();
  if (question.type === "mcq" || question.type === "fill") {
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
