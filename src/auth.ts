import { print } from "graphql";
import { loadConfig } from "./config.js";
import {
  LoginDocument,
  type LoginMutation,
  type LoginMutationVariables,
} from "./generated/graphql.js";
import type { DocumentNode } from "graphql";

type LoginResult = {
  token: string;
  accountId: string;
};

/**
 * Logs in via Sun's gaia login mutation. Returns JWT.
 */
export async function loginViaGaia(
  username: string,
  password: string,
): Promise<LoginResult> {
  const variables: LoginMutationVariables = { input: { username, password } };
  const data = await executeGraphQL<LoginMutation>(LoginDocument, variables);
  const login = data.gaiaMutations?.login;
  if (!login?.token) throw new Error("Login failed");
  return login as LoginResult;
}

/**
 * Executes a GraphQL operation with auth.
 */
export async function executeGraphQL<T>(
  document: DocumentNode,
  variables: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const config = loadConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Id": config.clientId,
    "X-Client-Secret": config.clientSecret,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(config.graphqlEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: print(document), variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}
