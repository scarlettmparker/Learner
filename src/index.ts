#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "./config.js";
import { loginViaGaia } from "./auth.js";
import {
  fetchRelatedTopics,
  fetchWikipediaSummary,
} from "./sources/wikipedia.js";
import {
  createChildBlog,
  fetchPriorContext,
  findBestParentByWikiExtract,
  findParentByTitleFuzzy,
  formatTitleWithDate,
  listChildren,
  listKnowledgeParents,
  pickParentInteractive,
} from "./sun.js";
import { generateQuiz } from "./quiz/generate.js";
import { buildMarkdown } from "./quiz/markdown.js";
import { runQuiz } from "./quiz/run.js";
import { promptInput } from "./quiz/prompt.js";

type LearnOptions = {
  /**
   * Parent title.
   */
  parent?: string;
  /**
   * Number of questions.
   */
  questions: string;
  /**
   * Source kind.
   */
  source: string;
  /**
   * Dry run without writing.
   */
  dryRun?: boolean;
};

const program = new Command();

program
  .name("sun-learn")
  .description("Interactive CLI quiz tutor for Sun KNOWLEDGE")
  .version("0.0.1");

program
  .command("learn")
  .argument("<topic>", "topic to learn")
  .option("--parent <title>", "parent blog title")
  .option("--questions <n>", "number of questions", "6")
  .option("--source <kind>", "source kind", "wikipedia")
  .option("--dry-run", "do not write blog")
  .action(async (topic: string, opts: LearnOptions) => {
    topic = topic.trim().replace(/#+$/, "").trim();
    const username = process.env.SUN_USERNAME ?? process.env.USERNAME;
    const password = process.env.SUN_PASSWORD ?? process.env.PASSWORD;
    if (!username || !password)
      throw new Error("Missing SUN_USERNAME and SUN_PASSWORD");
    const { token } = await loginViaGaia(username, password);
    console.log(chalk.dim(`Logged in as ${username}`));

    const summary = await fetchWikipediaSummary(topic, token);
    if (!summary) {
      console.error(chalk.red(`No Wikipedia summary for "${topic}"`));
      process.exit(1);
    }
    console.log(
      chalk.dim(`Wiki: ${summary.title} - ${summary.extract.slice(0, 120)}…`),
    );

    let parentId: string | null = null;
    let parentTitle: string | null = null;
    if (opts.parent) {
      const found = await findParentByTitleFuzzy(opts.parent, token);
      if (found) {
        parentId = found.id;
        parentTitle = found.title;
      }
    } else {
      const suggested = await findBestParentByWikiExtract(
        summary.extract,
        token,
      );
      if (suggested) {
        console.log(
          chalk.dim(`Suggested parent from wiki: ${suggested.title}`),
        );
      }
      const picked = await pickParentInteractive(token, suggested);
      parentId = picked.id;
      parentTitle = picked.title;
    }

    const related = await fetchRelatedTopics(topic, token);
    const priorContext = await fetchPriorContext(topic, token);
    const numQuestions = parseInt(opts.questions, 10) || 6;
    const quiz = await generateQuiz(
      { topic, summary, related, priorContext, numQuestions },
      token,
    );
    const { answers, correct, gaps } = await runQuiz(quiz.questions, token);
    console.log(chalk.bold(`\nScore: ${correct}/${quiz.questions.length}`));

    if (opts.dryRun) {
      console.log(chalk.yellow("Dry run, not writing blog"));
      return;
    }

    const titleWithDate = formatTitleWithDate(topic);
    const markdown = buildMarkdown({
      topic,
      summary,
      answers,
      gaps,
      related,
      pageUrl: summary.pageUrl,
    });
    const newId = await createChildBlog(
      {
        title: titleWithDate,
        content: markdown,
        parentId,
        parentTypeName: parentTitle,
      },
      token,
    );
    console.log(
      chalk.green(`\nCreated child blog "${titleWithDate}" → /blog/${newId}`),
    );

    if (related.length) {
      related.forEach((r, idx) => console.log(`  ${idx + 1}. ${r.title}`));
      const { choice } = await promptInput<{ choice: string }>({
        type: "input",
        name: "choice",
        message: "Enter number to start new session, or Enter to finish:",
      });
      const num = parseInt(choice, 10);
      if (num >= 1 && num <= related.length) {
        const { spawn } = await import("node:child_process");
        spawn(
          process.argv[0],
          [process.argv[1], "learn", related[num - 1].title],
          { stdio: "inherit" },
        );
      }
    }
  });

program
  .command("review")
  .option("--parent <title>", "parent title")
  .action(async (opts: { parent?: string }) => {
    const username = process.env.SUN_USERNAME ?? process.env.USERNAME;
    const password = process.env.SUN_PASSWORD ?? process.env.PASSWORD;
    if (!username || !password)
      throw new Error("Missing SUN_USERNAME and SUN_PASSWORD");
    const { token } = await loginViaGaia(username, password);
    let parentId: string | null = null;
    if (opts.parent) {
      const found = await findParentByTitleFuzzy(opts.parent, token);
      if (found) parentId = found.id;
    } else {
      const picked = await pickParentInteractive(token);
      parentId = picked.id;
    }
    if (!parentId) {
      const parents = await listKnowledgeParents(token);
      parents.forEach((p) => console.log(`- ${p.title} (${p.id})`));
      return;
    }
    const children = await listChildren(parentId, token);
    children.forEach((c) => console.log(`- ${c.title} (${c.id})`));
  });

program
  .command("config")
  .description("Show current config from env")
  .action(() => {
    const config = loadConfig();
    console.log(JSON.stringify({ ...config, openaiApiKey: "***" }, null, 2));
  });

program.parse();
