export type VerifyResult = {
  /**
   * Kept questions.
   */
  kept: import("./generate.js").QuizQuestion[];
  /**
   * Dropped count for feedback.
   */
  droppedHallucinated: number;
  /**
   * Dropped duplicate prior.
   */
  droppedPrior: number;
};

/**
 * Verifies sourcing for quiz questions.
 *
 * @param quiz - parsed quiz
 * @param priorAnswers - normalized prior answer set
 * @returns kept and dropped counts
 */
export function verifyQuiz(
  quiz: import("./generate.js").Quiz,
  priorAnswers: Set<string>,
): VerifyResult {
  const kept: import("./generate.js").QuizQuestion[] = [];
  let droppedHallucinated = 0;
  let droppedPrior = 0;
  for (const q of quiz.questions) {
    if (q.type === "fill" && !hasFillCue(q.stem)) {
      droppedHallucinated++;
      continue;
    }
    if (q.type === "fill" && cueLeaksAnswer(q.stem, q.answer)) {
      droppedHallucinated++;
      continue;
    }
    if (hasSpanLeak(q.stem)) {
      droppedHallucinated++;
      continue;
    }
    const priorNorm = normalizeAnswer(q.answer);
    if (priorAnswers.has(priorNorm)) {
      droppedPrior++;
      continue;
    }
    kept.push(q);
  }
  return { kept, droppedHallucinated, droppedPrior };
}

/**
 * Checks if answer is concrete.
 *
 * @param answer - answer text
 * @returns true if concrete
 */
function isConcreteAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;
  if (/^\d{4}$/.test(trimmed)) return true;
  if (trimmed.length < 3) return false;
  const lower = trimmed.toLowerCase();
  const bannedSingle = new Set(["important", "significant", "crucial", "essential", "major", "very", "really", "somewhat", "quite", "rather", "big", "small", "good", "bad"]);
  if (lower.split(/\s+/).length === 1 && bannedSingle.has(lower)) return false;
  return trimmed.split(/\s+/).length >= 1;
}

/**
 * Checks if text is substring of source.
 *
 * @param text - text to find
 * @param normalizedSource - lower source
 * @returns true if in source
 */
function isInSource(text: string, normalizedSource: string): boolean {
  if (!text.trim()) return false;
  const norm = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!norm) return false;
  if (normalizedSource.includes(norm)) return true;
  if (norm.length >= 12 && normalizedSource.includes(norm.slice(0, 12))) return true;
  const words = norm.split(/\s+/).filter((w) => w.length >= 4);
  if (words.length === 1 && normalizedSource.includes(words[0])) return true;
  return false;
}

/**
 * Normalizes answer for dedup.
 *
 * @param s - answer
 * @returns normalized
 */
function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(\w+)s\b/g, "$1");
}

/**
 * Checks MCQ has single correct.
 *
 * @param q - mcq question
 * @param normalizedSource - lower source
 * @returns true if single correct
 */
function hasSingleCorrect(q: import("./generate.js").QuizQuestion, normalizedSource: string): boolean {
  if (!q.options || q.options.length !== 4) return false;
  const lowerOptions = q.options.map((o) => o.toLowerCase().trim());
  if (new Set(lowerOptions).size !== lowerOptions.length) return false;
  const answerLower = q.answer.toLowerCase().trim();
  if (!lowerOptions.includes(answerLower)) return false;
  let matching = 0;
  for (const opt of lowerOptions) {
    const norm = opt.replace(/[^a-z0-9]+/g, " ").trim();
    if (normalizedSource.includes(norm)) matching++;
  }
  if (matching >= 3) return false;
  return true;
}

/**
 * Checks fill has cue.
 *
 * @param stem - question stem
 * @returns true if cue present
 */
function hasFillCue(stem: string): boolean {
  if (/____\s*\[.+?\]/.test(stem)) return true;
  if (/\?\s*$/.test(stem.trim()) && /____/.test(stem)) return true;
  return false;
}

/**
 * Checks if fill cue leaks the answer.
 *
 * @param stem - question stem
 * @param answer - correct answer
 * @returns true if cue equals answer
 */
function cueLeaksAnswer(stem: string, answer: string): boolean {
  const m = stem.match(/____\s*\[([^\]]+)\]/);
  if (!m) return false;
  const cueNorm = m[1].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(\w+)s\b/g, "$1");
  const ansNorm = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(\w+)s\b/g, "$1");
  if (!cueNorm || !ansNorm) return false;
  if (cueNorm === ansNorm) return true;
  const cueWords = cueNorm.split(/\s+/).filter((w) => w.length >= 3);
  const ansWords = new Set(ansNorm.split(/\s+/).filter((w) => w.length >= 3));
  for (const w of cueWords) if (ansWords.has(w)) return true;
  return false;
}

/**
 * Checks if stem leaks span ID.
 *
 * @param stem - question stem
 * @returns true if leaks
 */
function hasSpanLeak(stem: string): boolean {
  return /\bspan\s*\d+\b/i.test(stem);
}


