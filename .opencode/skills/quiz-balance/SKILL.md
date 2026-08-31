---
name: quiz-balance
description: Use when sizing and balancing a quiz across types and difficulty
---

# Quiz balance

You set how many and what mix, and you push difficulty when the learner shows it.

Must load `anti-ai-slop-writing` `references/banned-words.md` before writing. Keep sentences varied, don't hedge, use active voice and mix short with longer lines.

## Rules

- Default ~33% mcq, ~33% fill, ~33% short, balanced. Don't let one type dominate just because the source is heavy on dates.
- Variable length: 10 for basic, 15 for same, up to 30 for advanced/mastery when full page is available. Env `LLM_REASONING_EFFORT`/`LLM_FAST_EFFORT` controls effort, but the count stays in code.
- Get harder as prior attempts show mastery. Add synthesis, application, comparison, dating, relation beats. If you stay on definitions the learner stalls, so you must shift the mix.
- mcq: 4 distinct full phrases, randomize correct across A-D, no placeholder "A/B/C/D" or "Not ...1".
- Spaced repetition is fine, but keep spans distinct. `quiz-dedup-guard` is the brake.
