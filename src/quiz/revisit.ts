import { callLLM } from "../llm/client.js";
import { loadConfig } from "../config.js";

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

export type ReadinessResult = {
  /**
   * Ready for advanced content.
   */
  ready: boolean;
  /**
   * Gaps to refocus.
   */
  gaps: string[];
  /**
   * Suggested advanced topics.
   */
  suggestedTopics: string[];
};

/**
 * Extracts prior attempts from blog content with date headers.
 */
export function extractPriorAttempts(content: string): PriorAttempt[] {
  const attempts: PriorAttempt[] = [];
  const sections = content.split(/^##\s+/m);
  for (const section of sections) {
    const attempt = parseAttemptSection(section);
    if (attempt) attempts.push(attempt);
  }
  return attempts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Parses a single attempt section.
 *
 * @param section - raw section text
 * @returns parsed attempt or null
 */
function parseAttemptSection(section: string): PriorAttempt | null {
  const headerMatch = section.match(/^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/);
  if (!headerMatch) return null;
  const date = parseDate(headerMatch[1]);
  if (!date) return null;
  const gaps = extractGaps(section);
  const score = section.match(/\|.*\|.*\|.*\|/) ? "has attempts" : "";
  return { date, gaps, score };
}

/**
 * Parses DD/MM/YYYY HH:MM:SS to Date.
 *
 * @param dateStr - date header
 * @returns Date or null
 */
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.match(
    /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/,
  );
  if (!parts) return null;
  const day = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1;
  const year = parseInt(parts[3], 10);
  const hour = parseInt(parts[4], 10);
  const minute = parseInt(parts[5], 10);
  const second = parseInt(parts[6], 10);
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Extracts gaps list from section.
 *
 * @param section - section text
 * @returns gaps
 */
function extractGaps(section: string): string[] {
  const gapsMatch = section.match(/### Gaps\s+([\s\S]*?)(?:###|$)/);
  if (!gapsMatch) return [];
  const gaps: string[] = [];
  const lines = gapsMatch[1].split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") && !trimmed.includes("none - all correct")) {
      gaps.push(trimmed.replace(/^-+\s*/, "").trim());
    }
  }
  return gaps;
}

/**
 * Filters gaps for Anki-style repetition based on time.
 */
export function filterGapsForRepetition(attempts: PriorAttempt[]): string[] {
  if (!attempts.length) return [];
  const now = new Date();
  const dueGaps: string[] = [];
  for (const attempt of attempts) {
    const daysSince =
      (now.getTime() - attempt.date.getTime()) / (1000 * 60 * 60 * 24);
    let interval = 1;
    if (attempts.length > 1) interval = 3;
    if (attempts.length > 2) interval = 7;
    if (daysSince >= interval || attempt.gaps.length > 0) {
      for (const gap of attempt.gaps) {
        if (!dueGaps.includes(gap)) dueGaps.push(gap);
      }
    }
    if (dueGaps.length >= 5) break;
  }
  return dueGaps.slice(0, 5);
}

/**
 * Builds prior context string for LLM from attempts.
 */
export function buildPriorContextFromAttempts(
  attempts: PriorAttempt[],
): string {
  if (!attempts.length) return "";
  const latest = attempts[0];
  const dueGaps = filterGapsForRepetition(attempts);
  let context = `Prior attempts: ${attempts.length}, latest ${latest.date.toLocaleDateString()} with gaps: ${latest.gaps.join(", ") || "none"}.`;
  if (dueGaps.length) context += ` Due for repetition: ${dueGaps.join(", ")}.`;
  if (attempts.length > 1)
    context += ` Recent history shows ${attempts.length} prior sessions.`;
  return context;
}

/**
 * LLM-judged readiness for advanced content.
 *
 * @param attempts - prior attempts
 * @param summaryExtract - extract context
 * @param relatedTitles - related titles
 * @returns readiness result
 */
export async function assessReadiness(
  attempts: PriorAttempt[],
  summaryExtract: string,
  relatedTitles: string[],
): Promise<ReadinessResult> {
  if (!attempts.length) return { ready: false, gaps: [], suggestedTopics: [] };
  const gaps = filterGapsForRepetition(attempts);
  const hasPerfect = attempts[0]?.gaps.length === 0;
  if (!hasPerfect && gaps.length === 0)
    return { ready: false, gaps, suggestedTopics: [] };
  try {
    const system = {
      role: "system" as const,
      content:
        "You judge if a learner is ready for advanced material. Return JSON {ready:boolean,gaps:string[],suggestedTopics:string[]} only. Spend minimal thinking, no chain-of-thought, direct JSON. ready true when last attempt has no gaps and at least 2 attempts or gaps are minor.",
    };
    const user = {
      role: "user" as const,
      content: `Attempts: ${attempts.length}, latest gaps: ${gaps.join(", ") || "none"}, summary: ${summaryExtract.slice(0, 600)}, related: ${relatedTitles.join(", ")}`,
    };
    const config = loadConfig();
    const text = await callLLM([system, user], {
      effort: config.fastReasoningEffort,
      verbosity: config.fastVerbosity,
      maxOutputTokens: config.assessMaxTokens,
    });
    const parsed = JSON.parse(text) as ReadinessResult;
    if (typeof parsed.ready === "boolean") {
      return {
        ready: parsed.ready,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : gaps,
        suggestedTopics: Array.isArray(parsed.suggestedTopics)
          ? parsed.suggestedTopics
          : [],
      };
    }
  } catch {
    // fall through to heuristic
  }
  const ready = attempts.length >= 2 && hasPerfect && gaps.length === 0;
  return { ready, gaps, suggestedTopics: [] };
}
