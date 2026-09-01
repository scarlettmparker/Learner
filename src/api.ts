import { executeGraphQL } from "./auth.js";
import {
  AddRemoteObjectDocument,
  type AddRemoteObjectMutation,
  type AddRemoteObjectMutationVariables,
  BlogPostTypesDocument,
  type BlogPostTypesQuery,
  ChildrenDocument,
  type ChildrenQuery,
  type ChildrenQueryVariables,
  CreateBlogPostDocument,
  type CreateBlogPostMutation,
  type CreateBlogPostMutationVariables,
  HadesTextsDocument,
  type HadesTextsQuery,
  type HadesTextsQueryVariables,
  IngestBlogFromSourceDocument,
  type IngestBlogFromSourceMutation,
  type IngestBlogFromSourceMutationVariables,
  ListBlogPostsByRemoteObjectsDocument,
  type ListBlogPostsByRemoteObjectsQuery,
  type ListBlogPostsByRemoteObjectsQueryVariables,
  ListBlogPostsDocument,
  type ListBlogPostsQuery,
  type ListBlogPostsQueryVariables,
  LocateBlogPostDocument,
  type LocateBlogPostQuery,
  type LocateBlogPostQueryVariables,
  LocateReaderTextsDocument,
  type LocateReaderTextsQuery,
  type LocateReaderTextsQueryVariables,
  RemoveRemoteObjectDocument,
  type RemoveRemoteObjectMutation,
  type RemoveRemoteObjectMutationVariables,
  UpdateBlogPostDocument,
  type UpdateBlogPostMutation,
  type UpdateBlogPostMutationVariables,
  WikipediaRelatedTopicsDocument,
  type WikipediaRelatedTopicsQuery,
  type WikipediaRelatedTopicsQueryVariables,
  WikipediaSearchDocument,
  type WikipediaSearchQuery,
  type WikipediaSearchQueryVariables,
  WikipediaSummaryDocument,
  type WikipediaSummaryQuery,
  type WikipediaSummaryQueryVariables,
  WiktionaryEntryDocument,
  type WiktionaryEntryQuery,
  type WiktionaryEntryQueryVariables,
} from "./generated/graphql.js";
import { parse } from "graphql";

type WikipediaPageQuery = {
  /**
   * Wiki queries.
   */
  wikiQueries: {
    /**
     * Wiki page text.
     */
    wikipediaPage: string | null;
  };
};

type WikipediaPageVariables = {
  /**
   * Title.
   */
  title: string;
};

const WikipediaPageDocument = parse(
  "query wikipediaPage($title: String!) { wikiQueries { wikipediaPage(title: $title) } }",
);

/**
 * Lists blog posts.
 *
 * @param pagination - pagination input
 * @param token - auth token
 * @returns paged posts
 */
export async function listBlogPosts(
  pagination: ListBlogPostsQueryVariables["pagination"],
  token: string,
) {
  const data = await executeGraphQL<ListBlogPostsQuery>(
    ListBlogPostsDocument,
    { pagination } as ListBlogPostsQueryVariables,
    token,
  );
  return data.blogQueries.listBlogPosts;
}

/**
 * Lists children.
 *
 * @param parentId - parent id
 * @param pagination - pagination input
 * @param token - auth token
 * @returns paged children
 */
export async function listChildrenPaged(
  parentId: string,
  pagination: ChildrenQueryVariables["pagination"],
  token: string,
) {
  const data = await executeGraphQL<ChildrenQuery>(
    ChildrenDocument,
    { parentId, pagination } as ChildrenQueryVariables,
    token,
  );
  return data.blogQueries.children;
}

/**
 * Locates blog post by id.
 *
 * @param id - post id
 * @param token - auth token
 * @returns post or null
 */
export async function locateBlogPost(id: string, token: string) {
  const data = await executeGraphQL<LocateBlogPostQuery>(
    LocateBlogPostDocument,
    { id } as LocateBlogPostQueryVariables,
    token,
  );
  return data.blogQueries.locateBlogPost;
}

/**
 * Lists blog post types.
 *
 * @param token - auth token
 * @returns types
 */
export async function listBlogPostTypes(token: string) {
  const data = await executeGraphQL<BlogPostTypesQuery>(BlogPostTypesDocument, {}, token);
  return data.blogQueries.blogPostTypes;
}

/**
 * Creates blog post.
 *
 * @param variables - create variables
 * @param token - auth token
 * @returns result
 */
export async function createBlogPost(
  variables: CreateBlogPostMutationVariables,
  token: string,
) {
  const data = await executeGraphQL<CreateBlogPostMutation>(
    CreateBlogPostDocument,
    variables,
    token,
  );
  return data.blogMutations.createBlogPost;
}

/**
 * Updates blog post.
 *
 * @param variables - update variables
 * @param token - auth token
 * @returns result
 */
export async function updateBlogPost(
  variables: UpdateBlogPostMutationVariables,
  token: string,
) {
  const data = await executeGraphQL<UpdateBlogPostMutation>(
    UpdateBlogPostDocument,
    variables,
    token,
  );
  return data.blogMutations.updateBlogPost;
}

/**
 * Fetches wikipedia summary.
 *
 * @param title - title
 * @param token - auth token
 * @returns summary
 */
export async function wikipediaSummary(title: string, token: string) {
  const data = await executeGraphQL<WikipediaSummaryQuery>(
    WikipediaSummaryDocument,
    { title } as WikipediaSummaryQueryVariables,
    token,
  );
  return data.wikiQueries.wikipediaSummary;
}

/**
 * Fetches wikipedia page plaintext.
 *
 * @param title - title
 * @param token - auth token
 * @returns page text or null
 */
export async function wikipediaPage(title: string, token: string) {
  const data = await executeGraphQL<WikipediaPageQuery>(
    WikipediaPageDocument as never,
    { title } as WikipediaPageVariables as unknown as Record<string, unknown>,
    token,
  );
  return data.wikiQueries.wikipediaPage;
}

/**
 * Fetches related topics.
 *
 * @param title - title
 * @param token - auth token
 * @returns related topics
 */
export async function wikipediaRelatedTopics(title: string, token: string) {
  const data = await executeGraphQL<WikipediaRelatedTopicsQuery>(
    WikipediaRelatedTopicsDocument,
    { title } as WikipediaRelatedTopicsQueryVariables,
    token,
  );
  return data.wikiQueries.wikipediaRelatedTopics ?? [];
}

/**
 * Searches wikipedia.
 *
 * @param query - search query
 * @param token - auth token
 * @returns summaries
 */
export async function wikipediaSearch(query: string, token: string) {
  const data = await executeGraphQL<WikipediaSearchQuery>(
    WikipediaSearchDocument,
    { query } as WikipediaSearchQueryVariables,
    token,
  );
  return data.wikiQueries.wikipediaSearch ?? [];
}

/**
 * Lists blog posts by remote objects.
 *
 * @param ids - remote ids
 * @param token - auth token
 * @returns posts
 */
export async function listBlogPostsByRemoteObjects(ids: string[], token: string) {
  const data = await executeGraphQL<ListBlogPostsByRemoteObjectsQuery>(
    ListBlogPostsByRemoteObjectsDocument,
    { ids } as ListBlogPostsByRemoteObjectsQueryVariables,
    token,
  );
  return data.blogQueries.listByRemoteObjects ?? [];
}

/**
 * Adds remote object.
 *
 * @param postId - post id
 * @param target - remote target
 * @param token - auth token
 * @returns result
 */
export async function addRemoteObject(postId: string, target: string, token: string) {
  const data = await executeGraphQL<AddRemoteObjectMutation>(
    AddRemoteObjectDocument,
    { postId, target } as AddRemoteObjectMutationVariables,
    token,
  );
  return data.blogMutations.addRemoteObject;
}

/**
 * Removes remote object.
 *
 * @param postId - post id
 * @param target - remote target
 * @param token - auth token
 * @returns result
 */
export async function removeRemoteObject(postId: string, target: string, token: string) {
  const data = await executeGraphQL<RemoveRemoteObjectMutation>(
    RemoveRemoteObjectDocument,
    { postId, target } as RemoveRemoteObjectMutationVariables,
    token,
  );
  return data.blogMutations.removeRemoteObject;
}

/**
 * Ingests blog from source.
 *
 * @param input - ingest input
 * @param token - auth token
 * @returns result
 */
export async function ingestBlogFromSource(
  input: IngestBlogFromSourceMutationVariables["input"],
  token: string,
) {
  const data = await executeGraphQL<IngestBlogFromSourceMutation>(
    IngestBlogFromSourceDocument,
    { input } as IngestBlogFromSourceMutationVariables,
    token,
  );
  return data.blogMutations.ingestBlogFromSource;
}

/**
 * Fetches wiktionary entry.
 *
 * @param word - word
 * @param token - auth token
 * @returns entry
 */
export async function wiktionaryEntry(word: string, token: string) {
  const data = await executeGraphQL<WiktionaryEntryQuery>(
    WiktionaryEntryDocument,
    { word } as WiktionaryEntryQueryVariables,
    token,
  );
  return data.wikiQueries.wiktionaryEntry;
}

/**
 * Lists hades texts.
 *
 * @param pagination - pagination input
 * @param token - auth token
 * @returns paged texts
 */
export async function listHadesTexts(
  pagination: HadesTextsQueryVariables["pagination"],
  token: string,
) {
  const data = await executeGraphQL<HadesTextsQuery>(
    HadesTextsDocument,
    { pagination } as HadesTextsQueryVariables,
    token,
  );
  return data.hadesQueries.texts;
}

/**
 * Locates reader texts.
 *
 * @param ids - text ids
 * @param token - auth token
 * @returns texts
 */
export async function locateReaderTexts(ids: string[], token: string) {
  const data = await executeGraphQL<LocateReaderTextsQuery>(
    LocateReaderTextsDocument,
    { ids } as LocateReaderTextsQueryVariables,
    token,
  );
  return data.hadesQueries.locateReaderTexts ?? [];
}
