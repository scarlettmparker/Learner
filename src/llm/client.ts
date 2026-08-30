import { loadConfig } from "../config.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Calls LLM 1.2 via opencode zen/go responses (OpenAI-compat).
 */
export async function callMuseSpark(messages: ChatMessage[]): Promise<string> {
  const config = loadConfig();
  const res = await fetch(config.openaiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
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
