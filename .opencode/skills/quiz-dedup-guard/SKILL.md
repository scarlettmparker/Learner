---
name: quiz-dedup-guard
description: Use when checking a draft quiz for obvious repeats before finalising
---

# Quiz dedup guard

You catch the repeats that look different but aren't. A common failure is blanking two words from the same source sentence. Both Explains quote that one sentence and only the blank moves. That's a repeat, even though the blank word differs.

Must load `anti-ai-slop-writing` `references/banned-words.md` before writing. Keep it direct, contractions ok, vary how you open paragraphs, and avoid chaining short declaratives.

## What counts as a duplicate

- Same sentence used twice, even with different blank. For example, a question that blanks the subject of a key quote and the next question that blanks the predicate of that same quote share the sentence, so the second should never have been made.
- Same `Explain` span. If two Explains share more than a handful of words (roughly six in a row or Jaccard ≥0.6), they're the same source. Keep the first, drop the second.
- Same normalized answer after lowercasing and singularising. "motivation" vs "motivations" is the same.
- Stem that contains another question's answer. If you asked "who introduced concept X" then a later stem says "the introduction of concept X", that leaks.
- Stem that contains its own answer. If the stem lists the answer among alternatives and then asks for it, or repeats the answer as a whole word or phrase before the blank, that leaks. Check case-insensitive, singular and plural, and split hyphenated compounds. The blank must be the only place the answer appears.

## How to fix, fast, no LLM retry

- Don't re-ask the model. Filter locally with `areExplanationsOverlapping` from `@sun/utils/nlp` (Jaccard ≥0.6 or 6-token run) and answer/stem equality. Keep the first occurrence, drop the later one. If you drop, don't pad with a near-copy. Leave the quiz one short or pull from a different paragraph instead.
- When you draft, pick a different sentence or a different paragraph for each `Explain`. If you've used a sentence, you can't reuse it even with a different blank.

## Heuristic

If you read two Explains and think "these could be one row," they should be one row.
