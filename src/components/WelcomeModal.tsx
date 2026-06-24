import { BookOpen, MousePointer2, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";

const CASES = [
  { label: "Nominativ", sub: "the subject — who's doing it", cls: "bg-poster-yellow" },
  { label: "Akkusativ", sub: "direct object — who/what is affected", cls: "bg-poster-green" },
  { label: "Dativ", sub: "indirect object — to/for whom", cls: "bg-poster-purple" },
] as const;

type Props = {
  onDismiss: () => void;
  onBackdropDismiss?: () => void;
  onTour: () => void;
  isMobile?: boolean;
};

export function WelcomeModal({ onDismiss, onBackdropDismiss, onTour, isMobile = false }: Props) {
  const CursorIcon = isMobile ? Hand : MousePointer2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-poster-ink/30 backdrop-blur-sm px-4"
      onClick={onBackdropDismiss ?? onDismiss}
    >
      <div
        data-no-reset
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-poster-ink/10 w-full max-w-sm px-6 py-6 space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-xl font-display font-bold text-poster-ink">
            German Grammar Cheatsheet
          </div>
          <div className="text-sm text-poster-ink/55 leading-snug">
            An interactive reference for the three German grammatical cases.
            {isMobile ? " Tap" : " Click"} any pill on the chart to explore.
          </div>
        </div>

        {/* Case swatches */}
        <div className="space-y-2">
          {CASES.map(({ label, sub, cls }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-md shrink-0 ${cls}`} />
              <div>
                <div className="text-sm font-semibold text-poster-ink">{label}</div>
                <div className="text-[11px] text-poster-ink/50 leading-tight">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full bg-poster-teal hover:bg-poster-teal/90 text-white"
            onClick={onTour}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Take the guided tour
          </Button>
          <Button variant="ghost" className="w-full text-poster-ink/50 text-sm gap-1.5" onClick={onDismiss}>
            <CursorIcon className="h-3.5 w-3.5" />
            Jump right in
          </Button>
        </div>
      </div>
    </div>
  );
}
