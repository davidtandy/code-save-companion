// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { avatarSrc } from "./avatars";
import { sampleQuestions, PILL_LABEL, eliminationTiersData, computeElimCount } from "./scoring";
import { Play, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

const FAKE_STUDENTS = [
  { id: "p1", name: "Emma",   avatar: "frank" },
  { id: "p2", name: "Luca",   avatar: "mimi"  },
  { id: "p3", name: "Sophie", avatar: "zapp"  },
  { id: "p4", name: "Max",    avatar: "torq"  },
];

const TIMER_MAX_MS = 30_000;

function buildPreviewSentence(q: any): { deBefore: string; hint: string; deAfter: string; en: string } {
  if (q.sentence) {
    const [deBefore, deAfter] = q.sentence.split("_____");
    return { deBefore: deBefore ?? "", hint: "?", deAfter: deAfter ?? "", en: q.sentenceEn ?? "" };
  }
  return { deBefore: `… ${q.prep?.token ?? ""} `, hint: "?", deAfter: ` ${q.nounDe ?? "…"}.`, en: "" };
}

function makeFakeResponses(q: any, startedAt: number, questionIndex: number) {
  return FAKE_STUDENTS.map((s, i) => {
    // Rotate who gets it wrong each round so rankings shift
    const isCorrect = i !== (questionIndex % FAKE_STUDENTS.length);
    const elapsed = 3000 + i * 2000 + (questionIndex % 3) * 500;
    const ratio = Math.max(0, 1 - elapsed / TIMER_MAX_MS);
    const points = isCorrect ? Math.round(500 + 500 * ratio) : 0;
    return {
      student_id: s.id,
      student_name: s.name,
      student_avatar: s.avatar,
      question_index: questionIndex,
      answer: isCorrect ? q.correctPillId : "nom-der",
      is_correct: isCorrect,
      response_ms: elapsed,
      points,
    };
  });
}

export function TeacherPreviewPanel() {
  const [phase, setPhase] = useState<"idle" | "lobby" | "active" | "results">("idle");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [prevRankOrder, setPrevRankOrder] = useState<string[]>([]);
  const [pillAvatars, setPillAvatars] = useState<{ key: string; x: number; y: number; avatarKey: string; delayMs: number }[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [phase]);

  const activeQ = phase === "active" ? questions[currentIdx] ?? null : null;
  const elapsed = Math.max(0, now - questionStartedAt);
  const timeRatio = Math.max(0, Math.min(1, 1 - elapsed / TIMER_MAX_MS));
  const timerExpired = timeRatio <= 0;

  const tiers = activeQ ? eliminationTiersData(activeQ) : null;
  const cappedElimCount = (phase === "active" && tiers)
    ? computeElimCount(elapsed, TIMER_MAX_MS, tiers.tier0Count, tiers.tier1Count, tiers.tier2Count, tiers.tier3Count, tiers.tier4Count)
    : 0;

  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-elim]").forEach((el) => el.removeAttribute("data-quiz-elim"));
    clear();
    if (!tiers || phase !== "active" || cappedElimCount === 0) return clear;
    tiers.order.slice(0, cappedElimCount).forEach((pillId) => {
      document.querySelectorAll(`[data-cell-id="${pillId}"]`).forEach((el) =>
        (el as HTMLElement).setAttribute("data-quiz-elim", "1"),
      );
    });
    return clear;
  }, [cappedElimCount, activeQ?.correctPillId, phase]);

  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-correct]").forEach((el) => el.removeAttribute("data-quiz-correct"));
    clear();
    if (!showBreakdown || !activeQ) return clear;
    document.querySelectorAll(`[data-cell-id="${activeQ.correctPillId}"]`).forEach((el) =>
      (el as HTMLElement).setAttribute("data-quiz-correct", "1"),
    );
    return clear;
  }, [showBreakdown, activeQ?.correctPillId]);

  // Auto-trigger breakdown when timer expires
  useEffect(() => {
    if (!timerExpired || phase !== "active" || showBreakdown) return;
    setShowBreakdown(true);
  }, [timerExpired, phase, currentIdx]);

  // Reset breakdown when question advances
  useEffect(() => {
    setShowBreakdown(false);
    setStatsExpanded(false);
  }, [currentIdx]);

  // Expand stats panel 2.5s after breakdown
  useEffect(() => {
    if (!showBreakdown) { setStatsExpanded(false); return; }
    const t = setTimeout(() => setStatsExpanded(true), 2500);
    return () => clearTimeout(t);
  }, [showBreakdown, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scatter avatars onto their chosen pills after breakdown
  useEffect(() => {
    if (!showBreakdown) { setPillAvatars([]); return; }
    const t = setTimeout(() => {
      const byPill = new Map<string, string[]>();
      for (const r of responses) {
        if (!byPill.has(r.answer)) byPill.set(r.answer, []);
        byPill.get(r.answer)!.push(r.student_avatar);
      }
      const avatars: typeof pillAvatars = [];
      let gi = 0;
      for (const [pillId, keys] of byPill) {
        const el = document.querySelector(`[data-cell-id="${pillId}"]`);
        if (!el) { gi += keys.length; continue; }
        const rect = el.getBoundingClientRect();
        const spacing = 22;
        const totalW = (keys.length - 1) * spacing;
        const cx = rect.left + rect.width / 2 - totalW / 2 - 12;
        const cy = rect.top + rect.height / 2 - 12;
        keys.forEach((avatarKey, i) => {
          avatars.push({ key: `${pillId}-${i}`, x: cx + i * spacing, y: cy, avatarKey, delayMs: gi * 55 });
          gi++;
        });
      }
      setPillAvatars(avatars);
    }, 400);
    return () => clearTimeout(t);
  }, [showBreakdown, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  function startQuiz() {
    const qs = sampleQuestions(20);
    const now = Date.now();
    setQuestions(qs);
    setCurrentIdx(0);
    setQuestionStartedAt(now);
    setNow(now);
    setResponses(makeFakeResponses(qs[0], now, 0));
    setShowBreakdown(false);
    setPhase("active");
  }

  function nextQuestion() {
    const next = currentIdx + 1;
    setPrevRankOrder(sessionLeaderboard.map((t) => t.id));
    if (next >= questions.length) {
      setPhase("results");
    } else {
      const now = Date.now();
      setCurrentIdx(next);
      setQuestionStartedAt(now);
      setNow(now);
      setResponses((prev) => [...prev, ...makeFakeResponses(questions[next], now, next)]);
    }
  }

  function reset() {
    setPhase("lobby");
    setQuestions([]);
    setCurrentIdx(0);
    setResponses([]);
    setShowBreakdown(false);
  }

  const sessionLeaderboard = useMemo(() => {
    const totals = new Map<string, { id: string; name: string; avatar: string; points: number }>();
    for (const r of responses) {
      const cur = totals.get(r.student_id) ?? { id: r.student_id, name: r.student_name, avatar: r.student_avatar, points: 0 };
      cur.points += r.points || 0;
      totals.set(r.student_id, cur);
    }
    return [...totals.values()].sort((a, b) => b.points - a.points);
  }, [responses]);

  const answeredThisQ = responses.filter((r) => r.question_index === currentIdx).length;
  const sentence = activeQ ? buildPreviewSentence(activeQ) : null;
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/?livequiz` : "";

  return (
    <>
      {/* ── QR — fixed top-left ── */}
      <div className="fixed top-4 left-4 z-[150] flex flex-col items-start gap-1.5 transition-transform duration-200 origin-top-left hover:scale-[2]">
        <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold">
          Scan to join!
        </div>
        <div className="bg-white rounded-xl p-2 shadow-lg border border-poster-ink/10">
          <QRCode value={joinUrl || "preview"} size={96} level="M" />
        </div>
      </div>

      {/* ── Left panel ── */}
      <div className="fixed left-0 top-[52px] bottom-0 w-[460px] flex flex-col p-4 gap-3 pointer-events-none"
          style={{ zIndex: statsExpanded ? 200 : 50 }}>

        {/* Question sentence */}
        <div
          className="flex flex-col items-center justify-center text-center space-y-4 px-2 overflow-hidden"
          style={{
            flexGrow: statsExpanded ? 0 : 1,
            opacity: statsExpanded ? 0 : 1,
            maxHeight: statsExpanded ? 0 : undefined,
            transition: "flex-grow 0.5s ease-in-out, opacity 0.35s ease-in-out, max-height 0.5s ease-in-out",
          }}
        >
          {activeQ && sentence && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
                Q{currentIdx + 1} / {questions.length}
                {" · "}{answeredThisQ} / {FAKE_STUDENTS.length} answered
              </div>
              <div className="text-5xl font-bold text-poster-ink leading-snug tracking-tight drop-shadow-sm">
                {sentence.deBefore && <span>{sentence.deBefore}</span>}
                {showBreakdown ? (
                  <span key="filled" className="answer-fill text-poster-teal px-2">
                    {PILL_LABEL[activeQ.correctPillId] ?? activeQ.correctPillId}
                  </span>
                ) : (
                  <span key="blank" className="text-poster-ink/35 italic px-2 inline-block min-w-[64px] text-center" style={{ borderBottom: "3px solid black" }}>
                    {sentence.hint || "\xa0"}
                  </span>
                )}
                {sentence.deAfter && <span>{sentence.deAfter.trimStart()}</span>}
              </div>
              {sentence.en && (
                <div className="text-2xl text-poster-ink/60 font-medium drop-shadow-sm italic">
                  {sentence.en}
                </div>
              )}
            </>
          )}
          {phase === "results" && (
            <div className="text-3xl font-bold text-poster-ink">Quiz complete!</div>
          )}
        </div>

        {/* Controls */}
        <div
          className="pointer-events-auto bg-poster-bg/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-poster-ink/10 flex flex-col"
          style={{ flexGrow: statsExpanded ? 1 : 0, transition: "flex-grow 0.5s ease-in-out" }}
        >
          {/* Header */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-between px-4 py-3 bg-poster-teal text-white"
          >
            <span className="font-bold text-sm tracking-tight">Live Quiz · Preview</span>
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {!collapsed && (
            <div className={cn("p-4 space-y-3 overflow-y-auto", statsExpanded ? "flex-1" : "max-h-[40vh]")}>
              {phase === "idle" ? (
                <button
                  onClick={() => setPhase("lobby")}
                  className="w-full py-3 rounded-full bg-poster-teal text-white font-bold text-base hover:bg-poster-teal/90 transition-colors"
                >
                  Open Lobby
                </button>
              ) : showBreakdown && phase === "active" ? (
                <>
                  {/* Per-student answers */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold">Answers</div>
                    {FAKE_STUDENTS.map((s) => {
                      const r = responses.find((r) => r.student_id === s.id && r.question_index === currentIdx);
                      return (
                        <div key={s.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/60">
                          <img src={avatarSrc(s.avatar)} alt="" className="w-6 h-6" draggable={false} />
                          <span className="flex-1 text-sm font-semibold text-poster-ink truncate">{s.name}</span>
                          {r ? (
                            <>
                              <span className="text-xs font-bold text-poster-ink/40">{PILL_LABEL[r.answer] ?? r.answer}</span>
                              <span className={cn("text-sm font-bold w-5 text-center", r.is_correct ? "text-poster-teal" : "text-poster-red")}>
                                {r.is_correct ? "✓" : "✗"}
                              </span>
                              {r.points > 0 && <span className="text-xs font-bold text-poster-yellow tabular-nums">+{r.points}</span>}
                            </>
                          ) : (
                            <span className="text-xs text-poster-ink/25 italic">no answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Rankings */}
                  {sessionLeaderboard.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold">Rankings</div>
                      {sessionLeaderboard.slice(0, 5).map((t, i) => {
                        const prevRank = prevRankOrder.indexOf(t.id);
                        const change = prevRank === -1 ? 0 : prevRank - i;
                        return (
                          <div key={t.id} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5", i === 0 ? "bg-poster-yellow" : "bg-white/60")}>
                            <span className={cn("text-xs font-bold w-4 text-center", i === 0 ? "text-white" : "text-poster-ink/30")}>{i + 1}</span>
                            <img src={avatarSrc(t.avatar)} alt="" className="w-5 h-5" draggable={false} />
                            <span className={cn("flex-1 text-sm font-semibold", i === 0 ? "text-white" : "text-poster-ink")}>{t.name}</span>
                            {statsExpanded && change !== 0 && (
                              <span className={cn("rank-change text-xs font-bold tabular-nums", change > 0 ? "text-poster-teal" : "text-poster-red")}>
                                {change > 0 ? `+${change}` : change}
                              </span>
                            )}
                            <span className={cn("text-sm font-bold tabular-nums", i === 0 ? "text-white" : "text-poster-ink")}>{t.points}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Next */}
                  <button
                    onClick={() => { nextQuestion(); setShowBreakdown(false); }}
                    className="w-full py-3 rounded-full bg-poster-teal text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-teal/90 transition-colors"
                  >
                    <SkipForward size={16} />
                    {currentIdx + 1 >= questions.length ? "End → Results" : "Next Question →"}
                  </button>
                  <button
                    onClick={reset}
                    className="w-full py-2 text-xs text-poster-ink/30 hover:text-poster-ink/60 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </>
              ) : (
                <>
                  {/* Lobby / active normal view */}
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold mb-2">
                      Fake students ({FAKE_STUDENTS.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FAKE_STUDENTS.map((s) => (
                        <div key={s.id} className="flex items-center gap-1 bg-poster-yellow/20 rounded-full px-2 py-1 text-xs font-medium text-poster-ink">
                          <img src={avatarSrc(s.avatar)} alt="" className="w-4 h-4" />
                          <span>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {phase === "lobby" && (
                    <button
                      onClick={startQuiz}
                      className="w-full py-3 rounded-full bg-poster-teal text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-teal/90 transition-colors"
                    >
                      <Play size={16} /> Start Preview
                    </button>
                  )}

                  {phase === "active" && (
                    <div className="space-y-2">
                      <div className="text-xs text-poster-ink/40 text-center">
                        {answeredThisQ} / {FAKE_STUDENTS.length} answered
                      </div>
                      <button
                        onClick={() => setShowBreakdown(true)}
                        className="w-full py-3 rounded-full bg-poster-yellow text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-yellow/90 transition-colors"
                      >
                        <SkipForward size={16} />
                        {currentIdx + 1 >= questions.length ? "End → Results" : "Next →"}
                      </button>
                    </div>
                  )}

                  {phase === "results" && (
                    <div className="text-center text-sm font-semibold text-poster-ink/60 py-1">
                      Preview complete
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-2 text-xs text-poster-ink/30 hover:text-poster-ink/60 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {pillAvatars.map(({ key, x, y, avatarKey, delayMs }) => (
        <div
          key={key}
          className="fixed z-[300] pointer-events-none avatar-scatter"
          style={{ left: x, top: y, animationDelay: `${delayMs}ms` }}
        >
          <img src={avatarSrc(avatarKey)} alt="" className="w-6 h-6 rounded-full shadow-lg ring-2 ring-white" draggable={false} />
        </div>
      ))}

      {/* Timer bar */}
      {phase === "active" && (
        <div className="fixed top-0 inset-x-0 z-40 h-1 bg-poster-ink/5 pointer-events-none">
          <div
            className="h-full bg-poster-teal transition-[width] duration-200 ease-linear"
            style={{ width: `${timeRatio * 100}%` }}
          />
        </div>
      )}
    </>
  );
}
