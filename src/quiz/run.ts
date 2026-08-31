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
 * Prints a single question.
 *
 * @param q - question to print
 * @param index - zero-based index
 */
function printQuestion(q: QuizQuestion, index: number): void {
  console.log(chalk.bold(`\nQ${index + 1} [${q.type}] ${q.stem}`));
  if (q.type === "mcq" && q.options) {
    q.options.forEach((opt, idx) => console.log(`  ${String.fromCharCode(65 + idx)}. ${opt}`));
  }
}

/**
 * Prompts for an answer.
 *
 * @returns answer string
 */
async function promptAnswer(): Promise<string> {
  const { answer } = await promptInput<{ answer: string }>({
    type: "input",
    name: "answer",
    message: "Your answer:",
  });
  return answer;
}

/**
 * Reports result for one question.
 *
 * @param isCorrect - whether answer was correct
 * @param question - question asked
 */
function reportResult(isCorrect: boolean, question: QuizQuestion): void {
  console.log(isCorrect ? chalk.green("Correct") : chalk.red(`Wrong - correct: ${question.answer}`));
  if (question.explanation) console.log(chalk.dim(question.explanation));
}

/**
 * Runs interactive quiz loop.
 *
 * @param questions - questions to ask
 * @returns results
 */
export async function runQuiz(questions: QuizQuestion[]): Promise<QuizRunResult> {
  let correct = 0;
  const answers: QuizAnswer[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    printQuestion(q, i);
    const answer = await promptAnswer();
    const result = await gradeAnswer(q, answer);
    const isCorrect = result.correct;
    if (isCorrect) correct++;
    reportResult(isCorrect, q);
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
