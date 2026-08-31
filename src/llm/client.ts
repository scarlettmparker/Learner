import { loadConfig } from "../config.js";

export type ChatMessage = {
  /**
   * Role.
   */
  role: "system" | "user" | "assistant";
  /**
   * Content.
   */
  content: string;
};

export type CallOptions = {
  /**
   * Reasoning effort.
   */
  effort?: "low" | "medium" | "high";
  /**
   * Verbosity.
   */
  verbosity?: "low" | "medium" | "high";
  /**
   * Max output tokens.
   */
  maxOutputTokens?: number;
};

/**
 * Checks whether URL is a chat completions endpoint.
 *
 * @param url - base URL
 * @returns true for chat completions
 */
function isChatCompletionsUrl(url: string): boolean {
  return url.includes("/chat/completions");
}

/**
 * Builds request body for completions.
 *
 * @param messages - chat messages
 * @param config - learner config
 * @param opts - call options
 * @returns body
 */
function buildChatCompletionsBody(
  messages: ChatMessage[],
  config: ReturnType<typeof loadConfig>,
  opts?: CallOptions,
): Record<string, unknown> {
  const maxTokens = opts?.maxOutputTokens ?? config.maxOutputTokens;
  const body: Record<string, unknown> = {
    model: config.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (maxTokens) {
    (body as Record<string, unknown>).max_tokens = maxTokens;
    (body as Record<string, unknown>).max_completion_tokens = maxTokens;
  }
  // completions does not use reasoning/verbosity, omit
  return body;
}

/**
 * Builds request body for responses.
 *
 * @param messages - chat messages
 * @param config - learner config
 * @param opts - call options
 * @returns body
 */
function buildResponsesBody(
  messages: ChatMessage[],
  config: ReturnType<typeof loadConfig>,
  opts?: CallOptions,
): Record<string, unknown> {
  const effort = opts?.effort ?? config.reasoningEffort;
  const verbosity = opts?.verbosity ?? config.verbosity;
  const maxTokens = opts?.maxOutputTokens ?? config.maxOutputTokens;
  const body: Record<string, unknown> = {
    model: config.model,
    input: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (effort) {
    (body as Record<string, unknown>).reasoning = { effort };
  }
  if (verbosity) (body as Record<string, unknown>).text = { verbosity };
  if (maxTokens)
    (body as Record<string, unknown>).max_output_tokens = maxTokens;
  return body;
}

/**
 * Calls LLM via opencode zen/go responses or chat completions (OpenAI-compat).
 *
 * @param messages - chat messages
 * @param opts - reasoning and verbosity options
 * @returns response text
 */
export async function callLLM(
  messages: ChatMessage[],
  opts?: CallOptions,
): Promise<string> {
  const config = loadConfig();
  const body = isChatCompletionsUrl(config.openaiBaseUrl)
    ? buildChatCompletionsBody(messages, config, opts)
    : buildResponsesBody(messages, config, opts);
  const res = await fetch(config.openaiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM failed ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
    choices?: Array<{ message?: { content?: string } }>;
    text?: string;
    output_text?: string;
  };
  if (json.output) {
    for (const out of json.output) {
      if (out.content) {
        for (const c of out.content) {
          if (typeof c.text === "string" && c.text.trim()) return c.text;
        }
      }
    }
  }
  if (json.output?.[0]?.content?.[0]?.text)
    return json.output[0].content[0].text;
  if (json.choices?.[0]?.message?.content)
    return json.choices[0].message.content;
  if (typeof json.output_text === "string" && json.output_text.trim())
    return json.output_text;
  if (typeof json.text === "string" && json.text.trim()) return json.text;
  return JSON.stringify(json);
}
