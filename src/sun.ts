import chalk from "chalk";
import { FilterOperator, SortDirection } from "./generated/graphql.js";
import { promptInput } from "./quiz/prompt.js";
import {
  createBlogPost as apiCreateBlogPost,
  listBlogPosts as apiListBlogPosts,
  listBlogPostTypes as apiListBlogPostTypes,
  listChildrenPaged as apiChildren,
  locateBlogPost as apiLocateBlogPost,
  updateBlogPost as apiUpdateBlogPost,
  wikipediaSearch as apiWikipediaSearch,
} from "./api.js";

export type KnowledgeParent = {
  /**
   * Parent id.
   */
  id: string;
  /**
   * Parent title.
   */
  title: string;
  /**
   * Optional child count.
   */
  childCount?: number;
};

export type PickParentResult = {
  /**
   * Selected parent id.
   */
  id: string | null;
  /**
   * Selected parent title.
   */
  title: string | null;
};

type CreateChildParams = {
  /**
   * Title with date.
   */
  title: string;
  /**
   * Markdown content.
   */
  content: string;
  /**
   * Parent id or null.
   */
  parentId: string | null;
  /**
   * Parent type name for type resolution.
   */
  parentTypeName?: string | null;
};

/**
 * Maps blog post item to KnowledgeParent.
 *
 * @param item - raw item with id and title
 * @returns KnowledgeParent
 */
function toParent(item: { id: string; title: string }): KnowledgeParent {
  return { id: item.id, title: item.title };
}

/**
 * Resolves type id for KNOWLEDGE or parent type.
 *
 * @param parentTypeName - optional parent type name
 * @param token - auth token
 * @returns type id
 */
async function resolveTypeId(
  parentTypeName: string | null | undefined,
  token: string,
): Promise<string> {
  const types = await apiListBlogPostTypes(token);
  if (parentTypeName) {
    const found = types?.find((t) => t.name === parentTypeName);
    if (found) return found.id;
  }
  const knowledge = types?.find((t) => t.name === "KNOWLEDGE");
  if (!knowledge) throw new Error("KNOWLEDGE type not found");
  return knowledge.id;
}

/**
 * Builds choice display for parent.
 *
 * @param parent - parent to display
 * @param suggested - suggested parent if any
 * @returns display label
 */
function displayForParent(
  parent: KnowledgeParent,
  suggested: KnowledgeParent | null,
): string {
  const isSuggested = parent.id === suggested?.id;
  return isSuggested ? `${parent.title} (suggested)` : parent.title;
}

/**
 * Lists top-level KNOWLEDGE parents.
 */
export async function listKnowledgeParents(
  token: string,
): Promise<KnowledgeParent[]> {
  const paged = await apiListBlogPosts(
    {
      size: 50,
      filters: [{ field: "type.name", operator: FilterOperator.Equals, value: "KNOWLEDGE" }],
      sorts: [{ field: "lastUpdatedAt", dir: SortDirection.Desc }],
    },
    token,
  );
  return (paged.items ?? []).map(toParent);
}

/**
 * Lists children of a parent.
 */
export async function listChildren(
  parentId: string,
  token: string,
): Promise<KnowledgeParent[]> {
  const paged = await apiChildren(
    parentId,
    { size: 50 },
    token,
  );
  return (paged.items ?? []).map(toParent);
}

/**
 * Finds parent by fuzzy MATCHES title under KNOWLEDGE.
 */
export async function findParentByTitleFuzzy(
  title: string,
  token: string,
): Promise<KnowledgeParent | null> {
  const paged = await apiListBlogPosts(
    {
      size: 10,
      filters: [
        { field: "type.name", operator: FilterOperator.Equals, value: "KNOWLEDGE" },
        { field: "title", operator: FilterOperator.Matches, value: title },
      ],
    },
    token,
  );
  const first = (paged.items ?? [])[0];
  return first ? toParent(first) : null;
}

/**
 * Creates a child blog under parent (or top-level if parentId null).
 */
export async function createChildBlog(
  params: CreateChildParams,
  token: string,
): Promise<string> {
  const typeId = await resolveTypeId(params.parentTypeName, token);
  const result = await apiCreateBlogPost(
    {
      title: params.title,
      input: {
        content: params.content,
        typeId,
        parentId: params.parentId ?? undefined,
        language: "en",
        tags: ["learn", "wikipedia"],
        remoteObject: [],
      },
    },
    token,
  );
  if (!result || result.__typename !== "QuerySuccess" || !result.id) {
    throw new Error(
      (result as { message?: string })?.message ?? "Failed to create blog post",
    );
  }
  return result.id;
}

/**
 * Finds existing child under parent matching topic prefix (ignores date suffix).
 */
export async function findExistingChildByTopic(
  parentId: string | null,
  topic: string,
  token: string,
): Promise<{ id: string; title: string; content: string | null } | null> {
  if (!parentId) return null;
  const paged = await apiChildren(
    parentId,
    { size: 5, filters: [{ field: "title", operator: FilterOperator.StartsWith, value: topic }] },
    token,
  );
  const items = paged.items ?? [];
  const match = items[0];
  if (!match) return null;
  const post = await apiLocateBlogPost(match.id, token);
  if (!post) return null;
  return { id: post.id, title: post.title, content: post.content ?? null };
}

/**
 * Updates existing blog content with new markdown.
 */
export async function updateBlog(
  id: string,
  newContent: string,
  token: string,
): Promise<string> {
  const result = await apiUpdateBlogPost({ id, input: { content: newContent } }, token);
  if (!result || result.__typename !== "QuerySuccess" || !result.id) {
    throw new Error(
      (result as { message?: string })?.message ?? "Failed to update blog post",
    );
  }
  return result.id;
}

/**
 * Formats title with DD/MM/YYYY HH:MM:SS.
 */
export function formatTitleWithDate(topic: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${topic} - ${date}`;
}

/**
 * Finds best parent by checking wiki extract for parent titles.
 */
export async function findBestParentByWikiExtract(
  extract: string,
  token: string,
): Promise<KnowledgeParent | null> {
  if (!extract || !extract.trim()) return null;
  const parents = await listKnowledgeParents(token);
  const lower = extract.toLowerCase();
  let best: KnowledgeParent | null = null;
  let bestScore = 0;
  for (const p of parents) {
    const titleLower = p.title.toLowerCase();
    if (lower.includes(titleLower)) {
      const score = titleLower.length;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
  }
  return best;
}

/**
 * Builds ordered parent choices with suggested first.
 *
 * @param parents - all parents
 * @param suggested - suggested parent to order first
 * @returns display choices
 */
function buildParentChoices(
  parents: KnowledgeParent[],
  suggested: KnowledgeParent | null,
) {
  let ordered = parents;
  if (suggested)
    ordered = [suggested, ...parents.filter((p) => p.id !== suggested.id)];
  return [
    ...ordered.map((p) => ({
      display: displayForParent(p, suggested),
      value: p.id,
      title: p.title,
    })),
    {
      display: "[Create new top-level KNOWLEDGE]",
      value: null as string | null,
      title: null as string | null,
    },
  ];
}

/**
 * Interactively picks a parent via enquirer.
 */
export async function pickParentInteractive(
  token: string,
  suggested: KnowledgeParent | null = null,
): Promise<PickParentResult> {
  const parents = await listKnowledgeParents(token);
  const choices = buildParentChoices(parents, suggested);
  const { selected } = await promptInput<{ selected: string }>({
    type: "select",
    name: "selected",
    message: "Select parent for this topic (Enter selects, shows children)",
    choices: choices.map((c) => c.display),
  });
  const chosen = choices.find((c) => c.display === selected);
  if (!chosen || chosen.value === null) return { id: null, title: null };
  const children = await listChildren(chosen.value, token);
  if (children.length) {
    console.log(chalk.dim(`\nChildren of "${chosen.display}":`));
    children.forEach((c) => console.log(`  - ${c.title}`));
    const { action } = await promptInput<{ action: string }>({
      type: "select",
      name: "action",
      message: `Drill into "${chosen.display}"?`,
      choices: ["Select this one", ...children.map((c) => c.title), "[Back]"],
    });
    if (action === "Select this one")
      return { id: chosen.value, title: chosen.title };
    if (action === "[Back]") return pickParentInteractive(token, suggested);
    const child = children.find((c) => c.title === action);
    if (child) return { id: child.id, title: child.title };
  }
  return { id: chosen.value, title: chosen.title };
}

/**
 * Fetches prior context for a topic from KNOWLEDGE titles.
 */
export async function fetchPriorContext(
  topic: string,
  token: string,
): Promise<string> {
  try {
    const paged = await apiListBlogPosts(
      {
        size: 3,
        filters: [
          { field: "type.name", operator: FilterOperator.Equals, value: "KNOWLEDGE" },
          { field: "title", operator: FilterOperator.Matches, value: topic },
        ],
      },
      token,
    );
    return (paged.items ?? []).map((c) => c.title).join(", ");
  } catch {
    return "";
  }
}

/**
 * Fetches advanced topics via Wikipedia search for revisits.
 */
export async function fetchAdvancedTopics(
  topic: string,
  token: string,
  limit = 3,
): Promise<string[]> {
  try {
    const results = await apiWikipediaSearch(topic, token);
    return results
      .map((r) => r.title)
      .filter((t) => t.toLowerCase() !== topic.toLowerCase())
      .slice(0, limit);
  } catch {
    return [];
  }
}
