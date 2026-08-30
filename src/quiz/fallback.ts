import type { GenerateArgs, Quiz } from "./generate.js";

/**
 * Builds fallback quiz from wiki extract without LLM.
 */
export function fallbackQuiz(props: GenerateArgs): Quiz {
  const { topic, summary, related } = props;
  const sentences = summary.extract
    .split(/\. +/)
    .filter((s) => s.length > 30)
    .slice(0, 3);
  const firstSentence = sentences[0] ?? summary.extract.slice(0, 200);
  const stem = firstSentence.endsWith(".") ? `What concept is described as "${firstSentence}"?` : `What is ${topic}?`;

  const distractors: string[] = [];
  for (const r of related) {
    if (r.title.toLowerCase() !== summary.title.toLowerCase()) {
      distractors.push(r.title);
      if (distractors.length >= 3) break;
    }
  }
  const generic = ["Practical reason", "Hypothetical imperative", "Moral law"];
  for (const g of generic) {
    if (distractors.length >= 3) break;
    if (!distractors.includes(g) && g.toLowerCase() !== summary.title.toLowerCase()) {
      distractors.push(g);
    }
  }

  return {
    questions: [
      {
        type: "mcq",
        stem,
        options: [summary.title, ...distractors].slice(0, 4),
        answer: summary.title,
        explanation: firstSentence,
      },
    ],
  };
}
