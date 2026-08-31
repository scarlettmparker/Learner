---
name: quiz-balance
description: Use when sizing and balancing a quiz across types and difficulty
---

# Quiz balance

You set how many and what mix, and you push difficulty when the learner shows it.

Must load every skill in `.opencode/skills/*` plus `anti-ai-slop-writing` `references/banned-words.md` before writing. Checklist: list the 7 skills plus banned-words you loaded. Keep sentences varied, don't hedge, use active voice and mix short with longer lines. Do not use em dashes at all.

## Rules

 - Default for basic and default is roughly one third each: `mcq`, `fill`, `short`. For advanced and mastery, skew to half short, a quarter mcq, a quarter fill. Short lets you ask synthesis without giving the answer away in the options, and that's where the hard thinking lives.
 - Variable length: 5 for basic/easy, 10 for default/normal, 15-20 for advanced or mastery (hard floor 15, target 20, accept >=15). Never return 8 when 10 was asked. Aim to overshoot by 2 so dedup still leaves the target: if 10 is requested, draft 12. Code has a verification loop that will top-up then warn, but you must not rely on it. `LLM_MAX_OUTPUT_TOKENS=8192` is set so you have room, and reasoning is cheap, so don't stop early. Pull from different sections, dates, and formulations directly tied to the Topic.
 - Get harder as prior attempts show mastery. Add synthesis and application: take a new scenario and ask what the principle would say, compare formulations, ask why a maxim fails. Do not stay on definitions. If you stay on "what is..." the learner stalls, so you must shift the mix toward those applied cases. Stay on the drilled child. If Topic is via child, keep every question on that Child Topic, not generic parent background, unless that text directly illustrates the Child.
 - mcq: 4 distinct full phrases, all same type as the answer. If the answer is a year, all options are years. If the answer is a work, all options are works. Never mix a year with a book title in one mcq. Randomize correct across A to D, no placeholder "A" or "Not ...1", and never put the answer in parentheses inside an option. That Q1 `D. The 18th century (1785)` is the failure case where the `(1785)` gives the game away, and the other options are the wrong type. Keep distractors plausible and close: other years within a decade, other works from the same domain, other related concepts.
 - Spaced repetition is fine, but keep spans distinct. `quiz-dedup-guard` is the brake.
