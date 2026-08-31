---
name: quiz-question-generation
description: Use when generating quiz questions from wiki/blog at target CEFR level via markdown IR
---

# Quiz question generation (IR markdown)

Generates **markdown IR** from Wikipedia extract + full page plaintext + prior KNOWLEDGE context. Must load anti-ai-slop-writing references/banned-words.md before writing. Apply structural rules: no rule-of-three, mix sentence lengths, no parataxis, no hedging seesaw, active voice, contractions, ≤1 em dash/500w.

Output markdown only, no JSON, no code block wrapper. Exact format:

```
Q1 [mcq] What is ...?
A. full phrase
B. full phrase
C. full phrase
D. full phrase
Answer: full phrase of correct option
Explain: short verbatim wiki span + pageUrl

Q2 [fill] Sentence with ____ blank.
Answer: word
Explain: wiki span

Q3 [short] Open question?
Answer: concise phrase
Explain: wiki span
```

Rules: ~33% mcq, ~33% fill, ~33% short balanced; variable length 10 easiest up to 30 hardest/mastery (default 6 for dry-run, 10 basic, 20 same, 30 advanced/mastery when full page available); mcq 4 distinct full phrases, deduplicate stem/options (no option repeats stem substring >5 chars), randomize correct position across A-D (not always A), never placeholders A/B/C/D or Not ...1; explanations verbatim wiki span (quote short span + pageUrl); suggestions from wikipediaRelatedTopics + wikipediaSearch titles only when IR includes suggestions block; prior KNOWLEDGE + gaps + full page plaintext (up to 12000, slice 0..8000) inform difficulty; when mastery/advanced use synthesis across sections with detailed questions from full page scrapes, when basic use definitions; enrich prompts with full page scrapes for every session when available (even basic) to avoid summary-only loops; no banned words.
