---
name: fill-blank-clarity
description: Use when writing fill-in-the-blank stems so the learner knows what kind of answer is expected
---

# Fill blank clarity

You write a fill stem where the blank alone doesn't say what to give: year, name, title, place, term. Don't leave that guesswork to the learner. A warning example: "The treaty was signed in ____." could be "1919" or "Versailles" and both fit the grammar, so the learner guesses the wrong type because the cue was missing.

Must load `anti-ai-slop-writing` `references/banned-words.md` before writing. Apply its structural rules. Mix sentence lengths, don't chain three short declaratives, use contractions and active voice, and keep it direct.

## Rules

- If the answer is a year or number, include the cue in the stem: "in ____ [year]" or "In what year was the treaty signed?" Never a bare "in ____." when you want a year.
- Same for people, works, places: "the book ____ [work]", "the author ____ [person]", "in ____ [city]". Or rephrase as a question that names the type.
- Keep the cue in brackets right after the blank; don't bury it in the Explain. The learner sees the stem first.
- Don't give the answer away, just the type. "[year]" is enough, not "[year 1919]". And never put the answer in parentheses inside an option. A failure like `The 18th century (1785)` answers itself, so the other centuries are pointless. Keep the option clean: `The 18th century`.
- Never include the answer anywhere in the stem. The stem must not contain the answer as a whole word, and must not list it among alternatives and then ask for it again. If the answer has multiple words, the stem must not contain that exact phrase and must not contain any content word from the answer as a whole word. Check case-insensitive, singular and plural, and split hyphenated compounds. If you need that term, rephrase the stem to remove it or pick a different sentence entirely.
- Distractors must be same type as the answer. If the answer is a year, all options are years. Don't mix a year with a title or a theory in one mcq. Make them close: other years within a decade, other works by the same author, other related terms, not random outliers.
- One idea per blank. If you need both year and title, make two questions on two different sentences, not two blanks in one.
- Every fill must be grammatically correct as an intentional fragment. The answer must fit the blank without fixing the grammar yourself. Don't write "would ____ [activity]" and expect a gerund like "undermining the process" when the stem needs a base verb like "undermine". Write "would ____ [verb phrase]" for the base form or "would result in ____ [noun phrase]" for the gerund. Test it by reading the stem with the answer inserted; it should sound right.

## Example fix

- Bad: `Q [fill] The treaty was signed in ____. / Answer: 1919`
- Good: `Q [fill] The treaty was signed in ____ [year]. / Answer: 1919`
- Also good: `Q [short] In what year was the treaty signed?`
