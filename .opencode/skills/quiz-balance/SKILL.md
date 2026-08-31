---
name: quiz-balance
description: Use when sizing and balancing a quiz across types and difficulty
---

# Quiz balance

You set how many and what mix, and you push difficulty when the learner shows it.

Must load `anti-ai-slop-writing` `references/banned-words.md` before writing. Keep sentences varied, don't hedge, use active voice and mix short with longer lines.

## Rules

- Default for basic and same is roughly one third each: `mcq`, `fill`, `short`. For advanced and mastery, skew to half short, a quarter mcq, a quarter fill. Short lets you ask synthesis without giving the answer away in the options, and that's where the hard thinking lives.
- Variable length: 10 for basic, 15 for same, up to 30 for advanced or mastery when full page is there. Env `LLM_REASONING_EFFORT` and `LLM_FAST_EFFORT` control thinking, but the count stays in code.
- Get harder as prior attempts show mastery. Add synthesis and application: take a new maxim or scenario and ask what the categorical imperative would say, compare formulations, ask why a maxim fails universalization. Don't stay on definitions. If you stay on "what is..." the learner stalls, so you must shift the mix toward those applied cases.
- mcq: 4 distinct full phrases, all same type as the answer. If the answer is a year, all options are years. If the answer is a work, all options are works. Never mix a year with a book title in one mcq. Randomize correct across A to D, no placeholder "A" or "Not ...1", and never put the answer in parentheses inside an option. That Q1 `D. The 18th century (1785)` is the failure case — the `(1785)` gives the game away, and the other options are the wrong type. Keep distractors plausible and close: other years within a decade, other Kant works, other moral frameworks.
- Spaced repetition is fine, but keep spans distinct. `quiz-dedup-guard` is the brake.
