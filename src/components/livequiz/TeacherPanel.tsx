// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { avatarSrc } from "./avatars";
import { sampleQuestions, PILL_LABEL, eliminationOrderFull } from "./scoring";
import { Play, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  createLiveSession,
  getTeacherSession,
  updateLiveSession,
  listResponses,
} from "@/lib/livequiz.functions";

function makeCode(): string {
  // Timestamp prefix guarantees uniqueness even under rapid double-submit
  const ts = Date.now().toString(36).toUpperCase();
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 4; i++) r += ch[Math.floor(Math.random() * ch.length)];
  return ts + r;
}

type Session = {
  id: string;
  code: string;
  host_token: string;
  phase: "lobby" | "active" | "results" | "ended";
  current_question_index: number;
  question_started_at: string | null;
  timer_max_seconds: number;
  questions: any[];
};

const STORAGE_KEY = "livequiz_teacher_session";

export function TeacherPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false); // synchronous guard against double-submit

  const createFn     = useServerFn(createLiveSession);
  const getTeacherFn = useServerFn(getTeacherSession);
  const updateFn     = useServerFn(updateLiveSession);
  const listFn       = useServerFn(listResponses);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { id, hostToken } = JSON.parse(raw);
      if (!id || !hostToken) return;
      getTeacherFn({ data: { sessionId: id, hostToken } }).then((row) => {
        if (row && (row as any).phase !== "ended") setSession(row as Session);
      }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;
    async function tick() {
      try {
        const rows = await listFn({ data: { sessionId: session.id, hostToken: session.host_token } });
        if (!cancelled) setResponses(rows as any[]);
      } catch {}
    }
    tick();
    const iv = setInterval(tick, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [session?.id, session?.host_token]);

  const participants = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string }>();
    for (const r of responses) {
      if (!m.has(r.student_id)) m.set(r.student_id, { name: r.student_name, avatar: r.student_avatar });
    }
    return m;
  }, [responses]);

  async function createSession() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const row = await createFn({
        data: { code: makeCode(), gameMode: "prep-lock", questions: sampleQuestions(10), timerMaxSeconds: 30 },
      });
      setSession(row as Session);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: (row as any).id, hostToken: (row as any).host_token }));
      } catch {}
    } catch (e: any) {
      alert(e?.message ?? "Could not create session. Reset any existing session first.");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  async function applyPatch(patch: any) {
    if (!session) return;
    await updateFn({ data: { sessionId: session.id, hostToken: session.host_token, patch } });
    setSession({ ...session, ...patch });
  }

  async function startQuiz() {
    await applyPatch({ phase: "active", current_question_index: 0, question_started_at: new Date().toISOString() });
  }

  async function nextQuestion() {
    if (!session) return;
    const next = session.current_question_index + 1;
    if (next >= session.questions.length) {
      await applyPatch({ phase: "results" });
    } else {
      await applyPatch({ current_question_index: next, question_started_at: new Date().toISOString() });
    }
  }

  async function resetSession() {
    if (!session) return;
    if (!confirm("End this session and start a new one?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    await updateFn({ data: { sessionId: session.id, hostToken: session.host_token, patch: { phase: "ended" } } }).catch(() => {});
    setSession(null);
    setResponses([]);
  }

  const joinUrl = `${window.location.origin}/?livequiz`;

  // Timer for elimination animation
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (session?.phase !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [session?.phase]);

  const activeQ = session?.phase === "active"
    ? session.questions?.[session.current_question_index]
    : null;
  const startedAt = session?.question_started_at
    ? new Date(session.question_started_at).getTime()
    : Date.now();
  const timerMaxMs = (session?.timer_max_seconds || 30) * 1000;
  const elapsed = Math.max(0, now - startedAt);
  const elimStart = timerMaxMs * 0.3;
  const elimEnd   = timerMaxMs * 0.95;
  const elimProgress = session?.phase === "active"
    ? Math.min(1, Math.max(0, (elapsed - elimStart) / (elimEnd - elimStart)))
    : 0;
  const cappedElimCount = activeQ
    ? Math.min(
        Math.floor(elimProgress * eliminationOrderFull(activeQ).length),
        Math.max(0, eliminationOrderFull(activeQ).length - 1),
      )
    : 0;

  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-elim]").forEach((el) => el.removeAttribute("data-quiz-elim"));
    clear();
    if (!activeQ || session?.phase !== "active" || cappedElimCount === 0) return clear;
    const order = eliminationOrderFull(activeQ);
    order.slice(0, cappedElimCount).forEach((pillId) => {
      document.querySelectorAll(`[data-cell-id="${pillId}"]`).forEach((el) =>
        (el as HTMLElement).setAttribute("data-quiz-elim", "1"),
      );
    });
    return clear;
  }, [cappedElimCount, activeQ?.correctPillId, session?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const answeredThisQ = session
    ? responses.filter((r) => r.question_index === session.current_question_index).length
    : 0;

  // Current question prompt
  const prompt = activeQ
    ? (activeQ.kind === "pronoun"
        ? `${activeQ.prefix ?? ""} ${activeQ.prep.token} ___ ${activeQ.suffix ?? ""}`.trim()
        : `${activeQ.prefix ?? ""} ${activeQ.prep.token} ___ ${activeQ.nounDe}${activeQ.suffix ? " " + activeQ.suffix : ""}`.trim())
    : null;
  const promptEn = activeQ
    ? (activeQ.kind === "pronoun" ? activeQ.targetEn : `${activeQ.nounArticle} ${activeQ.nounEn}`)
    : null;

  return (
    <>
      {/* ── Left teacher panel: QR → question → controls ── */}
      <div className="fixed left-0 top-[52px] bottom-0 w-80 z-50 flex flex-col p-4 gap-3 pointer-events-none">

        {/* QR card */}
        <div className="pointer-events-auto flex flex-col items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-poster-ink/10">
          <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold">
            Scan to join the quiz!
          </div>
          <QRCode value={joinUrl} size={192} level="M" />
          <div className="text-[9px] text-poster-ink/30 tracking-wide">{joinUrl}</div>
        </div>

        {/* Question text — floats over cheatsheet, grows to fill space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-2">
          {activeQ && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
                Q{session.current_question_index + 1} / {session.questions.length}
                {" · "}{answeredThisQ} / {participants.size} answered
              </div>
              <div className="text-6xl font-bold text-poster-ink leading-tight tracking-tight drop-shadow-sm">
                {prompt}
              </div>
              {promptEn && (
                <div className="text-xl text-poster-ink/60 font-medium drop-shadow-sm">{promptEn}</div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="pointer-events-auto bg-poster-bg/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-poster-ink/10">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-between px-4 py-3 bg-poster-teal text-white"
          >
            <span className="font-bold text-sm tracking-tight">Live Quiz · Teacher</span>
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {!collapsed && (
            <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
              {!session ? (
                <button
                  onClick={createSession}
                  disabled={creating}
                  className="w-full py-3 rounded-full bg-poster-teal text-white font-bold text-base hover:bg-poster-teal/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating…" : "Start Session"}
                </button>
              ) : (
                <>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold mb-2">
                      Joined ({participants.size})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...participants.values()].map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-poster-yellow/20 rounded-full px-2 py-1 text-xs font-medium text-poster-ink"
                        >
                          <img src={avatarSrc(p.avatar)} alt="" className="w-4 h-4" />
                          <span>{p.name}</span>
                        </div>
                      ))}
                      {participants.size === 0 && (
                        <div className="text-xs text-poster-ink/30 italic">No students yet</div>
                      )}
                    </div>
                  </div>

                  {session.phase === "lobby" && (
                    <button
                      onClick={startQuiz}
                      disabled={participants.size === 0}
                      className="w-full py-3 rounded-full bg-poster-teal text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-teal/90 disabled:opacity-40 transition-colors"
                    >
                      <Play size={16} /> Start
                    </button>
                  )}

                  {session.phase === "active" && (
                    <div className="space-y-2">
                      <div className="text-xs text-poster-ink/40 text-center">
                        {answeredThisQ} / {participants.size} answered
                      </div>
                      <button
                        onClick={nextQuestion}
                        className="w-full py-3 rounded-full bg-poster-yellow text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-yellow/90 transition-colors"
                      >
                        <SkipForward size={16} />
                        {session.current_question_index + 1 >= session.questions.length ? "End → Results" : "Next →"}
                      </button>
                    </div>
                  )}

                  {(session.phase === "results" || session.phase === "ended") && (
                    <div className="text-center text-sm font-semibold text-poster-ink/60 py-1">
                      {session.phase === "results" ? "Showing results to students" : "Session ended"}
                    </div>
                  )}

                  <button
                    onClick={resetSession}
                    className="w-full py-2 text-xs text-poster-ink/30 hover:text-poster-ink/60 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={13} /> End / Reset
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
