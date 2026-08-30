import enquirer from "enquirer";

/**
 * Prompts for input via enquirer, single cast.
 */
export async function promptInput<T>(options: Parameters<(typeof enquirer)["prompt"]>[0]): Promise<T> {
  const result = await (enquirer as unknown as { prompt: typeof enquirer.prompt }).prompt(options);
  return result as T;
}
