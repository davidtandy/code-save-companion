// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLiveQuiz } from "./LiveQuizProvider";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import { eliminationTiersData, computeElimCount } from "./scoring";
import { useServerFn } from "@tanstack/react-start";
import { submitResponse } from "@/lib/livequiz.functions";

type Props = {
  identity: StudentIdentity;
  onLeave: () => void;
  /** Called with a function when we want to intercept cheatsheet pill taps, null to release. */
  onSetSubmit: (fn: ((pillId: string) => void) | null) => void;
  quizFillMode?: boolean;
};

export function LiveStudentOverlay({ identity, onLeave, onSetSubmit, quizFillMode = false }: Props) {
  const { session, myResponses, leaderboard, joinedCount, loading } = useLiveQuiz();
  const [submitting, setSubmitting] = useState(false);
  const submitFn = useServerFn(submitResponse);

  // Center-screen result popup state
  const [resultPopup, setResultPopup] = useState<{ correct: boolean; points: number; show: boolean } | null>(null);
  const popupShownRef = useRef<string>("");

  const idx = session?.current_question_index ?? 0;
  const q = session?.questions?.[idx];
  const myAnswer = myResponses.find((r) => r.question_index === idx);
  const [optimisticAnswer, setOptimisticAnswer] = useState<string | null>(null);
  const [secondAttemptDone, setSecondAttemptDone] = useState(false);

  // locked = answered correctly, or used both attempts, or mid-submit
  const locked = (!!myAnswer && myAnswer.is_correct) || secondAttemptDone || !!optimisticAnswer;

  // Clear optimistic once real answer arrives from server
  useEffect(() => { if (myAnswer) setOptimisticAnswer(null); }, [myAnswer]);
  // Reset second-attempt flag when question advances
  useEffect(() => { setSecondAttemptDone(false); }, [idx]);
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

  function showPopup(correct: boolean, points: number, key: string) {
    popupShownRef.current = key;
    setResultPopup({ correct, points, show: true });
    setTimeout(() => setResultPopup((p) => p ? { ...p, show: false } : p), 1300);
    setTimeout(() => setResultPopup(null), 1800);
  }

  async function handleAnswer(pillId: string) {
    if (!session || locked || submitting) return;
    const isSecondAttempt = !!myAnswer && !myAnswer.is_correct;
    if (isSecondAttempt) setSecondAttemptDone(true);
    setOptimisticAnswer(pillId);
    setSubmitting(true);
    try {
      const result = await submitFn({
        data: {
          sessionId: session.id,
          studentId: identity.student_id,
          studentName: identity.student_name,
          studentAvatar: identity.student_avatar,
          questionIndex: idx,
          answer: pillId,
        },
      });
      // Show popup immediately from server result — no poll-cycle delay
      showPopup(result.is_correct, result.points || 0, `${idx}:${pillId}`);
    } catch {
      setOptimisticAnswer(null);
      if (isSecondAttempt) setSecondAttemptDone(false);
    }
    setSubmitting(false);
  }

  // Fallback: show popup if myAnswer arrives (e.g. after page reload) and wasn't already shown.
  useEffect(() => {
    if (!myAnswer) return;
    const key = `${idx}:${myAnswer.answer}`;
    if (popupShownRef.current === key) return;
    showPopup(myAnswer.is_correct, myAnswer.points || 0, key);
  }, [myAnswer?.answer, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register or release the cheatsheet pill-tap intercept.
  useEffect(() => {
    if (session?.phase === "active" && !locked) {
      onSetSubmit(handleAnswer);
    } else {
      onSetSubmit(null);
    }
    return () => onSetSubmit(null);
  }, [session?.phase, locked, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progressively grey out wrong pills: groups at t=2s and t=4s, then individual pills from t=6s.
  const tiers = q ? eliminationTiersData(q) : null;
  const cappedElimCount = (session?.phase === "active" && !locked && tiers)
    ? computeElimCount(elapsed, timerMaxMs, tiers.tier0Count, tiers.tier1Count, tiers.tier2Count)
    : 0;

  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-elim]").forEach((el) => el.removeAttribute("data-quiz-elim"));
    clear();
    if (!tiers || session?.phase !== "active" || cappedElimCount === 0) return clear;
    tiers.order.slice(0, cappedElimCount).forEach((pillId) => {
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
  const prompt = q.sentence
    ? q.sentence.replace("_____", "___")
    : isPronoun
    ? `${q.prefix ?? ""} ${q.prep.token} ___ ${q.suffix ?? ""}`.trim()
    : `${q.prefix ?? ""} ${q.prep.token} ___ ${q.nounDe}${q.suffix ? " " + q.suffix : ""}`.trim();
  const promptEn = q.sentenceEn ?? (isPronoun ? q.targetEn : `${q.nounArticle ?? ""} ${q.nounEn ?? ""}`.trim());

  return (
    <>
      {quizFillMode ? (
        <>
          {/* Minimal: just the timer bar at very top */}
          <div className="fixed top-0 inset-x-0 z-50 h-1 bg-poster-ink/5">
            <div
              className="h-full bg-poster-teal transition-[width] duration-200 ease-linear"
              style={{ width: `${timeRatio * 100}%` }}
            />
          </div>
          {/* Floating score chip */}
          <div
            key={totalPoints}
            className="fixed top-2 right-2 z-50 px-3 py-1 rounded-full bg-poster-yellow text-white text-sm font-bold tabular-nums pts-pop shadow-md"
          >
            {totalPoints} pts
          </div>
        </>
      ) : (
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
          {/* key on totalPoints triggers CSS pulse animation when score updates */}
          <div
            key={totalPoints}
            className="px-3 py-1 rounded-full bg-poster-yellow text-white text-sm font-bold tabular-nums pts-pop"
          >
            {totalPoints} pts
          </div>
        </div>
        {/* Question prompt — hidden once fully locked */}
        {!locked && (
          <div className="px-4 pb-3 text-center">
            {myAnswer && !myAnswer.is_correct && (
              <div className="text-xs font-semibold text-poster-red mb-1">Wrong — one try left (−500 pts)</div>
            )}
            <div className="text-lg font-bold text-poster-ink leading-tight">{prompt}</div>
            <div className="text-xs text-poster-ink/50 mt-0.5">{promptEn}</div>
          </div>
        )}
        {/* Waiting indicator replaces prompt once locked */}
        {locked && (
          <div className="px-4 pb-2.5 text-center text-xs text-poster-ink/30 font-medium">
            Waiting for next question…
          </div>
        )}
      </div>
      )}

      {/* Center-screen result popup — appears briefly then fades, never blocks the slider */}
      {resultPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "rounded-3xl px-12 py-8 text-center shadow-2xl",
              "transition-all duration-500",
              resultPopup.show ? "opacity-100 scale-100" : "opacity-0 scale-75",
              resultPopup.correct ? "bg-poster-teal" : "bg-poster-red",
            )}
          >
            <div className="text-6xl font-bold text-white leading-none">
              {resultPopup.correct ? `+${resultPopup.points}` : "✗"}
            </div>
            <div className="text-lg text-white/70 mt-1 font-medium">
              {resultPopup.correct ? "pts" : "incorrect"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
