// @ts-nocheck
import { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export type Participant = {
  student_id: string;
  student_name: string;
  student_avatar: string;
};

type Ctx = {
  session: LiveSession | null;
  participants: Participant[];
  responses: any[];
  loading: boolean;
  error: string | null;
};

const LiveQuizContext = createContext<Ctx>({ session: null, participants: [], responses: [], loading: true, error: null });

export function useLiveQuiz() { return useContext(LiveQuizContext); }

export function LiveQuizProvider({ code, children }: { code: string; children: React.ReactNode }) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("quiz_session")
        .select("*")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) { setError(error?.message ?? "Session not found"); setLoading(false); return; }
      setSession(data as any);
      const { data: resp } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("session_id", data.id);
      if (cancelled) return;
      setResponses(resp ?? []);
      setLoading(false);
    }
    load();

    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`live-${session.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "quiz_session", filter: `id=eq.${session.id}` },
        (payload) => setSession((prev) => prev ? { ...prev, ...(payload.new as any) } : prev))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "quiz_responses", filter: `session_id=eq.${session.id}` },
        (payload) => setResponses((prev) => [...prev, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  const participants = useMemo<Participant[]>(() => {
    const map = new Map<string, Participant>();
    for (const r of responses) {
      if (!map.has(r.student_id)) {
        map.set(r.student_id, {
          student_id: r.student_id,
          student_name: r.student_name,
          student_avatar: r.student_avatar,
        });
      }
    }
    return [...map.values()];
  }, [responses]);

  return (
    <LiveQuizContext.Provider value={{ session, participants, responses, loading, error }}>
      {children}
    </LiveQuizContext.Provider>
  );
}
