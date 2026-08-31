#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "./config.js";
import { loginViaGaia } from "./auth.js";
import {
  fetchRelatedTopics,
  fetchWikipediaPage,
  fetchWikipediaSummary,
  searchWikipedia,
} from "./sources/wikipedia.js";
import {
  createChildBlog,
  fetchAdvancedTopics,
  fetchPriorContext,
  findBestParentByWikiExtract,
  findExistingChildByTopic,
  findParentByTitleFuzzy,
  formatTitleWithDate,
  listChildren,
  listKnowledgeParents,
  pickParentInteractive,
  updateBlog,
} from "./sun.js";
import { chunkPage, sampleChunksForQuiz } from "./quiz/chunk.js";
import { withThinking } from "./ui/thinking.js";
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
   * Difficulty level.
   */
  difficulty?: string;
  /**
   * Dry run without writing.
   */
  dryRun?: boolean;
};

type ResolvedAuth = {
  /**
   * JWT token.
   */
  token: string;
  /**
   * Username.
   */
  username: string;
};

type ParentChoice = {
  /**
   * Parent id.
   */
  id: string | null;
  /**
   * Parent title.
   */
  title: string | null;
};

type WikiBucket = {
  /**
   * Summary.
   */
  summary: Awaited<ReturnType<typeof fetchWikipediaSummary>>;
  /**
   * Related topics.
   */
  related: Awaited<ReturnType<typeof fetchRelatedTopics>>;
  /**
   * Full page plaintext.
   */
  fullPage: string | null;
  /**
   * Search results broad scrape.
   */
  searchResults: Awaited<ReturnType<typeof searchWikipedia>>;
};

/**
 * Resolves auth from env.
 *
 * @returns token and username
 */
async function resolveAuth(): Promise<ResolvedAuth> {
  const username = process.env.SUN_USERNAME ?? process.env.USERNAME;
  const password = process.env.SUN_PASSWORD ?? process.env.PASSWORD;
  if (!username || !password)
    throw new Error("Missing SUN_USERNAME and SUN_PASSWORD");
  const { token } = await loginViaGaia(username, password);
  console.log(chalk.dim(`Logged in as ${username}`));
  return { token, username };
}

/**
 * Resolves parent via option or wiki extract suggestion.
 *
 * @param summary - wiki summary
 * @param opts - CLI options
 * @param token - auth token
 * @returns parent choice
 */
async function resolveParent(
  summary: NonNullable<WikiBucket["summary"]>,
  opts: LearnOptions,
  token: string,
): Promise<ParentChoice> {
  if (opts.parent) {
    const found = await findParentByTitleFuzzy(opts.parent, token);
    if (found) return { id: found.id, title: found.title };
  }
  const suggested = await findBestParentByWikiExtract(summary.extract, token);
  if (suggested)
    console.log(chalk.dim(`Suggested parent from wiki: ${suggested.title}`));
  const picked = await pickParentInteractive(token, suggested);
  return { id: picked.id, title: picked.title };
}

/**
 * Scrapes broad wikipedia context for a topic.
 *
 * @param topic - topic to scrape
 * @param token - auth token
 * @returns wiki bucket with summary, related, full page, search
 */
async function scrapeWiki(topic: string, token: string): Promise<WikiBucket> {
  const summary = await withThinking(
    `Fetching Wikipedia for "${topic}"...`,
    () => fetchWikipediaSummary(topic, token),
  );
  if (!summary) throw new Error(`No Wikipedia summary for "${topic}"`);
  console.log(
    chalk.dim(`Wiki: ${summary.title} - ${summary.extract.slice(0, 120)}…`),
  );
  const related = await withThinking("Fetching related topics...", () =>
    fetchRelatedTopics(topic, token),
  );
  const searchResults = await withThinking("Scraping search broadly...", () =>
    searchWikipedia(topic, token),
  );
  const fullPage = await withThinking("Fetching full page...", () =>
    fetchWikipediaPage(topic, token),
  );
  return { summary, related, fullPage, searchResults };
}

/**
 * Scrapes additional pages for top related topics to enrich context.
 *
 * @param related - related topics
 * @param token - auth token
 * @returns combined full page snippets
 */
async function scrapeRelatedPages(
  related: WikiBucket["related"],
  token: string,
): Promise<string> {
  if (!related.length) return "";
  const top = related.slice(0, 2);
  const snippets: string[] = [];
  for (const r of top) {
    const page = await fetchWikipediaPage(r.title, token).catch(() => null);
    if (page) snippets.push(`${r.title}: ${page.slice(0, 800)}`);
  }
  return snippets.join("\n\n");
}

/**
 * Gathers blog intent context like startup does.
 *
 * @param topic - topic
 * @param parentChoice - chosen parent
 * @param token - auth token
 * @returns prior context, existing, readiness
 */
async function gatherBlogContext(
  topic: string,
  parentChoice: ParentChoice,
  token: string,
) {
  let priorContext = await withThinking("Fetching prior context...", () =>
    fetchPriorContext(topic, token),
  );
  const existingForContext = await findExistingChildByTopic(
    parentChoice.id,
    topic,
    token,
  );
  if (existingForContext?.content) {
    const { extractPriorAttempts, buildPriorContextFromAttempts } =
      await import("./quiz/revisit.js");
    const attempts = extractPriorAttempts(existingForContext.content);
    const revisitContext = buildPriorContextFromAttempts(attempts);
    priorContext = `${priorContext}\n${revisitContext}\nPrior content snippet: ${existingForContext.content.slice(0, 800)}`;
    const advanced = await withThinking("Searching advanced topics...", () =>
      fetchAdvancedTopics(topic, token, 5),
    );
    if (advanced.length)
      priorContext += `\nAdvanced related: ${advanced.join(", ")}`;
    const children = parentChoice.id
      ? await listChildren(parentChoice.id, token).catch(() => [])
      : [];
    if (children.length)
      priorContext += `\nChildren intents: ${children.map((c) => c.title).join(", ")}`;
    const searchAcross = await findExistingAcrossKnowledge(topic, token);
    if (searchAcross)
      priorContext += `\nFound existing across knowledge: ${searchAcross.title}`;
    return { priorContext, existingForContext, attempts };
  }
  const children = parentChoice.id
    ? await listChildren(parentChoice.id, token).catch(() => [])
    : [];
  if (children.length)
    priorContext += `\nChildren intents: ${children.map((c) => c.title).join(", ")}`;
  return { priorContext, existingForContext: null, attempts: [] as never[] };
}

/**
 * Searches across all KNOWLEDGE for existing topic like startup intent search.
 *
 * @param topic - topic
 * @param token - auth token
 * @returns existing parent match or null
 */
async function findExistingAcrossKnowledge(topic: string, token: string) {
  try {
    const parents = await listKnowledgeParents(token);
    const lower = topic.toLowerCase();
    for (const p of parents) {
      if (p.title.toLowerCase().includes(lower)) return p;
      const children = await listChildren(p.id, token).catch(() => []);
      const match = children.find((c) =>
        c.title.toLowerCase().startsWith(lower),
      );
      if (match) return match;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Resolves difficulty and question count.
 *
 * @param opts - CLI options
 * @param readinessReady - whether LLM says ready for advanced
 * @param difficultyOpt - explicit difficulty option
 * @returns count and difficulty
 */
function resolveDifficultyAndCount(
  opts: LearnOptions,
  readinessReady: boolean,
  difficultyOpt?: string,
): { count: number; difficulty: "basic" | "same" | "advanced" } {
  const explicit = (difficultyOpt ?? opts.difficulty ?? "").toLowerCase();
  if (explicit === "basic")
    return { count: parseInt(opts.questions, 10) || 5, difficulty: "basic" };
  if (explicit === "advanced") {
    const parsed = parseInt(opts.questions, 10);
    const count = Number.isNaN(parsed) ? 20 : Math.max(15, parsed);
    return { count, difficulty: "advanced" };
  }
  const hasCustomCount =
    opts.questions !== "6" &&
    opts.questions !== "15" &&
    opts.questions !== "10" &&
    opts.questions !== "5";
  if (hasCustomCount) {
    const n = parseInt(opts.questions, 10);
    if (!Number.isNaN(n))
      return {
        count: readinessReady ? Math.max(15, n) : n,
        difficulty: readinessReady ? "advanced" : "same",
      };
  }
  if (readinessReady) return { count: 20, difficulty: "advanced" };
  if (explicit === "same" || !explicit)
    return { count: 10, difficulty: "same" };
  return { count: 5, difficulty: "basic" };
}

/**
 * Creates or updates blog and returns link.
 *
 * @param topic - topic
 * @param parentChoice - parent
 * @param summary - wiki summary
 * @param answers - quiz answers
 * @param gaps - gaps
 * @param related - related topics
 * @param fullPage - full page excerpt
 * @param mastery - whether mastery
 * @param token - auth token
 * @returns new blog id
 */
async function createOrUpdateBlog(
  topic: string,
  parentChoice: ParentChoice,
  summary: NonNullable<WikiBucket["summary"]>,
  answers: Awaited<ReturnType<typeof runQuiz>>["answers"],
  gaps: string[],
  related: WikiBucket["related"],
  fullPage: string | null,
  mastery: boolean,
  token: string,
): Promise<string> {
  const existing = await findExistingChildByTopic(
    parentChoice.id,
    summary.title,
    token,
  );
  if (existing) {
    console.log(
      chalk.dim(
        `Found existing "${existing.title}" - updating with new attempt...`,
      ),
    );
    const dateHeader = `\n---\n### ${formatTitleWithDate(summary.title)}\n`;
    const newSection = buildMarkdown(
      {
        topic,
        summary,
        fullPage,
        answers,
        gaps,
        related,
        pageUrl: summary.pageUrl,
        mastery,
      },
      { includeResearch: false },
    );
    const updatedContent = `${existing.content ?? ""}${dateHeader}${newSection}`;
    const newId = await updateBlog(existing.id, updatedContent, token);
    return newId;
  }
  const titleWithDate = formatTitleWithDate(summary.title);
  const markdown = buildMarkdown(
    {
      topic,
      summary,
      fullPage,
      answers,
      gaps,
      related,
      pageUrl: summary.pageUrl,
      mastery,
    },
    { includeResearch: true },
  );
  const newId = await createChildBlog(
    {
      title: titleWithDate,
      content: markdown,
      parentId: parentChoice.id,
      parentTypeName: parentChoice.title,
    },
    token,
  );
  return newId;
}

/**
 * Prints blog link for review.
 *
 * @param id - blog id
 * @param title - blog title for display
 */
function printBlogLink(id: string, title: string): void {
  const url = `https://sun.int.scarlettparker.co.uk/blog/${id}`;
  console.log(chalk.cyan(`\nRead and review: ${url} - "${title}"`));
  console.log(
    chalk.dim(
      "Open the link to review before attempting again - knowledge builds on each pass.",
    ),
  );
}

/**
 * Presents related overview high level.
 *
 * @param related - related topics
 * @param searchResults - broad search results
 */
function presentRelatedOverview(
  related: WikiBucket["related"],
  searchResults: WikiBucket["searchResults"],
): void {
  console.log(chalk.bold("\nRelated concepts overview:"));
  const combined = [
    ...related,
    ...searchResults.map((s) => ({
      title: s.title,
      pageUrl: s.pageUrl,
      extract: s.extract,
    })),
  ];
  const seen = new Set<string>();
  let idx = 0;
  for (const r of combined) {
    if (seen.has(r.title)) continue;
    seen.add(r.title);
    idx++;
    const overview = r.extract
      ? r.extract.slice(0, 100).replace(/\n/g, " ")
      : "";
    console.log(
      chalk.dim(`  ${idx}. ${r.title}${overview ? ` - ${overview}…` : ""}`),
    );
    if (idx >= 8) break;
  }
}

/**
 * Prompts recurring what to learn more of and difficulty.
 *
 * @param related - related topics
 * @returns next topic and difficulty choice
 */
async function promptRecurring(
  related: WikiBucket["related"],
): Promise<{ nextTopic: string | null; nextDifficulty: string }> {
  const { choice } = await promptInput<{ choice: string }>({
    type: "input",
    name: "choice",
    message:
      "What do you want to learn more of? Type a new topic, or Enter to finish:",
  });
  if (!choice || !choice.trim())
    return { nextTopic: null, nextDifficulty: "same" };
  const trimmed = choice.trim();
  const num = parseInt(trimmed, 10);
  let nextTopic: string | null = null;
  if (!Number.isNaN(num) && num >= 1 && num <= related.length)
    nextTopic = related[num - 1].title;
  else nextTopic = trimmed;
  const { difficulty } = await promptInput<{ difficulty: string }>({
    type: "select",
    name: "difficulty",
    message: "How challenging should the next quiz be?",
    choices: ["same level", "more advanced", "more basic"],
  });
  let nextDifficulty = "same";
  if (difficulty === "more advanced") nextDifficulty = "advanced";
  else if (difficulty === "more basic") nextDifficulty = "basic";
  return { nextTopic, nextDifficulty };
}

/**
 * Prompts for difficulty at start, defaults to same.
 *
 * @returns chosen difficulty
 */
async function promptDifficultyAtStart(): Promise<string> {
  const { difficulty } = await promptInput<{ difficulty: string }>({
    type: "select",
    name: "difficulty",
    message: "How challenging should this quiz be?",
    choices: ["default", "more advanced", "more basic"],
  });
  if (difficulty === "more advanced") return "advanced";
  if (difficulty === "more basic") return "basic";
  return "same";
}

/**
 * Runs a single learn session for a topic.
 *
 * @param topic - topic to learn
 * @param opts - CLI options
 * @param token - auth token
 */
async function runLearnSession(
  topic: string,
  opts: LearnOptions,
  token: string,
): Promise<void> {
  topic = topic.trim().replace(/#+$/, "").trim();
  let startDifficulty = opts.difficulty;
  const hasExplicitFlag = process.argv.includes("--difficulty");
  if (!hasExplicitFlag) {
    startDifficulty = await promptDifficultyAtStart();
  }
  const wiki = await scrapeWiki(topic, token);
  const normalizedTopic = (wiki.summary as NonNullable<WikiBucket["summary"]>).title;
  const parentChoice = await resolveParent(
    wiki.summary as NonNullable<WikiBucket["summary"]>,
    opts,
    token,
  );
  const blogCtx = await gatherBlogContext(normalizedTopic, parentChoice, token);
  const relatedEnrichment = await scrapeRelatedPages(wiki.related, token);
  const fullPageEnriched = [wiki.fullPage, relatedEnrichment]
    .filter(Boolean)
    .join("\n\n");
  const chunks = fullPageEnriched ? chunkPage(fullPageEnriched) : [];
  const sampledForQuiz = chunks.length
    ? sampleChunksForQuiz(chunks, blogCtx.priorContext, 3)
    : fullPageEnriched;
  let readinessReady = false;
  if (blogCtx.existingForContext) {
    const { assessReadiness } = await import("./quiz/revisit.js");
    const attempts = blogCtx.attempts as never[];
    const readiness = await assessReadiness(
      attempts as never,
      wiki.summary!.extract,
      wiki.related.map((r) => r.title),
    );
    readinessReady = readiness.ready;
  }
  const { count: numQuestions, difficulty } = resolveDifficultyAndCount(
    { ...opts, difficulty: startDifficulty },
    readinessReady,
    startDifficulty,
  );
  const combinedPrior = blogCtx.priorContext;
  const quiz = await withThinking(
    `Thinking - generating quiz (${numQuestions} questions, ${difficulty})...`,
    () =>
      generateQuiz({
        topic: normalizedTopic,
        summary: wiki.summary as NonNullable<WikiBucket["summary"]>,
        related: wiki.related,
        priorContext: combinedPrior,
        numQuestions,
        fullPage: sampledForQuiz || wiki.fullPage,
        difficulty,
        mastery: readinessReady,
      }),
  );
  const { answers, correct, gaps } = await runQuiz(quiz.questions);
  console.log(chalk.bold(`\nScore: ${correct}/${quiz.questions.length}`));
  if (opts.dryRun) {
    console.log(chalk.yellow("Dry run, not writing blog"));
    console.log(chalk.dim("\nMarkdown preview:\n"));
    console.log(
      buildMarkdown(
        {
          topic: normalizedTopic,
          summary: wiki.summary as NonNullable<WikiBucket["summary"]>,
          fullPage: fullPageEnriched || wiki.fullPage,
          answers,
          gaps,
          related: wiki.related,
          pageUrl: wiki.summary!.pageUrl,
          mastery: readinessReady,
        },
        { includeResearch: true },
      ),
    );
    return;
  }
  const newId = await createOrUpdateBlog(
    normalizedTopic,
    parentChoice,
    wiki.summary as NonNullable<WikiBucket["summary"]>,
    answers,
    gaps,
    wiki.related,
    fullPageEnriched || wiki.fullPage,
    readinessReady,
    token,
  );
  const isUpdate = Boolean(blogCtx.existingForContext);
  const displayTitle = isUpdate
    ? (blogCtx.existingForContext as { title: string }).title
    : formatTitleWithDate(normalizedTopic);
  console.log(
    chalk.green(
      `\n${isUpdate ? "Updated" : "Created"} blog "${displayTitle}" -> /blog/${newId}`,
    ),
  );
  printBlogLink(newId, displayTitle);
  presentRelatedOverview(wiki.related, wiki.searchResults);
  const { nextTopic, nextDifficulty } = await promptRecurring(wiki.related);
  if (!nextTopic) {
    console.log(
      chalk.dim(
        "\nKeep reviewing the blog link above - knowledge builds with each pass.",
      ),
    );
    return;
  }
  const nextOpts: LearnOptions = { ...opts, difficulty: nextDifficulty };
  // Prefer spawn for clean prompt state, fallback to direct recursion if spawn fails
  try {
    const { spawn } = await import("node:child_process");
    spawn(
      process.argv[0],
      [process.argv[1], "learn", nextTopic, "--difficulty", nextDifficulty],
      {
        stdio: "inherit",
      },
    );
  } catch {
    await runLearnSession(nextTopic, nextOpts, token);
  }
}

const program = new Command();

program
  .name("sun-learn")
  .description("Interactive CLI quiz tutor for Sun KNOWLEDGE")
  .version("0.0.1");

program
  .command("learn")
  .argument("[topic]", "topic to learn")
  .option("--parent <title>", "parent blog title")
  .option("--questions <n>", "number of questions", "10")
  .option("--difficulty <level>", "difficulty: basic|same|advanced", "same")
  .option("--source <kind>", "source kind", "wikipedia")
  .option("--dry-run", "do not write blog")
  .action(async (topic: string | undefined, opts: LearnOptions) => {
    if (!topic || !topic.trim()) {
      const { topic: prompted } = await promptInput<{ topic: string }>({
        type: "input",
        name: "topic",
        message: "What do you want to learn?",
      });
      topic = prompted?.trim();
      if (!topic) {
        console.log(chalk.yellow("No topic given, aborting."));
        return;
      }
    }
    const { token } = await resolveAuth();
    await runLearnSession(topic, opts, token);
  });

program
  .command("review")
  .option("--parent <title>", "parent title")
  .action(async (opts: { parent?: string }) => {
    const { token } = await resolveAuth();
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
    console.log(JSON.stringify({ ...config, llmApiKey: "***" }, null, 2));
  });

program.parse();
