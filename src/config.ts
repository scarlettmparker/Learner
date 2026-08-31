import "dotenv/config";

export type EffortLevel = "low" | "medium" | "high";

export type VerbosityLevel = "low" | "medium" | "high";

export type LearnerConfig = {
  /**
   * GraphQL endpoint.
   */
  graphqlEndpoint: string;
  /**
   * Sun client id.
   */
  clientId: string;
  /**
   * Sun client secret.
   */
  clientSecret: string;
  /**
   * OpenAI API key for LLM.
   */
  openaiApiKey: string;
  /**
   * OpenAI base URL.
   */
  openaiBaseUrl: string;
  /**
   * Model name.
   */
  model: string;
  /**
   * Default reasoning effort.
   */
  reasoningEffort: EffortLevel;
  /**
   * Fast reasoning effort for short calls.
   */
  fastReasoningEffort: EffortLevel;
  /**
   * Default verbosity.
   */
  verbosity?: VerbosityLevel;
  /**
   * Fast verbosity for short calls.
   */
  fastVerbosity: VerbosityLevel;
  /**
   * Default max output tokens.
   */
  maxOutputTokens?: number;
  /**
   * Fast max output tokens for assess.
   */
  assessMaxTokens: number;
  /**
   * Fast max output tokens for grade.
   */
  gradeMaxTokens: number;
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
  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error("Missing OPENAI_MODEL");
  }
  const reasoningEffort = parseEffort(process.env.OPENAI_REASONING_EFFORT) ?? "medium";
  const fastReasoningEffort = parseEffort(process.env.OPENAI_FAST_EFFORT) ?? "low";
  const verbosity = parseVerbosity(process.env.OPENAI_VERBOSITY);
  const fastVerbosity = parseVerbosity(process.env.OPENAI_FAST_VERBOSITY) ?? "low";
  const maxOutputTokens = parseIntSafe(process.env.OPENAI_MAX_OUTPUT_TOKENS);
  const assessMaxTokens = parseIntSafe(process.env.OPENAI_ASSESS_MAX_TOKENS) ?? 128;
  const gradeMaxTokens = parseIntSafe(process.env.OPENAI_GRADE_MAX_TOKENS) ?? 16;
  return {
    graphqlEndpoint,
    clientId,
    clientSecret,
    openaiApiKey,
    openaiBaseUrl,
    model,
    reasoningEffort,
    fastReasoningEffort,
    verbosity,
    fastVerbosity,
    maxOutputTokens,
    assessMaxTokens,
    gradeMaxTokens,
  };
}

/**
 * Parses effort level.
 *
 * @param value - raw env value
 * @returns effort level or undefined
 */
function parseEffort(value: string | undefined): EffortLevel | undefined {
  if (value === "low" || value === "medium" || value === "high") return value;
  return undefined;
}

/**
 * Parses verbosity level.
 *
 * @param value - raw env value
 * @returns verbosity or undefined
 */
function parseVerbosity(value: string | undefined): VerbosityLevel | undefined {
  if (value === "low" || value === "medium" || value === "high") return value;
  return undefined;
}

/**
 * Parses int safely.
 *
 * @param value - raw env value
 * @returns number or undefined
 */
function parseIntSafe(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}
