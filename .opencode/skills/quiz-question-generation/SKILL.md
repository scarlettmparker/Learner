---
name: quiz-question-generation
description: Use when generating quiz questions from wiki/blog at target CEFR level
---

# Quiz question generation

Generates JSON quiz from Wikipedia extract + prior KNOWLEDGE context. Must load anti-ai-slop-writing references/banned-words.md before writing.

Output JSON:
```json
{
  "questions": [
    {"type":"mcq","stem":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."},
    {"type":"fill","stem":"... ____ ...","answer":"...","explanation":"..."},
    {"type":"short","stem":"...","answer":"...","explanation":"..."}
  ],
  "suggestions": ["Related Title 1","Related Title 2"]
}
```

Rules: 50% mcq, 25% fill, 25% short; explanations verbatim wiki span; suggestions from wikipediaRelatedTopics titles; no banned words; mix lengths; active voice.
