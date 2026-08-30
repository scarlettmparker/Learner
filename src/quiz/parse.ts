import type { GenerateArgs, Quiz, QuizQuestion } from "./generate.js";

/**
 * Parses response into quiz.
 */
export function parseQuizResponse(
  text: string,
  args: GenerateArgs,
): Quiz | null {
  const direct = tryParse(text, args);
  if (direct) return direct;
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlock) {
    const parsed = tryParse(codeBlock[1], args);
    if (parsed) return parsed;
  }
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) {
    const parsed = tryParse(brace[0], args);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Tries to parse JSON string as quiz.
 */
function tryParse(s: string, args: GenerateArgs): Quiz | null {
  try {
    const p = JSON.parse(s) as Quiz;
    if (!Array.isArray(p.questions) || !p.questions.length) return null;
    const cleaned = p.questions
      .map((q) => {
        if (
          q.type === "mcq" &&
          q.options &&
          q.options.length === 4 &&
          q.options.every((o) => o.length === 1)
        ) {
          return null;
        }
        if (typeof q.stem !== "string" || typeof q.answer !== "string")
          return null;
        if (q.type === "mcq" && (!q.options || q.options.length !== 4))
          return null;
        return q;
      })
      .filter((q): q is QuizQuestion => q !== null);
    if (cleaned.length)
      return { questions: cleaned.slice(0, args.numQuestions) };
  } catch {}
  return null;
}
