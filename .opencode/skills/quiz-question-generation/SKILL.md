---
name: quiz-question-generation
description: Use when generating quiz questions from wiki/blog at target CEFR level via markdown IR
---

# Quiz question generation (IR markdown)

Generates **markdown IR** from Wikipedia extract + full page plaintext + prior KNOWLEDGE context.

Before you write, read every skill in `.opencode/skills/*` and apply them together: `fill-blank-clarity`, `quiz-dedup-guard`, `quiz-balance`, `quiz-markdown-writer`, `mastery-assessor`, `wiki-context-fetcher`, `knowledge-parent-picker`, plus `anti-ai-slop-writing` `references/banned-words.md`. Don't skip one and don't rely on memory. Each skill is small and specific, so you must pull them all in first. Checklist: list the 7 skills plus banned-words you loaded. Do not use em dashes at all. Use commas, colons, or periods instead.

Then apply structural rules from `anti-ai-slop-writing`: no rule-of-three, mix sentence lengths, no parataxis, no hedging seesaw, active voice, contractions, no em dashes. Use commas or colons instead of stacking dashes.

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

 - Balance and size: see `quiz-balance`. For basic and default roughly one third each. For advanced and mastery, skew to half short, quarter mcq, quarter fill. Variable length 5 basic/easy, 10 default/normal, 15-20 advanced/mastery (hard floor 15, target 20, accept >=15). You must count and push to the full number, don't stop at 7 when 20 was requested; code will top-up then warn if you fall short. Env `LLM_REASONING_EFFORT` and `LLM_MAX_OUTPUT_TOKENS=8192` give you room. Aim to overshoot by 2 so dedup still leaves the target. mcq needs 4 distinct full phrases, all same type as answer, correct spread across A to D, no placeholder "A" or "Not ...1", no option echoing the stem past five chars, never put the answer in parentheses inside an option, and Answer must be bare phrase never "A. phrase" or "B. phrase" (grading compares the phrase after shuffling, a prefix breaks it).
  - Fill clarity: see `fill-blank-clarity`. If the blank could be a year or a title, add the cue. Don't write bare "in \_**\_." for 1785. Write "in \_\_** [year]" or ask "In what year...". Same for [person], [work], [place]. Never add e.g. `(1785)` inside an mcq option. Never include the answer in the stem, see that skill for the self-leak ban.
  - Dedup: see `quiz-dedup-guard`. Don't carve two fills from one sentence. Q8 and Q9 both quoting "Act only according to that maxim whereby you can... universal law" is the failure case. If you use a sentence once, pick a different one next. Local `areExplanationsOverlapping` from `@sun/utils/nlp` will drop the later one, so you lose a question. Also never let a stem contain its own answer as a whole word or phrase, code will drop leaked questions and force regeneration.
 - Difficulty: for advanced and mastery don't stay on recall. Add synthesis and application: take a new scenario and ask what the principle would say, compare aspects, ask why a claim fails. That is harder than recall and avoids generic self-answers. Keep the other type default, just make the prompt applied.
 - Explanations: short verbatim wiki span only; pageUrl lives once at top Source. Use `wikipediaRelatedTopics` and `wikipediaSearch` titles only when the IR includes a suggestions block. Prior KNOWLEDGE, gaps, and full page text (now chunked, not sliced to 8000) guide difficulty. Get harder when mastery shows, mix synthesis and dating and comparison, don't stay on definitions. Stay on the drilled Topic. If Topic is via child, keep every question on that Child Topic, not generic parent background, unless that text directly illustrates the Child.
