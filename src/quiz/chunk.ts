/**
 * Splits a full plaintext page into section chunks.
 *
 * @param text - full page plaintext
 * @param maxChars - max chars per chunk
 * @returns chunks with headings
 */
export function chunkPage(text: string, maxChars = 4000): string[] {
  if (!text.trim()) return [];
  const sections = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const section of sections) {
    if ((current + "\n\n" + section).length <= maxChars) {
      current = current ? `${current}\n\n${section}` : section;
    } else {
      if (current) chunks.push(current);
      if (section.length > maxChars) {
        for (let i = 0; i < section.length; i += maxChars) {
          chunks.push(section.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = section;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

/**
 * Samples chunks for a larger quiz with persistent awareness.
 *
 * @param chunks - all chunks
 * @param priorContext - prior titles and gaps
 * @param count - number of chunks to sample
 * @returns sampled chunk text
 */
export function sampleChunksForQuiz(
  chunks: string[],
  priorContext: string,
  count = 3,
): string {
  if (chunks.length <= count) return chunks.join("\n\n---\n\n");
  const priorLower = priorContext.toLowerCase();
  const scored = chunks.map((c, idx) => {
    const lower = c.toLowerCase();
    let score = 0;
    if (priorLower.includes(lower.slice(0, 80).toLowerCase())) score += 1;
    score += Math.random() * 0.5;
    return { idx, score, text: c };
  });
  scored.sort((a, b) => a.score - b.score);
  const sampled = scored.slice(0, count).sort((a, b) => a.idx - b.idx).map((s) => s.text);
  return sampled.join("\n\n---\n\n");
}
