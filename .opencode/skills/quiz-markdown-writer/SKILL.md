---
name: quiz-markdown-writer
description: Use when writing markdown for quiz child blog from answers
---

# Quiz markdown writer

Writes child blog markdown from quiz answers. Loads anti-ai-slop-writing.

Template:
```
Source: [Title](pageUrl)

### What was researched
> verbatim extract

### What I answered
1. stem
   - My answer: verbatim
   - Correct/Wrong — correct: verbatim

### Gaps
- bullet per wrong, minimal LLM, 2-3 bullets max
```

80% tokens verbatim from wiki + answers, LLM only for Gaps. No date header in body; date in BlogPost title DD/MM/YYYY HH:MM:SS.
