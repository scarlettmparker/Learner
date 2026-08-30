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
  title: string;
  extract: string;
  pageUrl: string;
  thumbnailUrl?: string | null;
};

export type RelatedTopic = {
  title: string;
  pageUrl: string;
  extract?: string | null;
};

/**
 * Searches Wikipedia for closest matches.
 */
export async function searchWikipedia(query: string, token: string): Promise<WikiSummary[]> {
  const data = await executeGraphQL<WikipediaSearchQuery>(
    WikipediaSearchDocument,
    { query } as WikipediaSearchQueryVariables,
    token,
  );
  const results = data.wikiQueries?.wikipediaSearch ?? [];
  return results
    .filter((r) => r.extract)
    .map((r) => ({
      title: r.title,
      extract: r.extract as string,
      pageUrl: r.pageUrl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
      thumbnailUrl: r.thumbnailUrl ?? null,
    }));
}

/**
 * Fetches summary via Sun's wikiQueries, falling back to search for closest match.
 */
export async function fetchWikipediaSummary(topic: string, token: string): Promise<WikiSummary | null> {
  const data = await executeGraphQL<WikipediaSummaryQuery>(
    WikipediaSummaryDocument,
    { title: topic } as WikipediaSummaryQueryVariables,
    token,
  );
  const summary = data.wikiQueries?.wikipediaSummary;
  if (summary?.extract) {
    return {
      title: summary.title,
      extract: summary.extract,
      pageUrl: summary.pageUrl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
      thumbnailUrl: summary.thumbnailUrl ?? null,
    };
  }
  const searchResults = await searchWikipedia(topic, token);
  if (searchResults.length) return searchResults[0];
  return null;
}

/**
 * Fetches related topics via Sun's wikiQueries.
 */
export async function fetchRelatedTopics(topic: string, token: string): Promise<RelatedTopic[]> {
  const data = await executeGraphQL<WikipediaRelatedTopicsQuery>(
    WikipediaRelatedTopicsDocument,
    { title: topic } as WikipediaRelatedTopicsQueryVariables,
    token,
  );
  return (data.wikiQueries?.wikipediaRelatedTopics ?? []).map((r) => ({
    title: r.title,
    pageUrl: r.pageUrl,
    extract: r.extract ?? null,
  }));
}
