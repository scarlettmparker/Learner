---
name: knowledge-parent-picker
description: Use when picking a KNOWLEDGE parent for a new blog topic in Learner CLI.
---

# Knowledge parent picker

Picks parent via `enquirer` single cast `src/quiz/prompt.ts` `promptInput` `as unknown as {prompt}`.

Flow:

- `listKnowledgeParents(token)` `ListBlogPostsDocument` filter `type.name EQUALS KNOWLEDGE` sort `lastUpdatedAt DESC` size 50.
- `findBestParentByWikiExtract(extract,token)` scores `parents` where `lowerExtract.includes(titleLower)` by `titleLower.length` longest match - only when `extract` truthy. If `summary==null` bypass suggestion and use `findParentByTitleFuzzy(topic)` `MATCHES` on `KNOWLEDGE`.
- `pickParentInteractive(token,suggested)` builds `ordered=[suggested,...rest]` else `parents`, choices `p.title + (suggested?" (suggested)":"")` + `[Create new top-level KNOWLEDGE]`. On select, `listChildren` and drill: show children then `Select this one | child titles | [Back]`. Recurses on `[Back]`. Returns `{id,title}` or `{null,null}` for top-level.

Never hard-code parent. Use `withThinking` not needed for picker (prompt is interactive). Keep `formatTitleWithDate(topic)` `DD/MM/YYYY HH:MM:SS` for creation only.
