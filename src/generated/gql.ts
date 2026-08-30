/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation addRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    addRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": typeof types.AddRemoteObjectDocument,
    "query blogPostTypes {\n  blogQueries {\n    blogPostTypes {\n      id\n      name\n      description\n    }\n  }\n}": typeof types.BlogPostTypesDocument,
    "query children($parentId: ID!, $pagination: PaginationInput) {\n  blogQueries {\n    children(parentId: $parentId, pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}": typeof types.ChildrenDocument,
    "mutation createBlogPost($title: String!, $input: BlogPostInput!) {\n  blogMutations {\n    createBlogPost(title: $title, input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": typeof types.CreateBlogPostDocument,
    "mutation ingestBlogFromSource($input: IngestBlogInput!) {\n  blogMutations {\n    ingestBlogFromSource(input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": typeof types.IngestBlogFromSourceDocument,
    "query listBlogPosts($pagination: PaginationInput) {\n  blogQueries {\n    listBlogPosts(pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}": typeof types.ListBlogPostsDocument,
    "query listBlogPostsByRemoteObjects($ids: [String!]!) {\n  blogQueries {\n    listByRemoteObjects(ids: $ids) {\n      id\n      title\n      type {\n        id\n        name\n      }\n    }\n  }\n}": typeof types.ListBlogPostsByRemoteObjectsDocument,
    "query locateBlogPost($id: ID!) {\n  blogQueries {\n    locateBlogPost(id: $id) {\n      id\n      title\n      content\n      tags\n      remoteObject\n      language\n      parentId\n      parent {\n        id\n        title\n        parent {\n          id\n          title\n        }\n      }\n      type {\n        id\n        name\n      }\n      attachedTexts {\n        id\n        title\n        language\n        level\n        status\n      }\n      createdAt\n      updatedAt\n    }\n  }\n}": typeof types.LocateBlogPostDocument,
    "mutation removeRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    removeRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": typeof types.RemoveRemoteObjectDocument,
    "mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n    }\n  }\n}": typeof types.LoginDocument,
    "query me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n      status\n      createdAt\n      updatedAt\n    }\n  }\n}": typeof types.MeDocument,
    "query hadesTexts($pagination: PaginationInput) {\n  hadesQueries {\n    texts(pagination: $pagination) {\n      items {\n        id\n        title\n        language\n        level\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}": typeof types.HadesTextsDocument,
    "query locateReaderTexts($ids: [ID!]!) {\n  hadesQueries {\n    locateReaderTexts(ids: $ids) {\n      id\n      title\n      language\n      level\n      status\n    }\n  }\n}": typeof types.LocateReaderTextsDocument,
    "query wikipediaSummary($title: String!) {\n  wikiQueries {\n    wikipediaSummary(title: $title) {\n      title\n      extract\n      pageUrl\n      thumbnailUrl\n    }\n  }\n}": typeof types.WikipediaSummaryDocument,
    "query wiktionaryEntry($word: String!) {\n  wikiQueries {\n    wiktionaryEntry(word: $word) {\n      word\n      definitions\n      sourceUrl\n    }\n  }\n}": typeof types.WiktionaryEntryDocument,
};
const documents: Documents = {
    "mutation addRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    addRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": types.AddRemoteObjectDocument,
    "query blogPostTypes {\n  blogQueries {\n    blogPostTypes {\n      id\n      name\n      description\n    }\n  }\n}": types.BlogPostTypesDocument,
    "query children($parentId: ID!, $pagination: PaginationInput) {\n  blogQueries {\n    children(parentId: $parentId, pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}": types.ChildrenDocument,
    "mutation createBlogPost($title: String!, $input: BlogPostInput!) {\n  blogMutations {\n    createBlogPost(title: $title, input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": types.CreateBlogPostDocument,
    "mutation ingestBlogFromSource($input: IngestBlogInput!) {\n  blogMutations {\n    ingestBlogFromSource(input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": types.IngestBlogFromSourceDocument,
    "query listBlogPosts($pagination: PaginationInput) {\n  blogQueries {\n    listBlogPosts(pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}": types.ListBlogPostsDocument,
    "query listBlogPostsByRemoteObjects($ids: [String!]!) {\n  blogQueries {\n    listByRemoteObjects(ids: $ids) {\n      id\n      title\n      type {\n        id\n        name\n      }\n    }\n  }\n}": types.ListBlogPostsByRemoteObjectsDocument,
    "query locateBlogPost($id: ID!) {\n  blogQueries {\n    locateBlogPost(id: $id) {\n      id\n      title\n      content\n      tags\n      remoteObject\n      language\n      parentId\n      parent {\n        id\n        title\n        parent {\n          id\n          title\n        }\n      }\n      type {\n        id\n        name\n      }\n      attachedTexts {\n        id\n        title\n        language\n        level\n        status\n      }\n      createdAt\n      updatedAt\n    }\n  }\n}": types.LocateBlogPostDocument,
    "mutation removeRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    removeRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}": types.RemoveRemoteObjectDocument,
    "mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n    }\n  }\n}": types.LoginDocument,
    "query me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n      status\n      createdAt\n      updatedAt\n    }\n  }\n}": types.MeDocument,
    "query hadesTexts($pagination: PaginationInput) {\n  hadesQueries {\n    texts(pagination: $pagination) {\n      items {\n        id\n        title\n        language\n        level\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}": types.HadesTextsDocument,
    "query locateReaderTexts($ids: [ID!]!) {\n  hadesQueries {\n    locateReaderTexts(ids: $ids) {\n      id\n      title\n      language\n      level\n      status\n    }\n  }\n}": types.LocateReaderTextsDocument,
    "query wikipediaSummary($title: String!) {\n  wikiQueries {\n    wikipediaSummary(title: $title) {\n      title\n      extract\n      pageUrl\n      thumbnailUrl\n    }\n  }\n}": types.WikipediaSummaryDocument,
    "query wiktionaryEntry($word: String!) {\n  wikiQueries {\n    wiktionaryEntry(word: $word) {\n      word\n      definitions\n      sourceUrl\n    }\n  }\n}": types.WiktionaryEntryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation addRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    addRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"): (typeof documents)["mutation addRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    addRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query blogPostTypes {\n  blogQueries {\n    blogPostTypes {\n      id\n      name\n      description\n    }\n  }\n}"): (typeof documents)["query blogPostTypes {\n  blogQueries {\n    blogPostTypes {\n      id\n      name\n      description\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query children($parentId: ID!, $pagination: PaginationInput) {\n  blogQueries {\n    children(parentId: $parentId, pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}"): (typeof documents)["query children($parentId: ID!, $pagination: PaginationInput) {\n  blogQueries {\n    children(parentId: $parentId, pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation createBlogPost($title: String!, $input: BlogPostInput!) {\n  blogMutations {\n    createBlogPost(title: $title, input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"): (typeof documents)["mutation createBlogPost($title: String!, $input: BlogPostInput!) {\n  blogMutations {\n    createBlogPost(title: $title, input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ingestBlogFromSource($input: IngestBlogInput!) {\n  blogMutations {\n    ingestBlogFromSource(input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"): (typeof documents)["mutation ingestBlogFromSource($input: IngestBlogInput!) {\n  blogMutations {\n    ingestBlogFromSource(input: $input) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query listBlogPosts($pagination: PaginationInput) {\n  blogQueries {\n    listBlogPosts(pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}"): (typeof documents)["query listBlogPosts($pagination: PaginationInput) {\n  blogQueries {\n    listBlogPosts(pagination: $pagination) {\n      items {\n        id\n        title\n        content\n        tags\n        remoteObject\n        language\n        parentId\n        type {\n          id\n          name\n        }\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query listBlogPostsByRemoteObjects($ids: [String!]!) {\n  blogQueries {\n    listByRemoteObjects(ids: $ids) {\n      id\n      title\n      type {\n        id\n        name\n      }\n    }\n  }\n}"): (typeof documents)["query listBlogPostsByRemoteObjects($ids: [String!]!) {\n  blogQueries {\n    listByRemoteObjects(ids: $ids) {\n      id\n      title\n      type {\n        id\n        name\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query locateBlogPost($id: ID!) {\n  blogQueries {\n    locateBlogPost(id: $id) {\n      id\n      title\n      content\n      tags\n      remoteObject\n      language\n      parentId\n      parent {\n        id\n        title\n        parent {\n          id\n          title\n        }\n      }\n      type {\n        id\n        name\n      }\n      attachedTexts {\n        id\n        title\n        language\n        level\n        status\n      }\n      createdAt\n      updatedAt\n    }\n  }\n}"): (typeof documents)["query locateBlogPost($id: ID!) {\n  blogQueries {\n    locateBlogPost(id: $id) {\n      id\n      title\n      content\n      tags\n      remoteObject\n      language\n      parentId\n      parent {\n        id\n        title\n        parent {\n          id\n          title\n        }\n      }\n      type {\n        id\n        name\n      }\n      attachedTexts {\n        id\n        title\n        language\n        level\n        status\n      }\n      createdAt\n      updatedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation removeRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    removeRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"): (typeof documents)["mutation removeRemoteObject($postId: ID!, $target: String!) {\n  blogMutations {\n    removeRemoteObject(postId: $postId, target: $target) {\n      ... on QuerySuccess {\n        __typename\n        message\n        id\n      }\n      ... on StandardError {\n        __typename\n        message\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n    }\n  }\n}"): (typeof documents)["mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n      status\n      createdAt\n      updatedAt\n    }\n  }\n}"): (typeof documents)["query me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n      status\n      createdAt\n      updatedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query hadesTexts($pagination: PaginationInput) {\n  hadesQueries {\n    texts(pagination: $pagination) {\n      items {\n        id\n        title\n        language\n        level\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}"): (typeof documents)["query hadesTexts($pagination: PaginationInput) {\n  hadesQueries {\n    texts(pagination: $pagination) {\n      items {\n        id\n        title\n        language\n        level\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query locateReaderTexts($ids: [ID!]!) {\n  hadesQueries {\n    locateReaderTexts(ids: $ids) {\n      id\n      title\n      language\n      level\n      status\n    }\n  }\n}"): (typeof documents)["query locateReaderTexts($ids: [ID!]!) {\n  hadesQueries {\n    locateReaderTexts(ids: $ids) {\n      id\n      title\n      language\n      level\n      status\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query wikipediaSummary($title: String!) {\n  wikiQueries {\n    wikipediaSummary(title: $title) {\n      title\n      extract\n      pageUrl\n      thumbnailUrl\n    }\n  }\n}"): (typeof documents)["query wikipediaSummary($title: String!) {\n  wikiQueries {\n    wikipediaSummary(title: $title) {\n      title\n      extract\n      pageUrl\n      thumbnailUrl\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query wiktionaryEntry($word: String!) {\n  wikiQueries {\n    wiktionaryEntry(word: $word) {\n      word\n      definitions\n      sourceUrl\n    }\n  }\n}"): (typeof documents)["query wiktionaryEntry($word: String!) {\n  wikiQueries {\n    wiktionaryEntry(word: $word) {\n      word\n      definitions\n      sourceUrl\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;