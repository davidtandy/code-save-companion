# Live Classroom Quiz – Phase 1: Backend schema

Per your "plan-then-execute" rule, here is exactly what I'll do **before** writing any code or running migrations. Nothing happens until you say go.

## 1. Database tables (migration)

Two tables in `public`, both with Realtime enabled, no auth required (students are anonymous).

### `quiz_session`
Single-row-per-active-session table that the teacher controls and students subscribe to.

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `code` | text unique | short join code (e.g. 4 chars) for QR/url |
| `game_mode` | text | which quiz set (e.g. `articleMutation`, `prepLock`, etc.) |
| `phase` | text | `lobby` \| `active` \| `results` \| `ended` |
| `current_question_index` | int | default 0 |
| `question_started_at` | timestamptz | null until phase=active for that question |
| `timer_max_seconds` | int | default 30 |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now(), trigger to bump |

### `quiz_responses`
One row per student answer.

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → quiz_session(id) on delete cascade | |
| `student_id` | uuid | client-generated, persisted in localStorage |
| `student_name` | text | |
| `student_avatar` | text | avatar key |
| `question_index` | int | |
| `answer` | text | the pill value chosen |
| `is_correct` | bool | |
| `response_ms` | int | ms from question_started_at to submission |
| `points` | int | speed-weighted |
| `created_at` | timestamptz | default now() |

Unique constraint: `(session_id, student_id, question_index)` – one answer per question per student.

A lightweight "presence" lobby list is derived from distinct `(student_id, student_name, student_avatar)` in `quiz_responses` once they answer, plus a Realtime presence channel for lobby joins (no extra table needed).

## 2. RLS + GRANTs

Anonymous students need full read + insert. Only the teacher (also anon, no auth) needs update on `quiz_session`. Since there's no auth, access is open but scoped via the unguessable session `id`/`code`:

- `quiz_session`: `GRANT SELECT, INSERT, UPDATE ON … TO anon, authenticated;`
- `quiz_responses`: `GRANT SELECT, INSERT ON … TO anon, authenticated;`
- RLS enabled on both, with permissive policies (`USING (true)` for select/insert; update on quiz_session also `USING (true)`).

Trade-off: anyone with a session code can mutate it. Acceptable for a classroom tool with ephemeral sessions; documented as a known limit. If you want stricter teacher-only updates later, we can add a `teacher_token` column checked in the policy.

## 3. Realtime

Both tables added to `supabase_realtime` publication so the cheatsheet and teacher view can subscribe to changes.

## 4. What I will **not** do in this step

- No UI changes
- No `?livequiz` / `?teacherlivequiz` wiring
- No `useQuiz.ts` edits
- No QR code generation
- No new components

Those come in Phase 2, planned separately once the schema is in.

## Files touched in this phase

- One migration (created via the migration tool)
- Nothing else

Reply "go" to run the migration, or tell me what to change.
