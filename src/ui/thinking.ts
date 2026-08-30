import ora from "ora";

/**
 * Runs a task with a thinking spinner.
 *
 * @param message - message to show
 * @param task - async task
 * @returns result of task
 */
export async function withThinking<T>(message: string, task: () => Promise<T>): Promise<T> {
  const spinner = ora(message).start();
  try {
    const result = await task();
    spinner.succeed();
    return result;
  } catch (e) {
    spinner.fail();
    throw e;
  }
}
