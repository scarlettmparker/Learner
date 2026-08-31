---
name: wiki-context-fetcher
description: Use when fetching Wikipedia context via Sun GraphQL for Learner. Wraps summary/page/search/related with caching and fallback rules.
---

# Wiki context fetcher

Wraps Sun's `wikiQueries` via `executeGraphQL` with `X-Forwarded-For` headers (see `src/auth.ts`). Never synthesize `WikiSummary` from blog data — blog content only enters via `priorContext` labelled explicitly.

Operations:

- `fetchWikipediaSummary(title,token)` -> `WikipediaSummaryDocument` `wikiQueries.wikipediaSummary(title)`. On null, fallback to `searchWikipedia(title)` first result. Do not fallback to blog. Cache 24h via backend `CaffeineSpec` key `title.toLowerCase().trim()`.
- `fetchWikipediaPage(title,token)` -> `wikipediaPage(title)` plaintext via `action=query&prop=extracts&explaintext` capped 12000, sliced 0..8000 for prompt. Plaintext not HTML (`mobile-sections` HTML avoided — we care about context). Cache `wikipediaPage` 24h 100 entries.
- `fetchRelatedTopics(title,token)` -> `wikipediaRelatedTopics(title)` pages with `title/pageUrl/extract`.
- `searchWikipedia(query,token)` -> `wikipediaSearch(query)` via opensearch limit 5, each title mapped via `summary(title)` filtered `extract!=null`.
- For recurring learning, scrape broadly: `searchWikipedia(topic)` + `fetchRelatedTopics(topic)` + `fetchWikipediaPage` for each related top-2 to build context set, plus `listChildren(parentId)` + `findExistingChildByTopic` intent search like on startup to locate existing entries, and always enrich prompt with `fullPage` plaintext even on first encounter.

Encoding: `trimmed.replace(" ","_")` try first then fallback, `encodePath` handling `.` `/` via `URLEncoder.encode(...).replace("+","%20")`. Log `Fetching Wikipedia ... title='{}'`. Use `withThinking` `ora` spinner for each fetch. Keep `loadConfig` env-only `GRAPHQL_ENDPOINT SUN_CLIENT_ID SUN_CLIENT_SECRET OPENAI_API_KEY OPENAI_BASE_URL OPENAI_MODEL` all throw if missing.
