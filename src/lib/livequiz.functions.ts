// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";

// All live-quiz DB access goes through these server fns using the
// service-role admin client. Tables have no anon/authenticated grants.

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- Teacher: create session ----------
export const createLiveSession = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; gameMode: string; questions: unknown[]; timerMaxSeconds: number }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("quiz_session")
      .insert({
        code: data.code,
        game_mode: data.gameMode,
        phase: "lobby",
        current_question_index: 0,
        timer_max_seconds: data.timerMaxSeconds,
        questions: data.questions as any,
      })
      .select("id, code, host_token, phase, current_question_index, question_started_at, timer_max_seconds, questions, game_mode")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Public: read safe session fields by code (students) ----------
export const getPublicSession = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("quiz_session")
      .select("id, code, phase, current_question_index, question_started_at, timer_max_seconds, questions, game_mode")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Teacher: read full session by id+token (for restore) ----------
export const getTeacherSession = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; hostToken: string }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("quiz_session")
      .select("id, code, host_token, phase, current_question_index, question_started_at, timer_max_seconds, questions, game_mode")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.host_token !== data.hostToken) return null;
    return row;
  });

// ---------- Teacher: update session ----------
export const updateLiveSession = createServerFn({ method: "POST" })
  .inputValidator((d: {
    sessionId: string;
    hostToken: string;
    patch: Partial<{ phase: string; current_question_index: number; question_started_at: string | null }>;
  }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: existing, error: e1 } = await sb
      .from("quiz_session")
      .select("host_token")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!existing || existing.host_token !== data.hostToken) throw new Error("Forbidden");

    // Whitelist mutable fields
    const allowed: Record<string, any> = {};
    if (data.patch.phase !== undefined) allowed.phase = data.patch.phase;
    if (data.patch.current_question_index !== undefined) allowed.current_question_index = data.patch.current_question_index;
    if (data.patch.question_started_at !== undefined) allowed.question_started_at = data.patch.question_started_at;

    const { error } = await sb.from("quiz_session").update(allowed).eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Teacher: list responses (gated by host token) ----------
export const listResponses = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; hostToken: string }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: sess, error: e1 } = await sb
      .from("quiz_session")
      .select("host_token")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!sess || sess.host_token !== data.hostToken) throw new Error("Forbidden");

    const { data: rows, error } = await sb
      .from("quiz_responses")
      .select("student_id, student_name, student_avatar, question_index, answer, is_correct, response_ms, points")
      .eq("session_id", data.sessionId);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Student: join (writes a question_index=-1 row) ----------
export const joinSession = createServerFn({ method: "POST" })
  .inputValidator((d: {
    sessionId: string;
    studentId: string;
    studentName: string;
    studentAvatar: string;
  }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const name = String(data.studentName ?? "").trim().slice(0, 30);
    const avatar = String(data.studentAvatar ?? "").slice(0, 40);
    if (!name) throw new Error("Name required");
    const { error } = await sb.from("quiz_responses").upsert({
      session_id: data.sessionId,
      student_id: data.studentId,
      student_name: name,
      student_avatar: avatar,
      question_index: -1,
      answer: "join",
      is_correct: false,
      response_ms: 0,
      points: 0,
    }, { onConflict: "session_id,student_id,question_index" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Student: submit answer ----------
export const submitResponse = createServerFn({ method: "POST" })
  .inputValidator((d: {
    sessionId: string;
    studentId: string;
    studentName: string;
    studentAvatar: string;
    questionIndex: number;
    answer: string;
  }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();

    // Re-derive scoring server-side; never trust client-sent points.
    const { data: sess, error: e1 } = await sb
      .from("quiz_session")
      .select("question_started_at, timer_max_seconds, questions, phase, current_question_index")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!sess) throw new Error("Session not found");
    if (sess.phase !== "active") throw new Error("Not accepting answers");
    if (data.questionIndex !== sess.current_question_index) throw new Error("Wrong question");

    const q = (sess.questions as any[])?.[data.questionIndex];
    if (!q) throw new Error("Question missing");

    // Check for existing attempt by this student on this question.
    const { data: existing } = await sb
      .from("quiz_responses")
      .select("is_correct")
      .eq("session_id", data.sessionId)
      .eq("student_id", data.studentId)
      .eq("question_index", data.questionIndex)
      .maybeSingle();
    if (existing?.is_correct === true) throw new Error("Already answered correctly");

    const isSecondAttempt = !!existing;
    const startedAt = sess.question_started_at ? new Date(sess.question_started_at).getTime() : Date.now();
    const elapsed = Math.max(0, Date.now() - startedAt);
    const timerMaxMs = (sess.timer_max_seconds || 30) * 1000;
    const correctKey = q.kind === "question-words"
      ? q.correctAnswer
      : q.kind === "wfragen"
        ? (q.step === "wword" ? q.correctWWord : q.correctPillId)
        : q.correctPillId;
    const correct = data.answer.toUpperCase() === String(correctKey).toUpperCase();
    let points = 0;
    if (correct) {
      const ratio = Math.max(0, 1 - elapsed / timerMaxMs);
      points = Math.max(0, Math.round(1000 * ratio) + 500 - (isSecondAttempt ? 500 : 0));
    }

    const name = String(data.studentName ?? "").trim().slice(0, 30);
    const avatar = String(data.studentAvatar ?? "").slice(0, 40);

    const { error } = await sb.from("quiz_responses").upsert({
      session_id: data.sessionId,
      student_id: data.studentId,
      student_name: name,
      student_avatar: avatar,
      question_index: data.questionIndex,
      answer: String(data.answer).slice(0, 40),
      is_correct: correct,
      response_ms: elapsed,
      points,
    }, { onConflict: "session_id,student_id,question_index" });
    if (error) throw new Error(error.message);
    return { is_correct: correct, points };
  });

// ---------- Public: get latest non-ended session (no code needed) ----------
export const getLatestActiveSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("quiz_session")
      .select("id, code, phase, current_question_index, question_started_at, timer_max_seconds, questions, game_mode")
      .neq("phase", "ended")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Public: get session by ID (student polling after join) ----------
export const getSessionById = createServerFn({ method: "GET" })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("quiz_session")
      .select("id, code, phase, current_question_index, question_started_at, timer_max_seconds, questions, game_mode")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Student: poll my own responses + leaderboard summary ----------
export const getStudentState = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; studentId: string }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    const [mineRes, allRes, joinedRes] = await Promise.all([
      sb.from("quiz_responses")
        .select("question_index, answer, is_correct, points, response_ms")
        .eq("session_id", data.sessionId)
        .eq("student_id", data.studentId),
      sb.from("quiz_responses")
        .select("student_id, student_name, student_avatar, points, question_index")
        .eq("session_id", data.sessionId),
      sb.from("quiz_responses")
        .select("student_id", { count: "exact", head: true })
        .eq("session_id", data.sessionId)
        .eq("question_index", -1),
    ]);
    if (mineRes.error) throw new Error(mineRes.error.message);
    if (allRes.error) throw new Error(allRes.error.message);

    // Aggregate leaderboard (name/avatar/points only — no per-answer detail leaked)
    const totals = new Map<string, { id: string; name: string; avatar: string; points: number }>();
    for (const r of allRes.data ?? []) {
      if ((r as any).question_index < 0) continue;
      const cur = totals.get((r as any).student_id) ?? {
        id: (r as any).student_id,
        name: (r as any).student_name,
        avatar: (r as any).student_avatar,
        points: 0,
      };
      cur.points += (r as any).points || 0;
      totals.set((r as any).student_id, cur);
    }
    const leaderboard = [...totals.values()].sort((a, b) => b.points - a.points).slice(0, 10);

    return {
      mine: mineRes.data ?? [],
      leaderboard,
      joinedCount: joinedRes.count ?? 0,
    };
  });

// ---------- Teacher: reset session in-place (students stay connected) ----------
export const resetLiveSession = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; hostToken: string; questions: unknown[] }) => d)
  .handler(async ({ data }) => {
    const sb = await admin();
    // Verify host token
    const { data: sess, error: e1 } = await sb
      .from("quiz_session")
      .select("host_token")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!sess || sess.host_token !== data.hostToken) throw new Error("Unauthorized");
    // Clear answer rows but keep join rows (question_index=-1) so students stay in lobby
    await sb.from("quiz_responses").delete().eq("session_id", data.sessionId).gte("question_index", 0);
    // Reset session to lobby with fresh questions
    const { data: row, error: e2 } = await sb
      .from("quiz_session")
      .update({
        phase: "lobby",
        current_question_index: 0,
        question_started_at: null,
        questions: data.questions as any,
      })
      .eq("id", data.sessionId)
      .select("id, code, host_token, phase, current_question_index, question_started_at, timer_max_seconds, questions, game_mode")
      .single();
    if (e2) throw new Error(e2.message);
    return row;
  });
