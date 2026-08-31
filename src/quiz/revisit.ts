export type PriorAttempt = {
  /**
   * Date of attempt.
   */
  date: Date;
  /**
   * Gaps from that attempt.
   */
  gaps: string[];
  /**
   * Score.
   */
  score: string;
};

/**
 * Extracts prior attempts from blog content with date headers.
 */
export function extractPriorAttempts(content: string): PriorAttempt[] {
  const attempts: PriorAttempt[] = [];
  const sections = content.split(/^##\s+/m);

  for (const section of sections) {
    const headerMatch = section.match(
      /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/,
    );
    if (!headerMatch) {
      continue;
    }

    const dateStr = headerMatch[1];
    const dateParts = dateStr.match(
      /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/,
    );
    if (!dateParts) {
      continue;
    }

    const day = parseInt(dateParts[1], 10);
    const month = parseInt(dateParts[2], 10) - 1;
    const year = parseInt(dateParts[3], 10);
    const hour = parseInt(dateParts[4], 10);
    const minute = parseInt(dateParts[5], 10);
    const second = parseInt(dateParts[6], 10);
    const date = new Date(year, month, day, hour, minute, second);

    const gapsMatch = section.match(/### Gaps\s+([\s\S]*?)(?:###|$)/);
    const gaps: string[] = [];
    if (gapsMatch) {
      const gapLines = gapsMatch[1].split("\n");
      for (const line of gapLines) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("- ") &&
          !trimmed.includes("none - all correct")
        ) {
          gaps.push(trimmed.replace(/^-+\s*/, "").trim());
        }
      }
    }

    const scoreMatch = section.match(/\|.*\|.*\|.*\|/);
    const score = scoreMatch ? "has attempts" : "";

    attempts.push({ date, gaps, score });
  }

  return attempts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Filters gaps for Anki-style repetition based on time.
 */
export function filterGapsForRepetition(attempts: PriorAttempt[]): string[] {
  if (!attempts.length) {
    return [];
  }

  const now = new Date();
  const dueGaps: string[] = [];

  for (const attempt of attempts) {
    const daysSince =
      (now.getTime() - attempt.date.getTime()) / (1000 * 60 * 60 * 24);

    // Simple SM-2 like: if gaps exist and enough time has passed, surface them.
    // First attempt gaps are always due. Later gaps decay.
    let interval = 1;
    if (attempts.length > 1) {
      interval = 3;
    }
    if (attempts.length > 2) {
      interval = 7;
    }

    if (daysSince >= interval || attempt.gaps.length > 0) {
      for (const gap of attempt.gaps) {
        if (!dueGaps.includes(gap)) {
          dueGaps.push(gap);
        }
      }
    }

    // Only consider most recent 3 attempts for due gaps to keep focused.
    if (dueGaps.length >= 5) {
      break;
    }
  }

  return dueGaps.slice(0, 5);
}

/**
 * Builds prior context string for LLM from attempts.
 */
export function buildPriorContextFromAttempts(
  attempts: PriorAttempt[],
): string {
  if (!attempts.length) {
    return "";
  }

  const latest = attempts[0];
  const dueGaps = filterGapsForRepetition(attempts);

  let context = `Prior attempts: ${attempts.length}, latest ${latest.date.toLocaleDateString()} with gaps: ${latest.gaps.join(", ") || "none"}.`;

  if (dueGaps.length) {
    context += ` Due for repetition: ${dueGaps.join(", ")}.`;
  }

  if (attempts.length > 1) {
    context += ` Recent history shows ${attempts.length} prior sessions.`;
  }

  return context;
}
