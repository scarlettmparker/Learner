import "dotenv/config";

export type LearnerConfig = {
  graphqlEndpoint: string;
  clientId: string;
  clientSecret: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  model: string;
};

/**
 * Loads config from env, throws if any required var is missing.
 */
export function loadConfig(): LearnerConfig {
  const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT;
  if (!graphqlEndpoint) {
    throw new Error("Missing GRAPHQL_ENDPOINT");
  }
  const clientId = process.env.SUN_CLIENT_ID ?? process.env.CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing SUN_CLIENT_ID or CLIENT_ID");
  }
  const clientSecret =
    process.env.SUN_CLIENT_SECRET ?? process.env.CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("Missing SUN_CLIENT_SECRET or CLIENT_SECRET");
  }
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  const openaiBaseUrl = process.env.OPENAI_BASE_URL;
  if (!openaiBaseUrl) {
    throw new Error("Missing OPENAI_BASE_URL");
  }
  const model = process.env.OPENAI_MODEL ?? process.env.MUSE_SPARK_MODEL;
  if (!model) {
    throw new Error("Missing OPENAI_MODEL or MUSE_SPARK_MODEL");
  }
  return {
    graphqlEndpoint,
    clientId,
    clientSecret,
    openaiApiKey,
    openaiBaseUrl,
    model,
  };
}
