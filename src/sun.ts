import chalk from "chalk";
import { executeGraphQL } from "./auth.js";
import {
  BlogPostTypesDocument,
  type BlogPostTypesQuery,
  ChildrenDocument,
  type ChildrenQuery,
  type ChildrenQueryVariables,
  CreateBlogPostDocument,
  type CreateBlogPostMutation,
  type CreateBlogPostMutationVariables,
  ListBlogPostsDocument,
  type ListBlogPostsQuery,
  type ListBlogPostsQueryVariables,
} from "./generated/graphql.js";
import { promptInput } from "./quiz/prompt.js";

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

/**
 * Lists top-level KNOWLEDGE parents.
 */
export async function listKnowledgeParents(
  token: string,
): Promise<KnowledgeParent[]> {
  const data = await executeGraphQL<ListBlogPostsQuery>(
    ListBlogPostsDocument,
    {
      pagination: {
        size: 50,
        filters: [
          { field: "type.name", operator: "EQUALS", value: "KNOWLEDGE" },
        ],
        sorts: [{ field: "lastUpdatedAt", dir: "DESC" }],
      },
    } as ListBlogPostsQueryVariables,
    token,
  );
  const items = data?.blogQueries?.listBlogPosts?.items ?? [];
  return items.map((p) => ({ id: p.id, title: p.title }));
}

/**
 * Lists children of a parent.
 */
export async function listChildren(
  parentId: string,
  token: string,
): Promise<KnowledgeParent[]> {
  const data = await executeGraphQL<ChildrenQuery>(
    ChildrenDocument,
    { parentId, pagination: { size: 50 } } as ChildrenQueryVariables,
    token,
  );
  const items = data?.blogQueries?.children?.items ?? [];
  return items.map((p) => ({ id: p.id, title: p.title }));
}

/**
 * Finds parent by fuzzy MATCHES title under KNOWLEDGE.
 */
export async function findParentByTitleFuzzy(
  title: string,
  token: string,
): Promise<KnowledgeParent | null> {
  const data = await executeGraphQL<ListBlogPostsQuery>(
    ListBlogPostsDocument,
    {
      pagination: {
        size: 10,
        filters: [
          { field: "type.name", operator: "EQUALS", value: "KNOWLEDGE" },
          { field: "title", operator: "MATCHES", value: title },
        ],
      },
    } as ListBlogPostsQueryVariables,
    token,
  );
  const items = data?.blogQueries?.listBlogPosts?.items ?? [];
  return items.length ? { id: items[0].id, title: items[0].title } : null;
}

/**
 * Creates a child blog under parent (or top-level if parentId null).
 */
export async function createChildBlog(
  params: {
    title: string;
    content: string;
    parentId: string | null;
    parentTypeName?: string | null;
  },
  token: string,
): Promise<string> {
  let typeId: string | null = null;
  if (params.parentTypeName) {
    const typeData = await executeGraphQL<BlogPostTypesQuery>(
      BlogPostTypesDocument,
      {},
      token,
    );
    const found = typeData?.blogQueries?.blogPostTypes?.find(
      (t) => t.name === params.parentTypeName,
    );
    if (found) typeId = found.id;
  }
  if (!typeId) {
    const typeData = await executeGraphQL<BlogPostTypesQuery>(
      BlogPostTypesDocument,
      {},
      token,
    );
    const knowledge = typeData?.blogQueries?.blogPostTypes?.find(
      (t) => t.name === "KNOWLEDGE",
    );
    if (!knowledge) throw new Error("KNOWLEDGE type not found");
    typeId = knowledge.id;
  }
  const data = await executeGraphQL<CreateBlogPostMutation>(
    CreateBlogPostDocument,
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
    } as CreateBlogPostMutationVariables,
    token,
  );
  const result = data?.blogMutations?.createBlogPost;
  if (!result || result.__typename !== "QuerySuccess" || !result.id) {
    throw new Error(
      (result as { message?: string })?.message ?? "Failed to create blog post",
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
 * Interactively picks a parent via enquirer.
 */
export async function pickParentInteractive(
  token: string,
  suggested: KnowledgeParent | null = null,
): Promise<PickParentResult> {
  const parents = await listKnowledgeParents(token);
  let ordered = parents;
  if (suggested) {
    ordered = [suggested, ...parents.filter((p) => p.id !== suggested.id)];
  }
  const choices: Array<{
    display: string;
    value: string | null;
    title: string | null;
  }> = [
    ...ordered.map((p) => ({
      display: p.id === suggested?.id ? `${p.title} (suggested)` : p.title,
      value: p.id,
      title: p.title,
    })),
    { display: "[Create new top-level KNOWLEDGE]", value: null, title: null },
  ];
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
    const parents = await listKnowledgeParents(token);
    const candidates = parents
      .filter((p) => p.title.toLowerCase().includes(topic.toLowerCase()))
      .slice(0, 3);
    return candidates.map((c) => c.title).join(", ");
  } catch {
    return "";
  }
}
