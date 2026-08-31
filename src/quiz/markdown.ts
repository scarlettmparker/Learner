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
 * Cleans detail cell by stripping per-row PageUrl.
 *
 * @param detail - raw detail text
 * @returns cleaned detail
 */
function cleanDetail(detail: string): string {
  return detail.replace(/\s*PageUrl:\s*https?:\/\/\S+/gi, "").trim();
}

/**
 * Builds merged result cell keeping [x]/[ ] .
 *
 * @param myAns - escaped my answer
 * @param corr - escaped correct answer
 * @param correct - whether correct
 * @returns merged cell
 */
function buildResultCell(
  myAns: string,
  corr: string,
  correct: boolean,
): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const same = norm(myAns) === norm(corr);
  if (correct) return same ? `[x] ${myAns}` : `[x] ${myAns} -> ${corr}`;
  return `${myAns} -> [ ] ${corr}`;
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
  lines.push("| # | Q | Result | Detail |");
  lines.push("|---|---|---|---|");
  args.answers.forEach((a, idx) => {
    const q = escapeCell(a.question);
    const myAns = escapeCell(a.myAnswer);
    const corr = escapeCell(a.correctAnswer);
    const detail = escapeCell(cleanDetail(a.explanation ?? ""));
    const result = buildResultCell(myAns, corr, a.correct);
    lines.push(`| ${idx + 1} | ${q} | ${result} | ${detail} |`);
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
