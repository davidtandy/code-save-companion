// @ts-nocheck
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { PILL_LABEL } from "./scoring";
import type { WFragenQuestion } from "@/components/poster/quiz/quizData";

type Props = {
  q: WFragenQuestion;
  questionIndex: number;
  totalQuestions: number;
  responses: any[];
  showBreakdown: boolean;
  answeredThisQ: number;
  participantCount: number;
};

const W_EN: Record<string, string> = {
  WER: "who", WEN: "whom", WEM: "to whom", WO: "where", WOHIN: "where to",
};

export function TeacherWFragenDisplay({
  q, questionIndex, totalQuestions, responses, showBreakdown, answeredThisQ, participantCount,
}: Props) {
  const isWword = q.step === "wword";
  const isHardArticle = q.level === "hard" && !isWword;
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    if (!isHardArticle) { setHintVisible(false); return; }
    setHintVisible(false);
    const t = setTimeout(() => setHintVisible(true), 15_000);
    return () => clearTimeout(t);
  }, [questionIndex, isHardArticle]);

  const currentResponses = responses.filter((r) => r.question_index === questionIndex);

  const options = isWword
    ? ["WER", "WEN", "WEM", "WO", "WOHIN"]
    : Object.entries(PILL_LABEL)
        .filter(([id]) => id.startsWith(q.caseKey + "-"))
        .map(([id, label]) => ({ id, label }));

  const maxCount = Math.max(
    ...currentResponses.map((r) => {
      const key = r.answer?.toUpperCase();
      return currentResponses.filter((x) => x.answer?.toUpperCase() === key).length;
    }),
    1
  );

  return (
    <>
      <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
        Q{questionIndex + 1} / {totalQuestions}
        {" · "}{answeredThisQ} / {participantCount} answered
        {" · "}<span className={cn(isWword ? "text-poster-teal" : "text-poster-yellow")}>
          {isWword ? "question word" : "article"}
        </span>
      </div>

      {/* Sentence */}
      <div className="text-3xl font-bold text-poster-ink leading-snug tracking-tight drop-shadow-sm flex items-baseline flex-wrap gap-x-1.5 justify-center">
        {q.pre && <span>{q.pre}</span>}
        <span className="inline-flex items-baseline gap-1.5 border-2 border-poster-teal/50 rounded px-2 py-0.5 bg-poster-teal/5 text-2xl">
          {q.boxedPre && <span>{q.boxedPre}</span>}
          {!isWword && showBreakdown && (
            <span className="text-poster-teal font-bold">{q.answer}</span>
          )}
          {!isWword && !showBreakdown && (
            <span className="text-poster-ink/30 border-b-2 border-poster-ink/30 min-w-[2rem] inline-block text-center">
              {q.answer.toLowerCase().startsWith("ein") ? "a/an" : "the"}
            </span>
          )}
          <span>{q.boxedNoun}</span>
        </span>
        {q.post && <span>{q.post}</span>}
      </div>

      {/* W-word indicator (on article step) */}
      {!isWword && (
        <div
          className="text-sm text-poster-ink/50 font-medium transition-opacity duration-1000"
          style={{ opacity: isHardArticle ? (hintVisible ? 1 : 0) : 1 }}
        >
          <span className="font-bold text-poster-teal">{q.correctWWord}?</span>
          {" "}— {W_EN[q.correctWWord]}
        </div>
      )}

      {/* Answer distribution — hidden for hard mode until breakdown */}
      {(q.level !== "hard" || showBreakdown) && <div className="w-full max-w-[170px] flex gap-1.5">
        {isWword
          ? options.map((word) => {
              const count = currentResponses.filter((r) => r.answer?.toUpperCase() === word).length;
              const barPct = Math.round((count / maxCount) * 100);
              const revealed = showBreakdown && word === q.correctWWord;
              const fillColor = revealed ? "rgba(0,180,140,0.45)" : "rgba(0,0,0,0.10)";
              const trackColor = revealed ? "rgba(0,180,140,0.08)" : "rgba(0,0,0,0.04)";
              const textColor = revealed ? "#00b09b" : "rgba(10,10,20,0.50)";
              return (
                <div key={word} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 60, background: trackColor }}>
                    <div
                      className="absolute bottom-0 inset-x-0 rounded-t-lg transition-all duration-700 flex items-start justify-center pt-1"
                      style={{ height: `${barPct}%`, background: fillColor, minHeight: count > 0 ? 20 : 0 }}
                    >
                      {count > 0 && (
                        <span className="text-[11px] font-bold leading-none" style={{ color: textColor }}>{count}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: textColor }}>
                    {word}?
                  </span>
                </div>
              );
            })
          : options.slice(0, 8).map(({ id, label }) => {
              const count = currentResponses.filter((r) => r.answer?.toUpperCase() === id.toUpperCase()).length;
              const barPct = Math.round((count / maxCount) * 100);
              const revealed = showBreakdown && id === q.correctPillId;
              const fillColor = revealed ? "rgba(0,180,140,0.45)" : "rgba(0,0,0,0.10)";
              const trackColor = revealed ? "rgba(0,180,140,0.08)" : "rgba(0,0,0,0.04)";
              const textColor = revealed ? "#00b09b" : "rgba(10,10,20,0.50)";
              return (
                <div key={id} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 60, background: trackColor }}>
                    <div
                      className="absolute bottom-0 inset-x-0 rounded-t-lg transition-all duration-700 flex items-start justify-center pt-1"
                      style={{ height: `${barPct}%`, background: fillColor, minHeight: count > 0 ? 20 : 0 }}
                    >
                      {count > 0 && (
                        <span className="text-[11px] font-bold leading-none" style={{ color: textColor }}>{count}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: textColor }}>
                    {label}
                  </span>
                </div>
              );
            })
        }
      </div>}
    </>
  );
}
