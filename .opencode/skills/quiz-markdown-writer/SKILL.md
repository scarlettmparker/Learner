---
name: quiz-markdown-writer
description: Use when writing markdown for quiz child blog from answers
---

# Quiz markdown writer

Writes child blog markdown from quiz answers. Loads anti-ai-slop-writing.

Template (first attempt only 0 `includeResearch:true`):

```
Source: [Title](pageUrl)

### What was researched
> verbatim extract

### What I answered
| # | Q | Result | Detail |
|---|---|---|---|
| 1 | stem | [x] my -> correct | wiki span |
### Gaps
- bullet per wrong, minimal LLM, 2-3 bullets max
```

Updates append only:

```
## DD/MM/YYYY HH:MM:SS

### What I answered
| # | Q | Result | Detail |
### Gaps
```

Code: `buildMarkdown(args, {includeResearch:true})` for new blogs, `{includeResearch:false}` for updates (see `Learner/src/quiz/markdown.ts:86` + `Learner/src/index.ts:311`). Never emit `### Full page excerpt` 0 that text is for generation chunking only, not persistence. `Related` also not persisted.

80% tokens verbatim from wiki + answers, LLM only for Gaps. Date lives in BlogPost title on create and as `##` header on append.
