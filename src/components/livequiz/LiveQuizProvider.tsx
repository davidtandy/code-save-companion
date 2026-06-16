// @ts-nocheck
// Polls session by ID + student state via server fns. No realtime, no direct DB access.
import { createContext, useContext, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSessionById, getStudentState } from "@/lib/livequiz.functions";
import type { QuizQuestion } from "@/components/poster/quiz/quizData";

export type SessionPhase = "lobby" | "active" | "results" | "ended";

export type LiveSession = {
  id: string;
  code: string;
  phase: SessionPhase;
  current_question_index: number;
  question_started_at: string | null;
  timer_max_seconds: number;
  questions: QuizQuestion[];
  game_mode: string;
};

export type LeaderboardEntry = { id: string; name: string; avatar: string; points: number };

type Ctx = {
  session: LiveSession | null;
  myResponses: any[];
  leaderboard: LeaderboardEntry[];
  joinedCount: number;
  loading: boolean;
  error: string | null;
};

const LiveQuizContext = createContext<Ctx>({
  session: null, myResponses: [], leaderboard: [], joinedCount: 0, loading: true, error: null,
});

export function useLiveQuiz() { return useContext(LiveQuizContext); }

export function LiveQuizProvider({
  sessionId,
  studentId,
  children,
}: {
  sessionId: string;
  studentId: string;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [joinedCount, setJoinedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionFn = useServerFn(getSessionById);
  const stateFn   = useServerFn(getStudentState);

  // Poll session by ID every 1s
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const s = await sessionFn({ data: { sessionId } });
        if (cancelled) return;
        if (!s) { setError("Session not found"); setLoading(false); return; }
        setSession(s as LiveSession);
        setError(null);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setError(e?.message ?? "Network error"); setLoading(false); }
      }
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [sessionId]);

  // Poll student state every 2s
  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;
    async function tick() {
      try {
        const r = await stateFn({ data: { sessionId: session.id, studentId } });
        if (cancelled) return;
        setMyResponses((r as any).mine ?? []);
        setLeaderboard((r as any).leaderboard ?? []);
        setJoinedCount((r as any).joinedCount ?? 0);
      } catch {}
    }
    tick();
    const iv = setInterval(tick, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [session?.id, studentId]);

  return (
    <LiveQuizContext.Provider value={{ session, myResponses, leaderboard, joinedCount, loading, error }}>
      {children}
    </LiveQuizContext.Provider>
  );
}
