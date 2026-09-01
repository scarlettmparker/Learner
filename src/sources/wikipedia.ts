import {
  wikipediaPage as apiWikipediaPage,
  wikipediaRelatedTopics as apiWikipediaRelatedTopics,
  wikipediaSearch as apiWikipediaSearch,
  wikipediaSummary as apiWikipediaSummary,
} from "../api.js";

export type WikiSummary = {
  /**
   * Page title.
   */
  title: string;
  /**
   * Plaintext extract.
   */
  extract: string;
  /**
   * Desktop page URL.
   */
  pageUrl: string;
  /**
   * Thumbnail URL.
   */
  thumbnailUrl?: string | null;
};

export type RelatedTopic = {
  /**
   * Related title.
   */
  title: string;
  /**
   * Page URL.
   */
  pageUrl: string;
  /**
   * Short extract.
   */
  extract?: string | null;
};



/**
 * Encodes wiki URL parens for markdown safety.
 *
 * @param url - raw wiki URL
 * @returns encoded URL with ( and ) as %28 %29
 */
function encodeWikiUrl(url: string): string {
  return url.replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/**
 * Maps raw summary to WikiSummary.
 *
 * @param raw - raw summary fields
 * @param fallbackTitle - title for pageUrl fallback
 * @returns mapped summary or null
 */
function mapSummary(
  raw: {
    title: string;
    extract?: string | null;
    pageUrl?: string | null;
    thumbnailUrl?: string | null;
  },
  fallbackTitle: string,
): WikiSummary | null {
  if (!raw.extract) return null;
  return {
    title: raw.title,
    extract: raw.extract,
    pageUrl: raw.pageUrl
      ? encodeWikiUrl(raw.pageUrl)
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(fallbackTitle)}`,
    thumbnailUrl: raw.thumbnailUrl ?? null,
  };
}

/**
 * Searches Wikipedia for closest matches via opensearch.
 */
export async function searchWikipedia(
  query: string,
  token: string,
): Promise<WikiSummary[]> {
  const results = await apiWikipediaSearch(query, token);
  return results
    .map((r) => mapSummary(r as never, r.title))
    .filter((r): r is WikiSummary => r !== null);
}

/**
 * Fetches summary via Sun's wikiQueries, falling back to search for closest match.
 */
export async function fetchWikipediaSummary(
  topic: string,
  token: string,
): Promise<WikiSummary | null> {
  const summary = await apiWikipediaSummary(topic, token);
  if (summary?.extract) {
    const mapped = mapSummary(summary as never, topic);
    if (mapped) return mapped;
  }
  const searchResults = await searchWikipedia(topic, token);
  if (searchResults.length) return searchResults[0];
  return null;
}

/**
 * Fetches full plaintext for a page via explaintext.
 */
export async function fetchWikipediaPage(
  topic: string,
  token: string,
): Promise<string | null> {
  const text = await apiWikipediaPage(topic, token);
  if (!text || !text.trim()) return null;
  return text;
}

/**
 * Fetches related topics via Sun's wikiQueries.
 */
export async function fetchRelatedTopics(
  topic: string,
  token: string,
): Promise<RelatedTopic[]> {
  const topics = await apiWikipediaRelatedTopics(topic, token);
  return topics.map((r) => ({
    title: r.title,
    pageUrl: encodeWikiUrl(r.pageUrl),
    extract: r.extract ?? null,
  }));
}
