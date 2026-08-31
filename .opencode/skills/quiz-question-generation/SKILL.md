---
name: quiz-question-generation
description: Use when generating quiz questions from wiki/blog at target CEFR level via markdown IR
---

# Quiz question generation (IR markdown)

Generates **markdown IR** from Wikipedia extract + full page plaintext + prior KNOWLEDGE context.

Before you write, read every skill in `.opencode/skills/*` and apply them together: `fill-blank-clarity`, `quiz-dedup-guard`, `quiz-balance`, `quiz-markdown-writer`, `mastery-assessor`, `wiki-context-fetcher`, `knowledge-parent-picker`, plus `anti-ai-slop-writing` `references/banned-words.md`. Don't skip one and don't rely on memory. Each skill is small and specific, so you must pull them all in first.

Then apply structural rules from `anti-ai-slop-writing`: no rule-of-three, mix sentence lengths, no parataxis, no hedging seesaw, active voice, contractions, at most one em dash per 500 words. Use commas or colons instead of stacking dashes.

Output markdown only, no JSON, no code block wrapper. Exact format:

```
Q1 [mcq] What is ...?
A. full phrase
B. full phrase
C. full phrase
D. full phrase
Answer: full phrase of correct option
Explain: short verbatim wiki span

Q2 [fill] Sentence with ____ blank.
Answer: word
Explain: wiki span

Q3 [short] Open question?
Answer: concise phrase
Explain: wiki span
```

Rules (delegated, read the granular skills for detail):

- Balance and size: see `quiz-balance`. Roughly one third mcq, one third fill, one third short. Variable length 10 basic, 15 same, up to 30 advanced when full page is there. Env `LLM_REASONING_EFFORT` and `LLM_FAST_EFFORT` control thinking. mcq needs 4 distinct full phrases, correct spread across A to D, no placeholder "A" or "Not ...1", and no option echoing the stem past five chars.
- Fill clarity: see `fill-blank-clarity`. If the blank could be a year or a title, add the cue. Don't write bare "in ____." for 1785. Write "in ____ [year]" or ask "In what year...". Same for [person], [work], [place].
- Dedup: see `quiz-dedup-guard`. Don't carve two fills from one sentence. Q8 and Q9 both quoting "Act only according to that maxim whereby you can... universal law" is the failure case. If you use a sentence once, pick a different one next. Local `areExplanationsOverlapping` from `@sun/utils/nlp` will drop the later one, so you lose a question.
- Explanations: short verbatim wiki span only; pageUrl lives once at top Source. Use `wikipediaRelatedTopics` and `wikipediaSearch` titles only when the IR includes a suggestions block. Prior KNOWLEDGE, gaps, and full page text up to 12000 chars (slice 0 to 8000) guide difficulty. Get harder when mastery shows, mix synthesis and dating and comparison, don't stay on definitions.
