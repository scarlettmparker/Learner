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
   * Full page plaintext excerpt.
   */
  fullPage?: string | null;
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
  /**
   * Whether mastery advanced content used.
   */
  mastery?: boolean;
};

/**
 * Escapes pipe characters for markdown table.
 *
 * @param value - cell value
 * @returns escaped value
 */
function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * Builds markdown for child blog, mostly verbatim answers + wiki, minimal LLM.
 */
export function buildMarkdown(args: MarkdownArgs): string {
  const lines: string[] = [];
  if (args.mastery)
    lines.push("> Mastery detected - expanded to advanced material");
  if (args.mastery) lines.push("");
  lines.push(`Source: [${args.summary.title}](${args.pageUrl})`);
  lines.push("");
  lines.push("### What was researched");
  lines.push(`> ${args.summary.extract}`);
  if (args.fullPage) {
    lines.push("");
    lines.push("### Full page excerpt");
    lines.push(
      `> ${args.fullPage.slice(0, 2000)}${args.fullPage.length > 2000 ? "…" : ""}`,
    );
  }
  lines.push("");
  lines.push("### What I answered");
  lines.push("| # | Q | My answer | Correct | Explain |");
  lines.push("|---|---|---|---|---|");
  args.answers.forEach((a, idx) => {
    const myAns = escapeCell(a.myAnswer);
    const q = escapeCell(a.question);
    const corr = escapeCell(a.correctAnswer);
    const expl = escapeCell(a.explanation ?? "");
    const mark = a.correct ? "[x]" : "[ ]";
    lines.push(`| ${idx + 1} | ${q} | ${myAns} | ${mark} ${corr} | ${expl} |`);
  });
  lines.push("");
  lines.push("### Gaps");
  if (args.gaps.length) args.gaps.forEach((g) => lines.push(`- ${g}`));
  else lines.push("- none - all correct");
  if (args.related.length) {
    lines.push("");
    lines.push("### Related");
    args.related.forEach((r) => lines.push(`- [${r.title}](${r.pageUrl})`));
  }
  return lines.join("\n");
}
