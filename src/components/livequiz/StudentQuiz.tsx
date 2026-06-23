// @ts-nocheck
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LiveQuizProvider, useLiveQuiz } from "./LiveQuizProvider";
import { LivePillBoard } from "./LivePillBoard";
import { StudentQWQuiz } from "./StudentQWQuiz";
import { StudentWFragenQuiz } from "./StudentWFragenQuiz";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import { useServerFn } from "@tanstack/react-start";
import { submitResponse } from "@/lib/livequiz.functions";

type Props = { identity: StudentIdentity; onLeave: () => void };

export function StudentQuiz({ identity, onLeave }: Props) {
  return (
    <LiveQuizProvider code={identity.session_code} studentId={identity.student_id}>
      <StudentQuizInner identity={identity} onLeave={onLeave} />
    </LiveQuizProvider>
  );
}

function StudentQuizInner({ identity, onLeave }: Props) {
  const { session, myResponses, leaderboard, joinedCount, loading, error } = useLiveQuiz();
  const [submitting, setSubmitting] = useState(false);
  const submitFn = useServerFn(submitResponse);

  if (loading) return <Splash>Loading…</Splash>;

  if (error || !session) return (
    <Splash>
      <div className="text-poster-red mb-6 font-medium">{error ?? "Session not found"}</div>
      <button
        onClick={onLeave}
        className="px-8 py-3 rounded-full bg-poster-teal text-white font-bold text-base"
      >
        Back
      </button>
    </Splash>
  );

  /* ── Lobby waiting ── */
  if (session.phase === "lobby") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-poster-bg">
        <div className="text-center space-y-6">
          <img
            src={avatarSrc(identity.student_avatar)}
            alt=""
            className="w-32 h-32 mx-auto"
            draggable={false}
          />
          <div className="text-3xl font-bold text-poster-ink">{identity.student_name}</div>
          <div className="text-poster-ink/50 text-base">Waiting for the teacher to start…</div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-poster-yellow/25 text-poster-ink text-sm font-semibold">
            {joinedCount} student{joinedCount === 1 ? "" : "s"} joined
          </div>
          <button
            onClick={onLeave}
            className="block mx-auto text-sm text-poster-ink/30 hover:text-poster-ink/60 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  /* ── Results / ended ── */
  if (session.phase === "results" || session.phase === "ended") {
    return (
      <Leaderboard
        leaderboard={leaderboard}
        myId={identity.student_id}
        onLeave={onLeave}
      />
    );
  }

  /* ── Active question ── */
  const idx = session.current_question_index;
  const q = session.questions?.[idx];
  if (!q) return <Splash>Waiting for next question…</Splash>;

  if (session.game_mode === "question-words") {
    return (
      <StudentQWQuiz
        identity={identity}
        session={session}
        myResponses={myResponses}
        submitting={submitting}
        onAnswer={handleAnswer}
      />
    );
  }

  if (session.game_mode === "wfragen") {
    return (
      <StudentWFragenQuiz
        identity={identity}
        session={session}
        myResponses={myResponses}
        submitting={submitting}
        onAnswer={handleAnswer}
      />
    );
  }

  const startedAt = session.question_started_at
    ? new Date(session.question_started_at).getTime()
    : Date.now();
  const timerMaxMs = (session.timer_max_seconds || 30) * 1000;

  const myAnswer = myResponses.find((r) => r.question_index === idx);
  const locked = !!myAnswer;
  const totalPoints = myResponses
    .filter((r) => r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  async function handleAnswer(pillId: string) {
    if (locked || submitting) return;
    setSubmitting(true);
    try {
      await submitFn({
        data: {
          sessionId: session.id,
          studentId: identity.student_id,
          studentName: identity.student_name,
          studentAvatar: identity.student_avatar,
          questionIndex: idx,
          answer: pillId,
        },
      });
    } catch {}
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-poster-bg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/70 border-b border-poster-ink/10 shrink-0">
        <div className="flex items-center gap-2">
          <img src={avatarSrc(identity.student_avatar)} alt="" className="w-8 h-8" draggable={false} />
          <span className="font-semibold text-sm text-poster-ink">{identity.student_name}</span>
        </div>
        <div className="text-xs font-medium text-poster-ink/40">
          {idx + 1} / {session.questions.length}
        </div>
        <div className="px-3 py-1 rounded-full bg-poster-yellow text-white text-sm font-bold tabular-nums">
          {totalPoints} pts
        </div>
      </div>

      {/* Board */}
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
          <div
            className={cn(
              "px-6 py-5 text-center border-t shrink-0 transition-all duration-500",
              myAnswer.is_correct ? "bg-poster-teal/10 border-poster-teal/20" : "bg-poster-red/10 border-poster-red/20",
            )}
          >
            {myAnswer.is_correct ? (
              <div className="text-poster-teal font-bold text-2xl tracking-tight">
                ✓ +{myAnswer.points} pts
              </div>
            ) : (
              <div className="text-poster-red font-bold text-xl">
                ✗ &nbsp;{q.correctPillId}
              </div>
            )}
            <div className="text-xs text-poster-ink/30 mt-2 font-medium">
              Waiting for next question…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Leaderboard ── */
function Leaderboard({
  leaderboard,
  myId,
  onLeave,
}: {
  leaderboard: any[];
  myId: string;
  onLeave: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-poster-bg">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center pt-4">
          <div className="text-4xl font-bold text-poster-ink tracking-tight">Ergebnisse</div>
          <div className="text-poster-ink/40 text-sm mt-1">Final leaderboard</div>
        </div>

        <div className="space-y-3">
          {leaderboard.map((t, i) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-3 transition-all",
                i === 0
                  ? "bg-poster-yellow text-white shadow-md"
                  : t.id === myId
                  ? "bg-poster-teal/15 ring-2 ring-poster-teal/40"
                  : "bg-white/70",
              )}
            >
              <div
                className={cn(
                  "text-lg font-bold w-6 text-center tabular-nums",
                  i === 0 ? "text-white" : "text-poster-ink/30",
                )}
              >
                {i + 1}
              </div>
              <img src={avatarSrc(t.avatar)} alt="" className="w-9 h-9" draggable={false} />
              <div
                className={cn(
                  "flex-1 font-semibold text-base",
                  i === 0 ? "text-white" : "text-poster-ink",
                )}
              >
                {t.name}
              </div>
              <div
                className={cn(
                  "font-bold tabular-nums text-base",
                  i === 0 ? "text-white" : "text-poster-ink",
                )}
              >
                {t.points}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onLeave}
          className="w-full text-center text-sm text-poster-ink/30 hover:text-poster-ink/60 transition-colors py-4"
        >
          Leave
        </button>

      </div>
    </div>
  );
}

/* ── Full-screen centered helper ── */
function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-poster-bg text-poster-ink">
      {children}
    </div>
  );
}
