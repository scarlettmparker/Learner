export type WikiSummary = {
  title: string;
  extract: string;
  pageUrl: string;
  thumbnailUrl?: string | null;
  related: string[];
};

/**
 * Fetches summary via direct Wikipedia REST (no Sun auth needed, mirrors sun-service).
 * Falls back to Sun's wikiQueries if direct fails and token provided.
 */
export async function fetchWikipediaSummary(topic: string, token?: string): Promise<WikiSummary | null> {
  const enc = encodeURIComponent(topic.trim());
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`, {
      headers: { "User-Agent": "SunLearn/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
      thumbnail?: { source?: string };
    };
    if (!data.extract) return null;
    const pageUrl = data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${enc}`;
    const related = await fetchRelatedTopics(topic);
    return { title: data.title, extract: data.extract, pageUrl, thumbnailUrl: data.thumbnail?.source ?? null, related };
  } catch {
    return null;
  }
}

async function fetchRelatedTopics(topic: string): Promise<string[]> {
  const enc = encodeURIComponent(topic.trim().replace(/ /g, "_"));
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/html/${enc}`, {
      headers: { "User-Agent": "SunLearn/1.0" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const seeAlsoIdx = html.indexOf("See also");
    const slice = seeAlsoIdx >= 0 ? html.slice(seeAlsoIdx, seeAlsoIdx + 4000) : html.slice(0, 4000);
    const links = [...slice.matchAll(/<a[^>]+href="\/wiki\/([^"#]+)"[^>]*>([^<]+)<\/a>/g)]
      .map((m) => decodeURIComponent(m[2].replace(/_/g, " ")))
      .filter((t) => t.length > 2 && !t.includes(":"))
      .slice(0, 5);
    return [...new Set(links)].slice(0, 3);
  } catch {
    return [];
  }
}
