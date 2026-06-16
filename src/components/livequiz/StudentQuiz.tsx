// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LiveQuizProvider, useLiveQuiz } from "./LiveQuizProvider";
import { LivePillBoard } from "./LivePillBoard";
import { avatarSrc, AVATARS } from "./avatars";
import { scoreFor } from "./scoring";
import type { StudentIdentity } from "./StudentLobby";
import { Button } from "@/components/ui/button";

type Props = { identity: StudentIdentity; onLeave: () => void };

export function StudentQuiz({ identity, onLeave }: Props) {
  return (
    <LiveQuizProvider code={identity.session_code}>
      <StudentQuizInner identity={identity} onLeave={onLeave} />
    </LiveQuizProvider>
  );
}

function StudentQuizInner({ identity, onLeave }: Props) {
  const { session, responses, loading, error } = useLiveQuiz();
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Centered>Loading…</Centered>;
  if (error || !session) return <Centered>
    <div className="text-destructive mb-4">{error ?? "Session not found"}</div>
    <Button onClick={onLeave}>Back</Button>
  </Centered>;

  if (session.phase === "lobby") {
    const others = new Set(responses.filter(r => r.question_index === -1).map(r => r.student_id));
    return (
      <Centered>
        <div className="text-center space-y-6">
          <div className="text-2xl font-bold">Waiting for teacher…</div>
          <img src={avatarSrc(identity.student_avatar)} alt="" className="w-24 h-24 mx-auto" />
          <div className="text-lg">{identity.student_name}</div>
          <div className="text-sm text-muted-foreground">{others.size} student{others.size === 1 ? "" : "s"} joined</div>
          <Button variant="ghost" onClick={onLeave}>Leave</Button>
        </div>
      </Centered>
    );
  }

  if (session.phase === "results" || session.phase === "ended") {
    return <Leaderboard responses={responses} myId={identity.student_id} onLeave={onLeave} />;
  }

  // active
  const idx = session.current_question_index;
  const q = session.questions?.[idx];
  if (!q) return <Centered>Waiting for next question…</Centered>;

  const startedAt = session.question_started_at ? new Date(session.question_started_at).getTime() : Date.now();
  const timerMaxMs = (session.timer_max_seconds || 30) * 1000;

  const myAnswer = responses.find(
    (r) => r.student_id === identity.student_id && r.question_index === idx,
  );
  const locked = !!myAnswer;
  const totalPoints = responses
    .filter((r) => r.student_id === identity.student_id && r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  async function handleAnswer(pillId: string) {
    if (locked || submitting) return;
    setSubmitting(true);
    const elapsed = Date.now() - startedAt;
    const correct = pillId === q.correctPillId;
    const points = scoreFor(correct, elapsed, timerMaxMs);
    await supabase.from("quiz_responses").upsert({
      session_id: session.id,
      student_id: identity.student_id,
      student_name: identity.student_name,
      student_avatar: identity.student_avatar,
      question_index: idx,
      answer: pillId,
      is_correct: correct,
      response_ms: elapsed,
      points,
    }, { onConflict: "session_id,student_id,question_index" });
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <img src={avatarSrc(identity.student_avatar)} alt="" className="w-8 h-8" />
          <span className="font-medium text-sm">{identity.student_name}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Question</span> {idx + 1}/{session.questions.length}
        </div>
        <div className="text-sm font-bold tabular-nums">{totalPoints} pts</div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <LivePillBoard
          question={q}
          questionStartedAt={startedAt}
          timerMaxMs={timerMaxMs}
          locked={locked}
          lockedPillId={myAnswer?.answer ?? null}
          onAnswer={handleAnswer}
        />
        {locked && (
          <div className="p-4 text-center border-t">
            {myAnswer.is_correct ? (
              <div className="text-green-600 font-bold text-xl">✓ +{myAnswer.points} pts</div>
            ) : (
              <div className="text-destructive font-bold text-xl">✗ Correct: <span className="underline">{q.correctPillId}</span></div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Waiting for next question…</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ responses, myId, onLeave }: { responses: any[]; myId: string; onLeave: () => void }) {
  const totals = useMemo(() => {
    const m = new Map<string, { id: string; name: string; avatar: string; points: number }>();
    for (const r of responses) {
      if (r.question_index < 0) continue;
      const cur = m.get(r.student_id) ?? { id: r.student_id, name: r.student_name, avatar: r.student_avatar, points: 0 };
      cur.points += r.points || 0;
      m.set(r.student_id, cur);
    }
    return [...m.values()].sort((a, b) => b.points - a.points);
  }, [responses]);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <div className="w-full max-w-md space-y-2">
        {totals.slice(0, 10).map((t, i) => (
          <div key={t.id} className={`flex items-center gap-3 rounded-xl p-3 border-2 ${t.id === myId ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <div className="text-2xl font-bold w-8 text-center">{i + 1}</div>
            <img src={avatarSrc(t.avatar)} alt="" className="w-10 h-10" />
            <div className="flex-1 font-medium">{t.name}</div>
            <div className="font-bold tabular-nums">{t.points}</div>
          </div>
        ))}
      </div>
      <Button onClick={onLeave} variant="ghost" className="mt-8">Leave</Button>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">{children}</div>;
}
