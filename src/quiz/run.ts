import chalk from "chalk";
import { promptInput } from "./prompt.js";
import { gradeAnswer, type QuizQuestion } from "./generate.js";

export type QuizAnswer = {
  /**
   * Question stem.
   */
  question: string;
  /**
   * My answer.
   */
  myAnswer: string;
  /**
   * Whether correct.
   */
  correct: boolean;
  /**
   * Correct answer.
   */
  correctAnswer: string;
  /**
   * Explanation.
   */
  explanation?: string;
};

export type QuizRunResult = {
  /**
   * Answers given.
   */
  answers: QuizAnswer[];
  /**
   * Number correct.
   */
  correct: number;
  /**
   * Gaps (wrong questions).
   */
  gaps: string[];
};

/**
 * Runs interactive quiz loop.
 */
export async function runQuiz(
  questions: QuizQuestion[],
  token: string,
): Promise<QuizRunResult> {
  let correct = 0;
  const answers: QuizAnswer[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(chalk.bold(`\nQ${i + 1} [${q.type}] ${q.stem}`));
    if (q.type === "mcq" && q.options) {
      q.options.forEach((opt, idx) =>
        console.log(`  ${String.fromCharCode(65 + idx)}. ${opt}`),
      );
    }
    const { answer } = await promptInput<{ answer: string }>({
      type: "input",
      name: "answer",
      message: "Your answer:",
    });
    const result = await gradeAnswer(q, answer, token);
    const isCorrect = result.correct;
    if (isCorrect) correct++;
    console.log(
      isCorrect
        ? chalk.green("Correct")
        : chalk.red(`Wrong - correct: ${q.answer}`),
    );
    if (q.explanation) console.log(chalk.dim(q.explanation));
    answers.push({
      question: q.stem,
      myAnswer: answer,
      correct: isCorrect,
      correctAnswer: q.answer,
      explanation: q.explanation,
    });
  }
  const gaps = answers.filter((a) => !a.correct).map((a) => a.question);
  return { answers, correct, gaps };
}
