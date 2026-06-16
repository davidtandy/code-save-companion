# Phase 2 — Live Classroom Quiz Frontend

Backend (`quiz_session`, `quiz_responses`, Realtime, RLS) is already live. This phase wires URL params, lobby, teacher controls, realtime sync, pill elimination, scoring, and leaderboard. No edits to existing game logic in `useQuiz.ts` — it stays the single-player engine. Live mode is a thin layer on top.

## URL routing

`Index.tsx` reads `window.location.search`:
- no param → normal cheatsheet (unchanged)
- `?livequiz` → student flow
- `?livequizteacher` → teacher flow (cheatsheet + teacher control bar)

## Flows

### Teacher (`?livequizteacher`)
1. Lands on the cheatsheet with a fixed "Live Quiz" panel (bottom-right).
2. Panel shows: session code (6-char), QR code pointing to `https://<host>/?livequiz&code=XXXXXX`, joined-student list (avatar + name), and a game-mode picker (reuses existing modes from `quizData.ts`).
3. Buttons: Start, Next Question, End / Reset.
4. On Start: writes `phase=active`, `current_question_index=0`, `question_started_at=now()`, `game_mode` to `quiz_session`.
5. Advancing: increments `current_question_index`, updates `question_started_at`. After last question → `phase=results`.

### Student (`?livequiz`)
1. If no `code` param → simple "Enter session code" screen.
2. With valid code → lobby: avatar grid (reuse pronoun/poster SVG assets — `i`, `you`, `he`, `she`, `they`, `us`, `it`, `yall`, `toaster`, `chef-hat`) + single name input + Join button. Creates a local `student_id` (uuid in localStorage).
3. After join: "Waiting for teacher…" screen subscribed to session.
4. When `phase=active`: full-screen question card derived from `quizData.ts` for the active `game_mode` + `current_question_index`. Reuses the existing mobile pill interaction (tap-to-zoom, tap-to-confirm) — pulled into a shared `LivePillBoard` component built from the same primitives.
5. Pill elimination: a client-side timer from `question_started_at` + `timer_max_seconds` greys out wrong pills progressively (most-obviously-wrong first, confusable last). Order derived per question from `quizData.ts` based on game mode axis.
6. On answer tap → insert into `quiz_responses` with `response_ms`, `is_correct`, `points` (speed-weighted: `max(0, round(1000 * (1 - elapsed/timer_max)))`, +500 bonus if correct).
7. Locked state shows ✓/✗ + points earned + running total.
8. When `phase=results`: leaderboard (top 10 by sum of `points`), highlights current student.

## Realtime

One `supabase.channel` per page, scoped to `session_id`:
- Teacher subscribes to `quiz_responses` INSERTs to update live counts/joined list (joins detected via first response with `question_index = -1` "lobby ping", or by maintaining a tiny `quiz_participants` derived view — see Open question below).
- Student subscribes to `quiz_session` UPDATEs for phase / question-index changes.

Channel teardown in `useEffect` cleanup.

## Files to create

- `src/components/livequiz/LiveQuizProvider.tsx` — session subscription + context (sessionId, phase, currentIndex, gameMode, timer, student identity)
- `src/components/livequiz/StudentLobby.tsx` — code entry → avatar + name → join
- `src/components/livequiz/StudentQuiz.tsx` — waiting / question / locked / leaderboard
- `src/components/livequiz/TeacherPanel.tsx` — floating panel on cheatsheet (QR, code, joined list, controls)
- `src/components/livequiz/LivePillBoard.tsx` — extracted shared pill-tap interaction
- `src/components/livequiz/qr.ts` — QR generation (uses tiny inline SVG generator — **no new npm dep**, ~80 lines)
- `src/components/livequiz/scoring.ts` — points formula + elimination order helpers
- `src/components/livequiz/avatars.ts` — curated avatar list from existing `src/assets/pronouns/*`

## Files to edit

- `src/pages/Index.tsx` — detect URL param, branch to `StudentLobby` / `StudentQuiz` (full screen) or render cheatsheet + `TeacherPanel` overlay.

Total: 7 new files, 1 edit. This exceeds the "2 files" rule — flagging explicitly for approval.

## Open questions / assumptions

1. **QR library**: I'll hand-roll a minimal QR SVG (no dependency). If you'd rather install `qrcode`, say so.
2. **Joined student list**: simplest is reading distinct `(student_id, student_name, student_avatar)` from `quiz_responses` filtered to a "join" row (`question_index = -1`, `answer = 'join'`). No schema change needed. Alternative is a new `quiz_participants` table — heavier. **Proposing the join-row approach.**
3. **Session code**: 6 uppercase alphanumeric, generated client-side on teacher Start. Collisions extremely unlikely; if a unique-constraint conflict occurs, regenerate.
4. **Timer default**: 30s from existing `timer_max_seconds` column.
5. **Game mode selector** on teacher panel uses the existing game modes (Article Mutation, Prep Lock, Question Word, W-Fragen) — same list `useQuiz` already understands.

## Out of scope

- Auth (no accounts, ever).
- Persisting past sessions / history.
- Mid-game rejoin if a student closes the tab (localStorage `student_id` makes it work for the same browser, but no recovery UI).
- Editing `useQuiz.ts` or any existing game component.

Reply "go" to proceed, or tell me what to cut / change.