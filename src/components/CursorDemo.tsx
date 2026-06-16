import { useEffect, useRef, useState } from "react";
import { MousePointer2, Hand } from "lucide-react";

type Props = {
  isMobile: boolean;
  onDone: () => void;
  onReset: () => void;
};

const DESKTOP_PILLS = ["nom-der", "akk-mich"];
const MOBILE_PILLS  = ["nom-der", "nom-ich"];

const PILL_START  = 700;
const PILL_CYCLE  = 2600;
const EXIT_DONE   = 2700;

export function CursorDemo({ isMobile, onDone, onReset }: Props) {
  const CursorIcon = isMobile ? Hand : MousePointer2;
  const pills = isMobile ? MOBILE_PILLS : DESKTOP_PILLS;
  const totalMs = PILL_START + pills.length * PILL_CYCLE + EXIT_DONE;

  const [pos, setPos]               = useState({ x: window.innerWidth / 2, y: window.innerHeight + 90 });
  const [visible, setVisible]       = useState(false);
  const [pressing, setPressing]     = useState(false);
  const [rippleKey, setRippleKey]   = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [rippleNeutral, setRippleNeutral] = useState(false);

  const onDoneRef  = useRef(onDone);  onDoneRef.current  = onDone;
  const onResetRef = useRef(onReset); onResetRef.current = onReset;

  function getPillCenter(id: string) {
    const el = document.querySelector(`[data-cell-id="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function doClick(id: string) {
    setPressing(true);
    setShowRipple(false);
    setRippleNeutral(false);
    setTimeout(() => {
      setRippleKey((k) => k + 1);
      setShowRipple(true);
      (document.querySelector(`[data-cell-id="${id}"]`) as HTMLElement | null)?.click();
    }, 160);
    setTimeout(() => { setPressing(false); setShowRipple(false); }, 520);
  }

  function doBackgroundClick() {
    setPressing(true);
    setShowRipple(false);
    setRippleNeutral(true);
    setTimeout(() => {
      setRippleKey((k) => k + 1);
      setShowRipple(true);
      onResetRef.current();
    }, 160);
    setTimeout(() => { setPressing(false); setShowRipple(false); }, 520);
  }

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

    t(120, () => setVisible(true));

    let offset = PILL_START;
    for (const id of pills) {
      t(offset,       () => { const p = getPillCenter(id); if (p) setPos(p); });
      t(offset + 950, () => doClick(id));
      offset += PILL_CYCLE;
    }

    const bgX = window.innerWidth  * 0.06;
    const bgY = window.innerHeight * 0.18;
    t(offset + 100, () => setPos({ x: bgX, y: bgY }));
    t(offset + 950, () => doBackgroundClick());

    t(offset + 1800, () => setPos({ x: window.innerWidth / 2, y: window.innerHeight + 90 }));
    t(offset + EXIT_DONE, () => onDoneRef.current());

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Progress bar + skip */}
      <div className="fixed top-0 left-0 right-0 z-[51] flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-poster-ink/10">
        <div className="flex-1 h-3 bg-poster-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-poster-teal rounded-full origin-left"
            style={{ animation: `demo-progress ${totalMs - 500}ms linear forwards` }}
          />
        </div>
        <button
          onClick={() => onDoneRef.current()}
          className="text-base text-poster-ink/45 hover:text-poster-ink/70 transition-colors shrink-0 font-semibold"
        >
          Skip
        </button>
      </div>

      {/* Cursor */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: 0,
          left: 0,
          transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
          opacity: visible ? 1 : 0,
          transition: "transform 0.95s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
        }}
      >
        {showRipple && (
          <span
            key={rippleKey}
            className={`absolute inset-0 rounded-full cursor-demo-ripple ${rippleNeutral ? "bg-poster-ink/15" : "bg-poster-teal/25"}`}
            style={{ margin: "-6px" }}
          />
        )}
        <div
          className="bg-white rounded-full shadow-2xl border border-poster-ink/10 p-2.5"
          style={{
            transform: `scale(${pressing ? 0.68 : 1})`,
            transition: "transform 0.14s ease",
          }}
        >
          <CursorIcon className="h-6 w-6 text-poster-teal" />
        </div>
      </div>
    </>
  );
}
