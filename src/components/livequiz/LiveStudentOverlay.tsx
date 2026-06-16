// @ts-nocheck
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLiveQuiz } from "./LiveQuizProvider";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import { pillsForQuestion, eliminationOrder } from "./scoring";
import { useServerFn } from "@tanstack/react-start";
import { submitResponse } from "@/lib/livequiz.functions";

type Props = {
  identity: StudentIdentity;
  onLeave: () => void;
  /** Called with a function when we want to intercept cheatsheet pill taps, null to release. */
  onSetSubmit: (fn: ((pillId: string) => void) | null) => void;
};

export function LiveStudentOverlay({ identity, onLeave, onSetSubmit }: Props) {
  const { session, myResponses, leaderboard, joinedCount, loading } = useLiveQuiz();
  const [submitting, setSubmitting] = useState(false);
  const submitFn = useServerFn(submitResponse);

  const idx = session?.current_question_index ?? 0;
  const q = session?.questions?.[idx];
  const myAnswer = myResponses.find((r) => r.question_index === idx);
  const locked = !!myAnswer;
  const totalPoints = myResponses
    .filter((r) => r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  // Timer countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (session?.phase !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [session?.phase]);

  const startedAt = session?.question_started_at
    ? new Date(session.question_started_at).getTime()
    : Date.now();
  const timerMaxMs = (session?.timer_max_seconds || 30) * 1000;
  const elapsed = Math.max(0, now - startedAt);
  const timeRatio = Math.max(0, Math.min(1, 1 - elapsed / timerMaxMs));

  async function handleAnswer(pillId: string) {
    if (!session || locked || submitting) return;
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

  // Register or release the cheatsheet pill-tap intercept.
  useEffect(() => {
    if (session?.phase === "active" && !locked) {
      onSetSubmit(handleAnswer);
    } else {
      onSetSubmit(null);
    }
    return () => onSetSubmit(null);
  }, [session?.phase, locked, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progressively grey out wrong pills on the cheatsheet as the timer runs down.
  const elimStart = timerMaxMs * 0.3;
  const elimEnd   = timerMaxMs * 0.95;
  const elimProgress = (session?.phase === "active" && !locked)
    ? Math.min(1, Math.max(0, (elapsed - elimStart) / (elimEnd - elimStart)))
    : 0;
  const cappedElimCount = q
    ? Math.min(
        Math.floor(elimProgress * eliminationOrder(q, pillsForQuestion(q)).length),
        Math.max(0, eliminationOrder(q, pillsForQuestion(q)).length - 1),
      )
    : 0;

  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-elim]").forEach((el) => el.removeAttribute("data-quiz-elim"));
    clear();
    if (!q || session?.phase !== "active" || cappedElimCount === 0) return clear;
    const order = eliminationOrder(q, pillsForQuestion(q));
    order.slice(0, cappedElimCount).forEach((pillId) => {
      document.querySelectorAll(`[data-cell-id="${pillId}"]`).forEach((el) =>
        (el as HTMLElement).setAttribute("data-quiz-elim", "1"),
      );
    });
    return clear;
  }, [cappedElimCount, q?.correctPillId, session?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !session) return null;

  /* ── Lobby: full-screen overlay ── */
  if (session.phase === "lobby") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-poster-bg">
        <div className="text-center space-y-6 p-6">
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
            className="block mx-auto text-sm text-poster-ink/30 hover:text-poster-ink/60 transition-colors mt-4"
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  /* ── Results / ended: leaderboard overlay ── */
  if (session.phase === "results" || session.phase === "ended") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center p-6 bg-poster-bg overflow-y-auto">
        <div className="w-full max-w-sm space-y-8 pt-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-poster-ink tracking-tight">Ergebnisse</div>
            <div className="text-poster-ink/40 text-sm mt-1">Final leaderboard</div>
          </div>
          <div className="space-y-3">
            {leaderboard.map((t, i) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3",
                  i === 0
                    ? "bg-poster-yellow text-white shadow-md"
                    : t.id === identity.student_id
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
                <div className={cn("flex-1 font-semibold", i === 0 ? "text-white" : "text-poster-ink")}>
                  {t.name}
                </div>
                <div className={cn("font-bold tabular-nums", i === 0 ? "text-white" : "text-poster-ink")}>
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

  /* ── Active phase: overlays on top of the cheatsheet ── */
  if (session.phase !== "active" || !q) return null;

  const isPronoun = q.kind === "pronoun";
  const prompt = isPronoun
    ? `${q.prefix ?? ""} ${q.prep.token} ___ ${q.suffix ?? ""}`.trim()
    : `${q.prefix ?? ""} ${q.prep.token} ___ ${q.nounDe}${q.suffix ? " " + q.suffix : ""}`.trim();
  const promptEn = isPronoun ? q.targetEn : `${q.nounArticle} ${q.nounEn}`;

  return (
    <>
      {/* Fixed header: timer bar + student info + question prompt */}
      <div className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-poster-ink/10 shadow-sm">
        {/* Timer bar */}
        <div className="h-1 bg-poster-ink/5">
          <div
            className="h-full bg-poster-teal transition-[width] duration-200 ease-linear"
            style={{ width: `${timeRatio * 100}%` }}
          />
        </div>
        {/* Name + progress + score */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img src={avatarSrc(identity.student_avatar)} alt="" className="w-7 h-7" draggable={false} />
            <span className="font-semibold text-sm text-poster-ink">{identity.student_name}</span>
          </div>
          <div className="text-xs font-medium text-poster-ink/40">
            {idx + 1} / {session.questions.length}
          </div>
          <div className="px-3 py-1 rounded-full bg-poster-yellow text-white text-sm font-bold tabular-nums">
            {totalPoints} pts
          </div>
        </div>
        {/* Question prompt — hidden once locked */}
        {!locked && (
          <div className="px-4 pb-3 text-center">
            <div className="text-lg font-bold text-poster-ink leading-tight">{prompt}</div>
            <div className="text-xs text-poster-ink/50 mt-0.5">{promptEn}</div>
            <div className="text-[11px] text-poster-ink/30 mt-1">
              Tap the right pill — tap again to confirm
            </div>
          </div>
        )}
      </div>

      {/* Result banner at the bottom after answering */}
      {locked && (
        <div
          className={cn(
            "fixed bottom-0 inset-x-0 z-50 px-4 py-5 text-center border-t",
            myAnswer.is_correct
              ? "bg-poster-teal/10 border-poster-teal/20"
              : "bg-poster-red/10 border-poster-red/20",
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
          <div className="text-xs text-poster-ink/30 mt-1 font-medium">
            Waiting for next question…
          </div>
        </div>
      )}
    </>
  );
}
