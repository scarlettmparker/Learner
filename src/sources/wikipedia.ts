import { parse } from "graphql";
import { executeGraphQL } from "../auth.js";
import {
  WikipediaRelatedTopicsDocument,
  type WikipediaRelatedTopicsQuery,
  type WikipediaRelatedTopicsQueryVariables,
  WikipediaSearchDocument,
  type WikipediaSearchQuery,
  type WikipediaSearchQueryVariables,
  WikipediaSummaryDocument,
  type WikipediaSummaryQuery,
  type WikipediaSummaryQueryVariables,
} from "../generated/graphql.js";

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

type WikipediaPageQuery = {
  wikiQueries: {
    wikipediaPage: string | null;
  };
};

type WikipediaPageVariables = {
  title: string;
};

const WikipediaPageDocument = parse(
  "query wikipediaPage($title: String!) { wikiQueries { wikipediaPage(title: $title) } }",
);

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
  const data = await executeGraphQL<WikipediaSearchQuery>(
    WikipediaSearchDocument,
    { query } as WikipediaSearchQueryVariables,
    token,
  );
  const results = data.wikiQueries?.wikipediaSearch ?? [];
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
  const data = await executeGraphQL<WikipediaSummaryQuery>(
    WikipediaSummaryDocument,
    { title: topic } as WikipediaSummaryQueryVariables,
    token,
  );
  const summary = data.wikiQueries?.wikipediaSummary;
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
  const data = await executeGraphQL<WikipediaPageQuery>(
    WikipediaPageDocument as never,
    { title: topic } as WikipediaPageVariables as unknown as Record<
      string,
      unknown
    >,
    token,
  );
  const text = data.wikiQueries?.wikipediaPage;
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
  const data = await executeGraphQL<WikipediaRelatedTopicsQuery>(
    WikipediaRelatedTopicsDocument,
    { title: topic } as WikipediaRelatedTopicsQueryVariables,
    token,
  );
  return (data.wikiQueries?.wikipediaRelatedTopics ?? []).map((r) => ({
    title: r.title,
    pageUrl: encodeWikiUrl(r.pageUrl),
    extract: r.extract ?? null,
  }));
}
