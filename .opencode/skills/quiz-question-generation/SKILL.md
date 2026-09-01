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

 - Source: every Answer and Explain must be a contiguous substring or subphrase of Wiki extract, Full page excerpt, or Prior blog content. You are given a numbered Source Spans list, select distinct spans and build one Q per span, do not invent outside that list. Prefer subphrases to hit N without reuse.
 - Balance and size: see `quiz-balance`. For basic and default roughly one third each. For advanced and mastery, skew to half short, quarter mcq, quarter fill. Variable length 5 basic/easy, 10 default/normal, 15-20 advanced/mastery (hard floor 15, target 20, accept >=15). You must deliver exactly N, code will re-prompt until N is present, so deliver N the first time. Env `LLM_REASONING_EFFORT` and `LLM_MAX_OUTPUT_TOKENS=12288` give you room. mcq needs 4 distinct full phrases, all same type as answer, only one correct, correct spread across A to D, no placeholder "A" or "Not ...1", no option echoing the stem past five chars, never put the answer in parentheses inside an option, and Answer must be bare phrase never "A. phrase" or "B. phrase".
  - Fill clarity: see `fill-blank-clarity`. Every fill must be a concrete idea and must carry a cue after ____ like [year] [person] [concept] or be phrased as a direct question. Never leave a bare ____ without a cue. Never include the answer in the stem.
  - Dedup: see `quiz-dedup-guard`. Pick a different source span per Q, code will re-prompt if you repeat, so select distinct spans the first time.
 - Difficulty: for advanced and mastery don't stay on recall. Add synthesis and application: take a new scenario and ask what the principle would say, compare aspects, ask why a claim fails.
 - Explanations: short verbatim source span or subphrase only; pageUrl lives once at top Source. Stay on the drilled Topic.
 - Checking: verify each Q against the Source Spans list before finalizing.
