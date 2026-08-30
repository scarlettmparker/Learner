import type { WikiSummary, RelatedTopic } from "../sources/wikipedia.js";

export type MarkdownArgs = {
  /**
   * Topic.
   */
  topic: string;
  /**
   * Wiki summary.
   */
  summary: WikiSummary;
  /**
   * Answers given.
   */
  answers: Array<{
    question: string;
    myAnswer: string;
    correct: boolean;
    correctAnswer: string;
    explanation?: string;
  }>;
  /**
   * Gaps (wrong questions).
   */
  gaps: string[];
  /**
   * Related topics.
   */
  related: RelatedTopic[];
  /**
   * Page URL.
   */
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
  lines.push("| # | Q | My answer | Correct | Explain |");
  lines.push("|---|---|---|---|---|");
  args.answers.forEach((a, idx) => {
    const myAns = a.myAnswer.replace(/\|/g, "\\|");
    const q = a.question.replace(/\|/g, "\\|").replace(/\n/g, " ");
    const corr = a.correctAnswer.replace(/\|/g, "\\|").replace(/\n/g, " ");
    const expl = (a.explanation ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
    const mark = a.correct ? "[x]" : "[ ]";
    lines.push(`| ${idx + 1} | ${q} | ${myAns} | ${mark} ${corr} | ${expl} |`);
  });
  lines.push("");
  lines.push("### Gaps");
  if (args.gaps.length) {
    args.gaps.forEach((g) => lines.push(`- ${g}`));
  } else {
    lines.push("- none - all correct");
  }
  if (args.related.length) {
    lines.push("");
    lines.push("### Related");
    args.related.forEach((r) => lines.push(`- [${r.title}](${r.pageUrl})`));
  }
  return lines.join("\n");
}
