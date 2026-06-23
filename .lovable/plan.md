## Problem

When a teacher selects **W-Fragen** (or **Question Words**) and clicks Start, the page crashes (white screen).

`src/components/livequiz/TeacherPanel.tsx` line 381 computes `sentence` from `activeQ` *unconditionally*:

```ts
const sentence = activeQ
  ? activeQ.sentence ? (...) : buildSentence(activeQ)
  : null;
```

`buildSentence` (line 53) reads `q.prep.token`. W-Fragen and Question-Words questions have no `prep` field, so this throws `TypeError: cannot read 'token' of undefined` during render, breaking the whole React tree.

The render side (line 425) already routes these modes to `TeacherQWDisplay` / `TeacherWFragenDisplay` and never uses `sentence`, so the computation just needs to be skipped for those modes.

## Fix

Single change in **`src/components/livequiz/TeacherPanel.tsx`** at the `sentence` declaration (~line 381):

Wrap the computation so it only runs for the article (`prep-lock`) mode that actually consumes it:

```ts
const sentence = activeQ
  && session?.game_mode !== "question-words"
  && session?.game_mode !== "wfragen"
  ? activeQ.sentence ? (...existing...) : buildSentence(activeQ)
  : null;
```

No other files touched. No DB / no schema changes.

## Expected result

- W-Fragen Start → teacher panel renders `TeacherWFragenDisplay` instead of crashing.
- Question Words Start → unchanged (was already routed correctly on render side, now safe on compute side too).
- Article Quiz Start → unchanged behaviour.
