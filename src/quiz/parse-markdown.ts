import type { GenerateArgs, Quiz, QuizQuestion } from "./generate.js";

/**
 * Parses markdown quiz into structured quiz.
 *
 * @param md - markdown from LLM
 * @param args - generation args for limiting count
 * @returns parsed quiz or null when invalid
 */
export function parseMarkdownToQuiz(
  md: string,
  args: GenerateArgs,
): Quiz | null {
  // Split on Q headers like "Q1 [mcq]" - first chunk is preamble, skip it.
  const blocks = md.split(/^Q\d+\s+\[/m).slice(1);

  // Try the primary split first; if it yields nothing, try the raw pattern.
  if (blocks.length) {
    const parsed = parseBlocks(blocks, args);
    if (parsed) {
      return parsed;
    }
  }

  // Fallback: split on the raw header without consuming the bracket content.
  const rawBlocks = md.split(/^Q\d+\s*\[/m);
  if (rawBlocks.length > 1) {
    const parsed = parseRawBlocks(rawBlocks, args);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

/**
 * Parses blocks from the first split strategy.
 *
 * @param blocks - blocks after splitting on Q headers
 * @param args - generation args
 * @returns quiz or null
 */
function parseBlocks(blocks: string[], args: GenerateArgs): Quiz | null {
  const questions: QuizQuestion[] = [];

  for (const block of blocks) {
    const question = parseSingleBlock(block, args);
    if (question) {
      questions.push(question);
    }

    if (questions.length >= args.numQuestions) {
      break;
    }
  }

  if (!questions.length) {
    return null;
  }

  return { questions: questions.slice(0, args.numQuestions) };
}

/**
 * Parses a single block from the first strategy.
 *
 * @param block - raw block text
 * @param args - generation args (unused, kept for symmetry)
 * @returns question or null
 */
function parseSingleBlock(
  block: string,
  _args: GenerateArgs,
): QuizQuestion | null {
  const lines = block.split("\n");
  const firstLine = lines[0] ?? "";

  // First line looks like "mcq] What is ...?" - extract type before the closing bracket.
  const typePart = firstLine.split("]")[0] ?? "";
  const type = typePart.trim().toLowerCase() as QuizQuestion["type"];

  if (!type) {
    return null;
  }

  if (!["mcq", "fill", "short"].includes(type)) {
    return null;
  }

  // Stem is everything after the first "]" on the header line.
  const stemParts = firstLine.split("]").slice(1);
  const stem = stemParts.join("]").trim();

  if (!stem) {
    return null;
  }

  const options: string[] = [];
  let answer: string | null = null;
  let explanation: string | undefined;

  // Walk each line and collect options / answer / explanation.
  for (const line of lines) {
    const trimmed = line.trim();

    // Options look like "A. some phrase" - capture the phrase.
    if (/^[A-D]\.\s+/.test(trimmed)) {
      const optionText = trimmed.replace(/^[A-D]\.\s+/, "").trim();
      options.push(optionText);
    } else if (/^Answer:\s*/i.test(trimmed)) {
      // Answer line: "Answer: full phrase"
      answer = trimmed.replace(/^Answer:\s*/i, "").trim();
    } else if (/^Explain:\s*/i.test(trimmed)) {
      // Explanation line: "Explain: wiki span"
      explanation = trimmed.replace(/^Explain:\s*/i, "").trim();
    }
  }

  if (!answer) {
    return null;
  }

  // MCQ must have exactly four options; otherwise discard.
  if (type === "mcq") {
    if (options.length !== 4) {
      return null;
    }
  }

  const question: QuizQuestion = {
    type,
    stem,
    answer,
    explanation,
  };

  if (type === "mcq") {
    question.options = options;
  }

  return question;
}

/**
 * Parses blocks from the raw split fallback.
 *
 * @param rawBlocks - blocks from raw split
 * @param args - generation args
 * @returns quiz or null
 */
function parseRawBlocks(rawBlocks: string[], args: GenerateArgs): Quiz | null {
  const questions: QuizQuestion[] = [];

  // Skip index 0 which is preamble before first Q header.
  for (let i = 1; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const header = block.match(/^\s*(mcq|fill|short)\s*\]\s*([^\n]+)/i);

    if (!header) {
      continue;
    }

    const type = header[1].toLowerCase() as QuizQuestion["type"];
    const stem = header[2].trim();

    if (!stem) {
      continue;
    }

    const opts: string[] = [];
    const optMatches = [...block.matchAll(/^[A-D]\.\s+(.+)$/gm)];

    for (const m of optMatches) {
      const optText = m[1].trim();
      opts.push(optText);
    }

    const ansMatch = block.match(/^Answer:\s*(.+)$/m);
    const expMatch = block.match(/^Explain:\s*(.+)$/m);
    const answer = ansMatch?.[1].trim();

    if (!answer) {
      continue;
    }

    if (type === "mcq") {
      if (opts.length !== 4) {
        continue;
      }
    }

    const question: QuizQuestion = {
      type,
      stem,
      answer,
      explanation: expMatch?.[1].trim(),
    };

    if (type === "mcq") {
      question.options = opts;
    }

    questions.push(question);

    if (questions.length >= args.numQuestions) {
      break;
    }
  }

  if (!questions.length) {
    return null;
  }

  return { questions: questions.slice(0, args.numQuestions) };
}
