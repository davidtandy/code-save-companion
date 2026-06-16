// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { qrSvgDataUrl } from "./qr";
import { avatarSrc } from "./avatars";
import { sampleQuestions, PILL_LABEL } from "./scoring";
import { Play, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

function makeCode(): string {
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += ch[Math.floor(Math.random() * ch.length)];
  return s;
}

type Session = {
  id: string;
  code: string;
  phase: "lobby" | "active" | "results" | "ended";
  current_question_index: number;
  question_started_at: string | null;
  timer_max_seconds: number;
  questions: any[];
};

const STORAGE_KEY = "livequiz_teacher_session";

export function TeacherPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Map<string, { name: string; avatar: string }>>(new Map());
  const [responses, setResponses] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { id, code } = JSON.parse(raw);
      supabase.from("quiz_session").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data && data.code === code) setSession(data as any);
      });
    } catch {}
  }, []);

  // Subscribe to updates for the current session
  useEffect(() => {
    if (!session?.id) return;
    supabase.from("quiz_responses").select("*").eq("session_id", session.id).then(({ data }) => setResponses(data ?? []));

    const channel = supabase
      .channel(`teacher-${session.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "quiz_session", filter: `id=eq.${session.id}` },
        (p) => setSession((prev) => prev ? { ...prev, ...(p.new as any) } : prev))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "quiz_responses", filter: `session_id=eq.${session.id}` },
        (p) => setResponses((prev) => [...prev, p.new]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // Derive participants from responses
  useEffect(() => {
    const m = new Map<string, { name: string; avatar: string }>();
    for (const r of responses) {
      if (!m.has(r.student_id)) m.set(r.student_id, { name: r.student_name, avatar: r.student_avatar });
    }
    setParticipants(m);
  }, [responses]);

  async function createSession() {
    setCreating(true);
    for (let tries = 0; tries < 5; tries++) {
      const code = makeCode();
      const questions = sampleQuestions(10);
      const { data, error } = await supabase.from("quiz_session").insert({
        code,
        game_mode: "prep-lock",
        phase: "lobby",
        current_question_index: 0,
        timer_max_seconds: 30,
        questions,
      }).select().single();
      if (!error && data) {
        setSession(data as any);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: data.id, code: data.code })); } catch {}
        setCreating(false);
        return;
      }
    }
    setCreating(false);
  }

  async function startQuiz() {
    if (!session) return;
    await supabase.from("quiz_session").update({
      phase: "active",
      current_question_index: 0,
      question_started_at: new Date().toISOString(),
    }).eq("id", session.id);
  }

  async function nextQuestion() {
    if (!session) return;
    const next = session.current_question_index + 1;
    if (next >= session.questions.length) {
      await supabase.from("quiz_session").update({ phase: "results" }).eq("id", session.id);
    } else {
      await supabase.from("quiz_session").update({
        current_question_index: next,
        question_started_at: new Date().toISOString(),
      }).eq("id", session.id);
    }
  }

  async function resetSession() {
    if (!session) return;
    if (!confirm("End this session and start a new one?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    await supabase.from("quiz_session").update({ phase: "ended" }).eq("id", session.id);
    setSession(null);
    setResponses([]);
  }

  const joinUrl = useMemo(() => {
    if (!session) return "";
    const origin = window.location.origin;
    return `${origin}/?livequiz&code=${session.code}`;
  }, [session]);

  const qrDataUrl = useMemo(() => session ? qrSvgDataUrl(joinUrl, 240) : "", [joinUrl, session]);

  // Per-question answered count
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
