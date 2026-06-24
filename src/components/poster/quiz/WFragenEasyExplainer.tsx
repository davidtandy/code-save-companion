import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onDone: () => void;
};

const STEPS = 3;

export function WFragenEasyExplainer({ onDone }: Props) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-poster-ink/30 backdrop-blur-sm px-4">
      <div
        data-no-reset
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-poster-ink/10 w-full max-w-sm px-6 py-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-poster-ink/40 uppercase tracking-widest font-semibold">How to play — Easy</div>
          <button onClick={onDone} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">Skip</button>
        </div>

        <div className="text-center">
          <div className="text-lg font-display font-bold text-poster-ink">Turn the sentence into a question</div>
        </div>

        <div className="min-h-[140px] flex flex-col items-center justify-center text-center space-y-3">
          {step === 0 && (
            <>
              <div className="text-base leading-relaxed text-poster-ink">
                <span className="border-2 border-poster-teal/50 bg-poster-teal/5 rounded px-2 py-0.5 font-bold text-poster-teal">Das Kind</span>
                {" "}spielt im Park.
              </div>
              <div className="text-sm text-poster-ink/55">First, spot the part of the sentence you're asking about.</div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="text-base leading-relaxed text-poster-ink">
                <span className="border-2 border-poster-yellow/60 bg-poster-yellow/10 rounded px-2 py-0.5 font-bold text-poster-yellow">Who</span>
                {" "}plays in the park?
              </div>
              <div className="text-sm text-poster-ink/55">Now ask the same thing in English, starting with a question word.</div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="flex items-center justify-center gap-2 text-xl font-display font-bold">
                <span className="text-poster-yellow">who</span>
                <ArrowRight className="h-4 w-4 text-poster-ink/40" />
                <span className="text-poster-teal">wer</span>
              </div>
              <div className="text-sm text-poster-ink/55">
                Translate just the question word — that's the pill to tap on the poster.
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span key={i} className={cn("w-1.5 h-1.5 rounded-full", i === step ? "bg-poster-teal" : "bg-poster-ink/15")} />
            ))}
          </div>
          {step < STEPS - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="h-9 px-4 rounded-lg bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onDone}
              className="h-9 px-4 rounded-lg bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors"
            >
              Got it — let's play!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
