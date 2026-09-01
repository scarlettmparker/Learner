export type PriorQA = {
  /**
   * Question stem as stored in blog.
   */
  question: string;
  /**
   * Correct answer.
   */
  answer: string;
  /**
   * Learner answer.
   */
  myAnswer: string;
  /**
   * Whether correct.
   */
  correct: boolean;
  /**
   * Detail / wiki span.
   */
  detail: string;
};

export type PriorGaps = string[];

/**
 * Extracts prior Q&A rows from blog markdown.
 *
 * @param content - blog markdown
 * @returns Q&A rows
 */
export function extractPriorQA(content: string): PriorQA[] {
  const rows: PriorQA[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    if (line.includes("| # | Q | Result |")) continue;
    if (line.includes("|---|---|")) continue;
    const cells = splitTableRow(line);
    if (cells.length < 4) continue;
    const q = cells[1]?.trim();
    const result = cells[2]?.trim();
    const detail = cells[3]?.trim();
    if (!q || !result) continue;
    const parsed = parseResultCell(result);
    if (!parsed) continue;
    rows.push({
      question: q,
      answer: parsed.correctAnswer,
      myAnswer: parsed.myAnswer,
      correct: parsed.correct,
      detail: detail ?? "",
    });
  }
  return rows;
}

/**
 * Extracts gaps from blog markdown.
 *
 * @param content - blog markdown
 * @returns gaps
 */
export function extractGapsFromContent(content: string): PriorGaps {
  const gaps: PriorGaps = [];
  const match = content.match(/### Gaps\s+([\s\S]*?)(?:###|##|$)/);
  if (!match) return gaps;
  const section = match[1];
  for (const line of section.split("\n")) {
    const t = line.trim();
    if (t.startsWith("- ") && !t.includes("none - all correct")) {
      gaps.push(t.slice(2).trim());
    }
  }
  return gaps;
}

/**
 * Extracts researched extract block.
 *
 * @param content - blog markdown
 * @returns extract text
 */
export function extractResearchedExtract(content: string): string {
  const m = content.match(/### What was researched\s+>\s*([\s\S]*?)(?:\n###|\n##|$)/);
  if (!m) return "";
  return m[1].replace(/\s+/g, " ").trim();
}

/**
 * Splits a markdown table row into cells.
 *
 * @param row - row line
 * @returns cells
 */
function splitTableRow(row: string): string[] {
  const inner = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((c) => c.trim());
}

/**
 * Parses Result cell like [x] my -> correct or [ ] my -> correct.
 *
 * @param cell - result cell
 * @returns parsed or null
 */
function parseResultCell(
  cell: string,
): { myAnswer: string; correctAnswer: string; correct: boolean } | null {
  const correct = cell.includes("[x]");
  if (cell.includes("->")) {
    const parts = cell.split("->").map((s) => s.trim());
    const left = parts[0] ?? "";
    const right = parts[1] ?? "";
    const my = left.replace(/^\[x\]\s*/, "").replace(/^\[ \]\s*/, "").trim();
    const corr = right.replace(/^\[x\]\s*/, "").replace(/^\[ \]\s*/, "").trim();
    if (!my && !corr) return null;
    return { myAnswer: my || corr, correctAnswer: corr || my, correct };
  }
  const cleaned = cell.replace(/^\[x\]\s*/, "").replace(/^\[ \]\s*/, "").trim();
  if (!cleaned) return null;
  return { myAnswer: cleaned, correctAnswer: cleaned, correct };
}
