/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Account = {
  __typename?: 'Account';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  personId: Scalars['ID']['output'];
  provider?: Maybe<Scalars['String']['output']>;
  remoteUsers?: Maybe<Array<RemoteUser>>;
  status: AccountStatus;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username: Scalars['String']['output'];
};

export enum AccountStatus {
  Active = 'ACTIVE',
  Deactivated = 'DEACTIVATED',
  Pending = 'PENDING',
  Suspended = 'SUSPENDED'
}

export type AttachedText = {
  __typename?: 'AttachedText';
  id: Scalars['String']['output'];
  language: Scalars['String']['output'];
  level: Scalars['String']['output'];
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type AuthResult = {
  __typename?: 'AuthResult';
  accountId: Scalars['ID']['output'];
  personId: Scalars['ID']['output'];
  token: Scalars['String']['output'];
};

export type BlogMutations = {
  __typename?: 'BlogMutations';
  addRemoteObject?: Maybe<QueryResult>;
  createBlogPost?: Maybe<QueryResult>;
  createBlogPostType?: Maybe<QueryResult>;
  ingestBlogFromSource?: Maybe<QueryResult>;
  removeRemoteObject?: Maybe<QueryResult>;
};


export type BlogMutationsAddRemoteObjectArgs = {
  postId: Scalars['ID']['input'];
  target: Scalars['String']['input'];
};


export type BlogMutationsCreateBlogPostArgs = {
  input?: InputMaybe<BlogPostInput>;
  title: Scalars['String']['input'];
};


export type BlogMutationsCreateBlogPostTypeArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type BlogMutationsIngestBlogFromSourceArgs = {
  input: IngestBlogInput;
};


export type BlogMutationsRemoveRemoteObjectArgs = {
  postId: Scalars['ID']['input'];
  target: Scalars['String']['input'];
};

export type BlogPost = {
  __typename?: 'BlogPost';
  attachedTexts?: Maybe<Array<AttachedText>>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  language?: Maybe<Scalars['String']['output']>;
  parent?: Maybe<BlogPost>;
  parentId?: Maybe<Scalars['ID']['output']>;
  remoteObject?: Maybe<Array<Scalars['String']['output']>>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  type?: Maybe<BlogPostType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type BlogPostInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  remoteObject?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  typeId?: InputMaybe<Scalars['ID']['input']>;
};

export type BlogPostType = {
  __typename?: 'BlogPostType';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type BlogQueries = {
  __typename?: 'BlogQueries';
  blogPostTypes: Array<BlogPostType>;
  children: PagedBlogPosts;
  listBlogPosts: PagedBlogPosts;
  listByRemoteObjects?: Maybe<Array<Maybe<BlogPost>>>;
  locateBlogPost?: Maybe<BlogPost>;
};


export type BlogQueriesChildrenArgs = {
  pagination?: InputMaybe<PaginationInput>;
  parentId: Scalars['ID']['input'];
};


export type BlogQueriesListBlogPostsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};


export type BlogQueriesListByRemoteObjectsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type BlogQueriesLocateBlogPostArgs = {
  id: Scalars['ID']['input'];
};

export enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2'
}

export type Entry = {
  __typename?: 'Entry';
  definitions: Array<Scalars['String']['output']>;
  sourceUrl?: Maybe<Scalars['String']['output']>;
  word: Scalars['String']['output'];
};

export type FilterInput = {
  field: Scalars['String']['input'];
  operator: FilterOperator;
  value: Scalars['String']['input'];
};

export enum FilterOperator {
  EndsWith = 'ENDS_WITH',
  Equals = 'EQUALS',
  GreaterThan = 'GREATER_THAN',
  GreaterThanOrEqual = 'GREATER_THAN_OR_EQUAL',
  In = 'IN',
  LessThan = 'LESS_THAN',
  LessThanOrEqual = 'LESS_THAN_OR_EQUAL',
  Matches = 'MATCHES',
  NotEquals = 'NOT_EQUALS',
  StartsWith = 'STARTS_WITH'
}

export type GaiaMutations = {
  __typename?: 'GaiaMutations';
  confirmAccountReactivation?: Maybe<QueryResult>;
  createRole?: Maybe<Role>;
  deactivateAccount?: Maybe<QueryResult>;
  deleteRole?: Maybe<QueryResult>;
  login?: Maybe<AuthResult>;
  logout?: Maybe<QueryResult>;
  requestAccountReactivation?: Maybe<QueryResult>;
  saveRegistry?: Maybe<HubRegistry>;
  setAccountPermissions?: Maybe<QueryResult>;
  setAccountRoles?: Maybe<QueryResult>;
  setRolePermissions?: Maybe<QueryResult>;
  suspendAccount?: Maybe<QueryResult>;
  unsuspendAccount?: Maybe<QueryResult>;
};


export type GaiaMutationsConfirmAccountReactivationArgs = {
  token: Scalars['String']['input'];
};


export type GaiaMutationsCreateRoleArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type GaiaMutationsDeleteRoleArgs = {
  id: Scalars['ID']['input'];
};


export type GaiaMutationsLoginArgs = {
  input: LoginInput;
};


export type GaiaMutationsRequestAccountReactivationArgs = {
  email: Scalars['String']['input'];
  provider: Scalars['String']['input'];
};


export type GaiaMutationsSaveRegistryArgs = {
  input: HubRegistryInput;
};


export type GaiaMutationsSetAccountPermissionsArgs = {
  accountId: Scalars['ID']['input'];
  permissions: Array<Scalars['String']['input']>;
};


export type GaiaMutationsSetAccountRolesArgs = {
  accountId: Scalars['ID']['input'];
  roleNames: Array<Scalars['String']['input']>;
};


export type GaiaMutationsSetRolePermissionsArgs = {
  permissions: Array<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
};


export type GaiaMutationsSuspendAccountArgs = {
  id: Scalars['ID']['input'];
};


export type GaiaMutationsUnsuspendAccountArgs = {
  id: Scalars['ID']['input'];
};

export type GaiaQueries = {
  __typename?: 'GaiaQueries';
  account?: Maybe<Account>;
  accountPermissions: Array<Scalars['String']['output']>;
  accountRoles: Array<Scalars['String']['output']>;
  accounts: PagedAccounts;
  allPermissions: Array<Scalars['String']['output']>;
  hubRegistry?: Maybe<HubRegistry>;
  me?: Maybe<Account>;
  myRoles: Array<Scalars['String']['output']>;
  propertySet?: Maybe<Scalars['JSON']['output']>;
  role?: Maybe<Role>;
  rolePermissions: Array<Scalars['String']['output']>;
  roles: Array<Role>;
};


export type GaiaQueriesAccountArgs = {
  id: Scalars['ID']['input'];
};


export type GaiaQueriesAccountPermissionsArgs = {
  accountId: Scalars['ID']['input'];
};


export type GaiaQueriesAccountRolesArgs = {
  accountId: Scalars['ID']['input'];
};


export type GaiaQueriesAccountsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};


export type GaiaQueriesPropertySetArgs = {
  entry?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  ownerKey: Scalars['String']['input'];
};


export type GaiaQueriesRoleArgs = {
  id: Scalars['ID']['input'];
};


export type GaiaQueriesRolePermissionsArgs = {
  roleId: Scalars['ID']['input'];
};

export type GalleryItem = {
  __typename?: 'GalleryItem';
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  imagePath?: Maybe<Scalars['String']['output']>;
  remoteObject?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type GalleryItemInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  imagePath?: InputMaybe<Scalars['String']['input']>;
  remoteObject?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type GalleryMutations = {
  __typename?: 'GalleryMutations';
  create?: Maybe<QueryResult>;
};


export type GalleryMutationsCreateArgs = {
  input?: InputMaybe<GalleryItemInput>;
};

export type GalleryQueries = {
  __typename?: 'GalleryQueries';
  list?: Maybe<Array<Maybe<GalleryItem>>>;
  listByRemoteObjects?: Maybe<Array<Maybe<GalleryItem>>>;
  locate?: Maybe<GalleryItem>;
};


export type GalleryQueriesListByRemoteObjectsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type GalleryQueriesLocateArgs = {
  id: Scalars['ID']['input'];
};

export type HadesMutations = {
  __typename?: 'HadesMutations';
  dummy?: Maybe<Scalars['String']['output']>;
};

export type HadesQueries = {
  __typename?: 'HadesQueries';
  locateReaderTexts: Array<ReaderText>;
  texts: PagedReaderTexts;
};


export type HadesQueriesLocateReaderTextsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type HadesQueriesTextsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

export type HubApp = {
  __typename?: 'HubApp';
  description: Scalars['String']['output'];
  devPort: Scalars['Int']['output'];
  dir: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prodPort: Scalars['Int']['output'];
  self: Scalars['Boolean']['output'];
  url: Scalars['String']['output'];
};

export type HubAppInput = {
  description: Scalars['String']['input'];
  devPort: Scalars['Int']['input'];
  dir: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  key: Scalars['String']['input'];
  name: Scalars['String']['input'];
  prodPort: Scalars['Int']['input'];
  self: Scalars['Boolean']['input'];
  url: Scalars['String']['input'];
};

export enum HubMode {
  Dev = 'dev',
  Serve = 'serve'
}

export type HubRegistry = {
  __typename?: 'HubRegistry';
  apps: Array<HubApp>;
  mode: HubMode;
};

export type HubRegistryInput = {
  apps: Array<HubAppInput>;
  mode: HubMode;
};

export type IngestBlogInput = {
  parentId?: InputMaybe<Scalars['ID']['input']>;
  sourceId: Scalars['String']['input'];
  sourceKind: SourceKind;
  title: Scalars['String']['input'];
  typeName: Scalars['String']['input'];
};

export type LoginInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  blogMutations: BlogMutations;
  gaiaMutations: GaiaMutations;
  galleryMutations: GalleryMutations;
  hadesMutations: HadesMutations;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  page: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PagedAccounts = {
  __typename?: 'PagedAccounts';
  items: Array<Account>;
  pageInfo: PageInfo;
};

export type PagedBlogPosts = {
  __typename?: 'PagedBlogPosts';
  items: Array<BlogPost>;
  pageInfo: PageInfo;
};

export type PagedReaderTexts = {
  __typename?: 'PagedReaderTexts';
  items: Array<ReaderText>;
  pageInfo: PageInfo;
};

export type PaginationInput = {
  filters?: InputMaybe<Array<FilterInput>>;
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortDir?: InputMaybe<SortDirection>;
  sorts?: InputMaybe<Array<SortInput>>;
};

export type Query = {
  __typename?: 'Query';
  blogQueries: BlogQueries;
  gaiaQueries: GaiaQueries;
  galleryQueries: GalleryQueries;
  hadesQueries: HadesQueries;
  stemPlayerQueries: StemPlayerQueries;
  wikiQueries: WikiQueries;
};

export type QueryResult = QuerySuccess | StandardError;

export type QuerySuccess = {
  __typename?: 'QuerySuccess';
  id?: Maybe<Scalars['ID']['output']>;
  message: Scalars['String']['output'];
};

export type ReaderText = {
  __typename?: 'ReaderText';
  content: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  language: Scalars['String']['output'];
  level: CefrLevel;
  status: ReaderTextStatus;
  title: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum ReaderTextStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED'
}

export type RelatedTopic = {
  __typename?: 'RelatedTopic';
  extract?: Maybe<Scalars['String']['output']>;
  pageUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

/** A user identity on a remote provider. */
export type RemoteUser = {
  __typename?: 'RemoteUser';
  id: Scalars['String']['output'];
  type: RemoteUserType;
};

export type RemoteUserInput = {
  id: Scalars['String']['input'];
  type: RemoteUserType;
};

export enum RemoteUserType {
  Discord = 'DISCORD'
}

export type Role = {
  __typename?: 'Role';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type Song = {
  __typename?: 'Song';
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  stems?: Maybe<Array<Maybe<Stem>>>;
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type SortInput = {
  dir: SortDirection;
  field: Scalars['String']['input'];
};

export enum SourceKind {
  Wikipedia = 'WIKIPEDIA',
  Wiktionary = 'WIKTIONARY'
}

export type StandardError = {
  __typename?: 'StandardError';
  message: Scalars['String']['output'];
};

export type Stem = {
  __typename?: 'Stem';
  name?: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
};

export type StemPlayerQueries = {
  __typename?: 'StemPlayerQueries';
  list?: Maybe<Array<Maybe<Song>>>;
  locate?: Maybe<Song>;
};


export type StemPlayerQueriesLocateArgs = {
  id: Scalars['ID']['input'];
};

export type Summary = {
  __typename?: 'Summary';
  extract?: Maybe<Scalars['String']['output']>;
  pageUrl?: Maybe<Scalars['String']['output']>;
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type WikiQueries = {
  __typename?: 'WikiQueries';
  wikipediaRelatedTopics: Array<RelatedTopic>;
  wikipediaSearch: Array<Summary>;
  wikipediaSummary?: Maybe<Summary>;
  wiktionaryEntry?: Maybe<Entry>;
};


export type WikiQueriesWikipediaRelatedTopicsArgs = {
  title: Scalars['String']['input'];
};


export type WikiQueriesWikipediaSearchArgs = {
  query: Scalars['String']['input'];
};


export type WikiQueriesWikipediaSummaryArgs = {
  title: Scalars['String']['input'];
};


export type WikiQueriesWiktionaryEntryArgs = {
  word: Scalars['String']['input'];
};

export type AddRemoteObjectMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
  target: Scalars['String']['input'];
}>;


export type AddRemoteObjectMutation = { __typename?: 'Mutation', blogMutations: { __typename?: 'BlogMutations', addRemoteObject?:
      | { __typename: 'QuerySuccess', message: string, id?: string | null }
      | { __typename: 'StandardError', message: string }
     | null } };

export type BlogPostTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type BlogPostTypesQuery = { __typename?: 'Query', blogQueries: { __typename?: 'BlogQueries', blogPostTypes: Array<{ __typename?: 'BlogPostType', id: string, name: string, description?: string | null }> } };

export type ChildrenQueryVariables = Exact<{
  parentId: Scalars['ID']['input'];
  pagination?: InputMaybe<PaginationInput>;
}>;


export type ChildrenQuery = { __typename?: 'Query', blogQueries: { __typename?: 'BlogQueries', children: { __typename?: 'PagedBlogPosts', items: Array<{ __typename?: 'BlogPost', id: string, title: string, content?: string | null, tags?: Array<string> | null, remoteObject?: Array<string> | null, language?: string | null, parentId?: string | null, createdAt?: any | null, updatedAt?: any | null, type?: { __typename?: 'BlogPostType', id: string, name: string } | null }>, pageInfo: { __typename?: 'PageInfo', page: number, size: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean } } } };

export type CreateBlogPostMutationVariables = Exact<{
  title: Scalars['String']['input'];
  input: BlogPostInput;
}>;


export type CreateBlogPostMutation = { __typename?: 'Mutation', blogMutations: { __typename?: 'BlogMutations', createBlogPost?:
      | { __typename: 'QuerySuccess', message: string, id?: string | null }
      | { __typename: 'StandardError', message: string }
     | null } };

export type IngestBlogFromSourceMutationVariables = Exact<{
  input: IngestBlogInput;
}>;


export type IngestBlogFromSourceMutation = { __typename?: 'Mutation', blogMutations: { __typename?: 'BlogMutations', ingestBlogFromSource?:
      | { __typename: 'QuerySuccess', message: string, id?: string | null }
      | { __typename: 'StandardError', message: string }
     | null } };

export type ListBlogPostsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
}>;


export type ListBlogPostsQuery = { __typename?: 'Query', blogQueries: { __typename?: 'BlogQueries', listBlogPosts: { __typename?: 'PagedBlogPosts', items: Array<{ __typename?: 'BlogPost', id: string, title: string, content?: string | null, tags?: Array<string> | null, remoteObject?: Array<string> | null, language?: string | null, parentId?: string | null, createdAt?: any | null, updatedAt?: any | null, type?: { __typename?: 'BlogPostType', id: string, name: string } | null }>, pageInfo: { __typename?: 'PageInfo', page: number, size: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean } } } };

export type ListBlogPostsByRemoteObjectsQueryVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type ListBlogPostsByRemoteObjectsQuery = { __typename?: 'Query', blogQueries: { __typename?: 'BlogQueries', listByRemoteObjects?: Array<{ __typename?: 'BlogPost', id: string, title: string, type?: { __typename?: 'BlogPostType', id: string, name: string } | null } | null> | null } };

export type LocateBlogPostQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type LocateBlogPostQuery = { __typename?: 'Query', blogQueries: { __typename?: 'BlogQueries', locateBlogPost?: { __typename?: 'BlogPost', id: string, title: string, content?: string | null, tags?: Array<string> | null, remoteObject?: Array<string> | null, language?: string | null, parentId?: string | null, createdAt?: any | null, updatedAt?: any | null, parent?: { __typename?: 'BlogPost', id: string, title: string, parent?: { __typename?: 'BlogPost', id: string, title: string } | null } | null, type?: { __typename?: 'BlogPostType', id: string, name: string } | null, attachedTexts?: Array<{ __typename?: 'AttachedText', id: string, title: string, language: string, level: string, status: string }> | null } | null } };

export type RemoveRemoteObjectMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
  target: Scalars['String']['input'];
}>;


export type RemoveRemoteObjectMutation = { __typename?: 'Mutation', blogMutations: { __typename?: 'BlogMutations', removeRemoteObject?:
      | { __typename: 'QuerySuccess', message: string, id?: string | null }
      | { __typename: 'StandardError', message: string }
     | null } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', gaiaMutations: { __typename?: 'GaiaMutations', login?: { __typename?: 'AuthResult', token: string } | null } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', gaiaQueries: { __typename?: 'GaiaQueries', me?: { __typename?: 'Account', id: string, username: string, personId: string, status: AccountStatus, createdAt?: any | null, updatedAt?: any | null } | null } };

export type HadesTextsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
}>;


export type HadesTextsQuery = { __typename?: 'Query', hadesQueries: { __typename?: 'HadesQueries', texts: { __typename?: 'PagedReaderTexts', items: Array<{ __typename?: 'ReaderText', id: string, title: string, language: string, level: CefrLevel }>, pageInfo: { __typename?: 'PageInfo', page: number, size: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean } } } };

export type LocateReaderTextsQueryVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type LocateReaderTextsQuery = { __typename?: 'Query', hadesQueries: { __typename?: 'HadesQueries', locateReaderTexts: Array<{ __typename?: 'ReaderText', id: string, title: string, language: string, level: CefrLevel, status: ReaderTextStatus }> } };

export type WikipediaRelatedTopicsQueryVariables = Exact<{
  title: Scalars['String']['input'];
}>;


export type WikipediaRelatedTopicsQuery = { __typename?: 'Query', wikiQueries: { __typename?: 'WikiQueries', wikipediaRelatedTopics: Array<{ __typename?: 'RelatedTopic', title: string, pageUrl: string, extract?: string | null }> } };

export type WikipediaSearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type WikipediaSearchQuery = { __typename?: 'Query', wikiQueries: { __typename?: 'WikiQueries', wikipediaSearch: Array<{ __typename?: 'Summary', title: string, extract?: string | null, pageUrl?: string | null, thumbnailUrl?: string | null }> } };

export type WikipediaSummaryQueryVariables = Exact<{
  title: Scalars['String']['input'];
}>;


export type WikipediaSummaryQuery = { __typename?: 'Query', wikiQueries: { __typename?: 'WikiQueries', wikipediaSummary?: { __typename?: 'Summary', title: string, extract?: string | null, pageUrl?: string | null, thumbnailUrl?: string | null } | null } };

export type WiktionaryEntryQueryVariables = Exact<{
  word: Scalars['String']['input'];
}>;


export type WiktionaryEntryQuery = { __typename?: 'Query', wikiQueries: { __typename?: 'WikiQueries', wiktionaryEntry?: { __typename?: 'Entry', word: string, definitions: Array<string>, sourceUrl?: string | null } | null } };


export const AddRemoteObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addRemoteObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRemoteObject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}},{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySuccess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StandardError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddRemoteObjectMutation, AddRemoteObjectMutationVariables>;
export const BlogPostTypesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"blogPostTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogPostTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<BlogPostTypesQuery, BlogPostTypesQueryVariables>;
export const ChildrenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"children"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"children"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"remoteObject"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChildrenQuery, ChildrenQueryVariables>;
export const CreateBlogPostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createBlogPost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBlogPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySuccess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StandardError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateBlogPostMutation, CreateBlogPostMutationVariables>;
export const IngestBlogFromSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ingestBlogFromSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IngestBlogInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ingestBlogFromSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySuccess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StandardError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<IngestBlogFromSourceMutation, IngestBlogFromSourceMutationVariables>;
export const ListBlogPostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"listBlogPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listBlogPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"remoteObject"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListBlogPostsQuery, ListBlogPostsQueryVariables>;
export const ListBlogPostsByRemoteObjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"listBlogPostsByRemoteObjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listByRemoteObjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListBlogPostsByRemoteObjectsQuery, ListBlogPostsByRemoteObjectsQueryVariables>;
export const LocateBlogPostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"locateBlogPost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locateBlogPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"remoteObject"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attachedTexts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<LocateBlogPostQuery, LocateBlogPostQueryVariables>;
export const RemoveRemoteObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"removeRemoteObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"target"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blogMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRemoteObject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}},{"kind":"Argument","name":{"kind":"Name","value":"target"},"value":{"kind":"Variable","name":{"kind":"Name","value":"target"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySuccess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StandardError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RemoveRemoteObjectMutation, RemoveRemoteObjectMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const HadesTextsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"hadesTexts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hadesQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"texts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"level"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]}}]} as unknown as DocumentNode<HadesTextsQuery, HadesTextsQueryVariables>;
export const LocateReaderTextsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"locateReaderTexts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hadesQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locateReaderTexts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<LocateReaderTextsQuery, LocateReaderTextsQueryVariables>;
export const WikipediaRelatedTopicsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"wikipediaRelatedTopics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikiQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikipediaRelatedTopics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"pageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"extract"}}]}}]}}]}}]} as unknown as DocumentNode<WikipediaRelatedTopicsQuery, WikipediaRelatedTopicsQueryVariables>;
export const WikipediaSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"wikipediaSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikiQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikipediaSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"extract"}},{"kind":"Field","name":{"kind":"Name","value":"pageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}}]}}]}}]}}]} as unknown as DocumentNode<WikipediaSearchQuery, WikipediaSearchQueryVariables>;
export const WikipediaSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"wikipediaSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikiQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikipediaSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"extract"}},{"kind":"Field","name":{"kind":"Name","value":"pageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"}}]}}]}}]}}]} as unknown as DocumentNode<WikipediaSummaryQuery, WikipediaSummaryQueryVariables>;
export const WiktionaryEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"wiktionaryEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"word"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wikiQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wiktionaryEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"word"},"value":{"kind":"Variable","name":{"kind":"Name","value":"word"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"word"}},{"kind":"Field","name":{"kind":"Name","value":"definitions"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}}]}}]}}]}}]} as unknown as DocumentNode<WiktionaryEntryQuery, WiktionaryEntryQueryVariables>;