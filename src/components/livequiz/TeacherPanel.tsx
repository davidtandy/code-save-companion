// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { qrSvgDataUrl } from "./qr";
import { avatarSrc } from "./avatars";
import { sampleQuestions, PILL_LABEL } from "./scoring";
import { Play, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  createLiveSession,
  getTeacherSession,
  updateLiveSession,
  listResponses,
} from "@/lib/livequiz.functions";

const FIXED_CODE = "GENAU";

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
    setCreating(true);
    try {
      const row = await createFn({
        data: { code: FIXED_CODE, gameMode: "prep-lock", questions: sampleQuestions(10), timerMaxSeconds: 30 },
      });
      setSession(row as Session);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: (row as any).id, hostToken: (row as any).host_token }));
      } catch {}
    } catch (e: any) {
      alert(e?.message ?? "Could not create session. Reset any existing session first.");
    } finally {
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

  // QR always encodes the fixed URL — can be generated without a live session
  const joinUrl = `${window.location.origin}/?livequiz&code=${FIXED_CODE}`;
  const qrDataUrl = useMemo(() => qrSvgDataUrl(joinUrl, 300), [joinUrl]);

  const answeredThisQ = session
    ? responses.filter((r) => r.question_index === session.current_question_index).length
    : 0;

  return (
    <>
      {/* ── QR corner widget — fixed top-right, just below the header ── */}
      <div className="fixed top-[52px] right-3 z-40 flex flex-col items-center gap-1">
        <div className="bg-white/95 rounded-xl p-1.5 shadow-md border border-poster-ink/10">
          <img src={qrDataUrl} alt="Join QR" className="w-24 h-24 block" />
        </div>
        <div className="text-[10px] font-mono font-bold text-poster-ink/50 tracking-widest">
          {FIXED_CODE}
        </div>
      </div>

      {/* ── Controls panel — fixed bottom-right ── */}
      <div className="fixed bottom-4 right-4 z-50 w-64 max-w-[calc(100vw-2rem)] bg-poster-bg rounded-2xl shadow-2xl overflow-hidden border border-poster-ink/10">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-4 py-3 bg-poster-teal text-white"
        >
          <span className="font-bold text-sm tracking-tight">Live Quiz · Teacher</span>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {!collapsed && (
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
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
                {/* Participants */}
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
                    <div className="bg-white/60 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-sm text-poster-ink">
                        {session.questions[session.current_question_index]?.prep?.token} ___
                      </div>
                      <div className="text-xs text-poster-ink/50">
                        ✓ {PILL_LABEL[session.questions[session.current_question_index]?.correctPillId] ?? session.questions[session.current_question_index]?.correctPillId}
                      </div>
                      <div className="text-xs text-poster-ink/40">
                        {session.current_question_index + 1}/{session.questions.length} · {answeredThisQ}/{participants.size} answered
                      </div>
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
    </>
  );
}
