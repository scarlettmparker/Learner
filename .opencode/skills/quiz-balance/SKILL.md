---
name: quiz-balance
description: Use when sizing and balancing a quiz across types and difficulty
---

# Quiz balance

You set how many and what mix, and you push difficulty when the learner shows it.

Must load `anti-ai-slop-writing` `references/banned-words.md` before writing. Keep sentences varied, don't hedge, use active voice and mix short with longer lines.

## Rules

 - Default for basic and default is roughly one third each: `mcq`, `fill`, `short`. For advanced and mastery, skew to half short, a quarter mcq, a quarter fill. Short lets you ask synthesis without giving the answer away in the options, and that's where the hard thinking lives.
 - Variable length: 5 for basic/easy, 10 for default/normal, 15-20 for advanced or mastery (hard floor 15, target 20, accept >=15). Never return 7 when 20 was asked; code has a verification loop that will top-up then warn, so you must draft to 20. `LLM_MAX_OUTPUT_TOKENS=8192` is set so you have room, and reasoning is cheap, so don't stop early 0 pull from different sections, dates, and related topics to fill.
- Get harder as prior attempts show mastery. Add synthesis and application: take a new scenario and ask what the principle would say, compare formulations, ask why a maxim fails universalization. Don't stay on definitions. If you stay on "what is..." the learner stalls, so you must shift the mix toward those applied cases.
- mcq: 4 distinct full phrases, all same type as the answer. If the answer is a year, all options are years. If the answer is a work, all options are works. Never mix a year with a book title in one mcq. Randomize correct across A to D, no placeholder "A" or "Not ...1", and never put the answer in parentheses inside an option. That Q1 `D. The 18th century (1785)` is the failure case 0 the `(1785)` gives the game away, and the other options are the wrong type. Keep distractors plausible and close: other years within a decade, other Kant works, other moral frameworks.
- Spaced repetition is fine, but keep spans distinct. `quiz-dedup-guard` is the brake.
