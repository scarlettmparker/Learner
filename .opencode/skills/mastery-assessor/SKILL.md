---
name: mastery-assessor
description: Use when assessing learner mastery from prior blog attempts to decide readiness for advanced topics.
---

# Mastery assessor

Assesses from `extractPriorAttempts(content)` splitting `^##\s+` headers `DD/MM/YYYY HH:MM:SS`, parsing `### Gaps` lines `- …` ignoring `none - all correct`, scoring `| [x] |` vs `[ ]` counts.

Do not use fixed threshold alone. LLM judges via `callMuseSpark` `POST https://opencode.ai/zen/go/v1/responses` `{model,input:[{role,content}]}` (model `muse-spark-1.2-contributor` no `opencode-go/` prefix, `LLM_*` env-only). Input includes `Prior attempts: N, latest gaps, scores, summary.extract, full page snippet, related titles, blog children intents`. LLM returns `{ready:boolean,gaps:string[],suggestedTopics:string[]}` and drives difficulty. Variable `numQuestions`: 10 easiest (basic), 20 default, up to 30 hardest/mastery when full page available and `ready` true (LLM decides, not hard `attempts>=2`). `filterGapsForRepetition` SM-2 decay 1/3/7 days capped 5. `buildPriorContextFromAttempts(attempts)` returns string for prompt. Full page plaintext (explaintext 12000, slice 8000) fetched for enrichment even before mastery (to ask detailed questions), but wider when `ready`.
