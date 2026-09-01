export type SourceSpan = {
  /**
   * Span id.
   */
  id: number;
  /**
   * Verbatim span text.
   */
  text: string;
};

/**
 * Extracts distinct source spans for quiz.
 *
 * @param sourceText - wiki extract plus full page plus prior blog
 * @returns spans
 */
export function extractSourceSpans(sourceText: string): SourceSpan[] {
  const sentences = sourceText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 300);
  const seen = new Set<string>();
  const spans: SourceSpan[] = [];
  let id = 1;
  for (const s of sentences) {
    const norm = s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(norm)) continue;
    seen.add(norm);
    spans.push({ id: id++, text: s });
    if (spans.length >= 25) break;
  }
  if (spans.length < 10) {
    const chunks = sourceText.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
    for (const c of chunks) {
      if (spans.length >= 25) break;
      const norm = c.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
      if (seen.has(norm)) continue;
      seen.add(norm);
      spans.push({ id: id++, text: c.slice(0, 250) });
    }
  }
  return spans;
}

/**
 * Formats spans for prompt.
 *
 * @param spans - source spans
 * @returns prompt block
 */
export function formatSpansForPrompt(spans: SourceSpan[]): string {
  return spans.map((s) => `${s.id}. "${s.text}"`).join("\n");
}
