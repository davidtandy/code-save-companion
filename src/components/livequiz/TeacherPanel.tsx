// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function makeCode(): string {
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += ch[Math.floor(Math.random() * ch.length)];
  return s;
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

  const createFn = useServerFn(createLiveSession);
  const getTeacherFn = useServerFn(getTeacherSession);
  const updateFn = useServerFn(updateLiveSession);
  const listFn = useServerFn(listResponses);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { id, hostToken } = JSON.parse(raw);
      if (!id || !hostToken) return;
      getTeacherFn({ data: { sessionId: id, hostToken } }).then((row) => {
        if (row) setSession(row as Session);
      }).catch(() => {});
    } catch {}
  }, []);

  // Poll responses every 2s while a session exists
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

  // Also poll the session row itself (cheap) so phase changes locally if needed
  // (Not strictly required — teacher initiates all phase changes.)

  const participants = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string }>();
    for (const r of responses) {
      if (!m.has(r.student_id)) m.set(r.student_id, { name: r.student_name, avatar: r.student_avatar });
    }
    return m;
  }, [responses]);

  async function createSession() {
    setCreating(true);
    for (let tries = 0; tries < 5; tries++) {
      const code = makeCode();
      try {
        const row = await createFn({ data: {
          code,
          gameMode: "prep-lock",
          questions: sampleQuestions(10),
          timerMaxSeconds: 30,
        }});
        setSession(row as Session);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: (row as any).id, hostToken: (row as any).host_token }));
        } catch {}
        setCreating(false);
        return;
      } catch {
        // duplicate code or transient — retry
      }
    }
    setCreating(false);
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

  const joinUrl = useMemo(() => {
    if (!session) return "";
    const origin = window.location.origin;
    return `${origin}/?livequiz&code=${session.code}`;
  }, [session]);

  const qrDataUrl = useMemo(() => session ? qrSvgDataUrl(joinUrl, 240) : "", [joinUrl, session]);

  const answeredThisQuestion = session
    ? responses.filter((r) => r.question_index === session.current_question_index).length
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-card border-2 border-primary rounded-2xl shadow-2xl overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground"
      >
        <span className="font-bold">Live Quiz · Teacher</span>
        {collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {!session ? (
            <Button onClick={createSession} disabled={creating} className="w-full" size="lg">
              {creating ? "Creating…" : "Create Session"}
            </Button>
          ) : (
            <>
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Code</div>
                <div className="text-3xl font-mono font-bold tracking-widest">{session.code}</div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">Show QR Code</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <img src={qrDataUrl} alt="Join QR" className="w-60 h-60" />
                  <div className="text-xs text-center mt-2 break-all">{joinUrl}</div>
                </PopoverContent>
              </Popover>

              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Joined ({participants.size})
                </div>
                <div className="flex flex-wrap gap-1">
                  {[...participants.values()].map((p, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted rounded-full px-2 py-1 text-xs">
                      <img src={avatarSrc(p.avatar)} alt="" className="w-4 h-4" />
                      <span>{p.name}</span>
                    </div>
                  ))}
                  {participants.size === 0 && <div className="text-xs text-muted-foreground italic">No students yet</div>}
                </div>
              </div>

              {session.phase === "lobby" && (
                <Button onClick={startQuiz} disabled={participants.size === 0} className="w-full" size="lg">
                  <Play size={18} className="mr-2" /> Start
                </Button>
              )}

              {session.phase === "active" && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Question {session.current_question_index + 1}/{session.questions.length} ·
                    {" "}{answeredThisQuestion}/{participants.size} answered
                  </div>
                  <div className="text-sm bg-muted rounded-lg p-2">
                    <div className="font-medium">{session.questions[session.current_question_index]?.prep?.token} ___</div>
                    <div className="text-xs text-muted-foreground">
                      Correct: {PILL_LABEL[session.questions[session.current_question_index]?.correctPillId] ?? session.questions[session.current_question_index]?.correctPillId}
                    </div>
                  </div>
                  <Button onClick={nextQuestion} className="w-full">
                    <SkipForward size={16} className="mr-2" />
                    {session.current_question_index + 1 >= session.questions.length ? "End → Leaderboard" : "Next Question"}
                  </Button>
                </div>
              )}

              {(session.phase === "results" || session.phase === "ended") && (
                <div className="text-center text-sm font-medium">
                  {session.phase === "results" ? "Showing leaderboard to students" : "Session ended"}
                </div>
              )}

              <Button onClick={resetSession} variant="ghost" size="sm" className="w-full text-muted-foreground">
                <RotateCcw size={14} className="mr-2" /> End / Reset
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
