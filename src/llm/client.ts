import { loadConfig } from "../config.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Calls Muse Spark 1.2 via opencode zen/go responses (OpenAI-compat).
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
    throw new Error(`Muse Spark failed ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    output?: Array<{ content?: Array<{ text?: string }> }>;
    choices?: Array<{ message?: { content?: string } }>;
    text?: string;
  };
  if (json.output?.[0]?.content?.[0]?.text)
    return json.output[0].content[0].text;
  if (json.choices?.[0]?.message?.content)
    return json.choices[0].message.content;
  if (typeof json.text === "string") return json.text;
  return JSON.stringify(json);
}
