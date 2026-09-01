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
- Same fact already in Prior blog `What I answered | Detail` rows. If the blog already asked it and got it correct, asking it again is a duplicate.
- Hallucinated answer not in Wiki extract, Full page excerpt, or Prior blog content. If it is not a substring of that source, it is not a duplicate, it is invalid.

## How to fix

- When you draft, pick a different Source Span or subphrase for each `Explain`. If you've used a span, you can't reuse it even with a different blank. Code will re-prompt until N distinct spans are covered, so select distinct spans the first time.

## Heuristic

If you read two Explains and think "these could be one row," they should be one row.
