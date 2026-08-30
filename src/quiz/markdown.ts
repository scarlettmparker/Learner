import type { WikiSummary, RelatedTopic } from "../sources/wikipedia.js";

export type MarkdownArgs = {
  topic: string;
  summary: WikiSummary;
  answers: Array<{
    question: string;
    myAnswer: string;
    correct: boolean;
    correctAnswer: string;
    explanation?: string;
  }>;
  gaps: string[];
  related: RelatedTopic[];
  pageUrl: string;
};

/**
 * Builds markdown for child blog, mostly verbatim answers + wiki, minimal LLM.
 */
export function buildMarkdown(args: MarkdownArgs): string {
  const lines: string[] = [];
  lines.push(`Source: [${args.summary.title}](${args.pageUrl})`);
  lines.push("");
  lines.push("### What was researched");
  lines.push(`> ${args.summary.extract}`);
  lines.push("");
  lines.push("### What I answered");
  args.answers.forEach((a, idx) => {
    lines.push(`${idx + 1}. ${a.question}`);
    lines.push(`   - My answer: ${a.myAnswer}`);
    lines.push(
      `   - ${a.correct ? "Correct" : `Wrong — correct: ${a.correctAnswer}`}`,
    );
    if (a.explanation) lines.push(`   - ${a.explanation}`);
  });
  lines.push("");
  lines.push("### Gaps");
  if (args.gaps.length) {
    args.gaps.forEach((g) => lines.push(`- ${g}`));
  } else {
    lines.push("- none — all correct");
  }
  if (args.related.length) {
    lines.push("");
    lines.push("### Related");
    args.related.forEach((r) => lines.push(`- [${r.title}](${r.pageUrl})`));
  }
  return lines.join("\n");
}
