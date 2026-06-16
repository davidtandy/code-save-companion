import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { WORDS, type CaseKey } from "./wordData";
import type { MorphEntry } from "./morph";
import bicycle from "@/assets/poster/bicycle.svg";
import seinCloud from "@/assets/poster/chef-hat.svg";
import envelope from "@/assets/poster/envelope.svg";

type Color = "green" | "yellow" | "purple" | "red";

/* ─── CarouselPill ─────────────────────────────────────────────────────── */

type PillProps = {
  id: string;
  color: Color;
  activeWordId: string | null;
  onTap: (id: string) => void;
  morphMap: Map<string, MorphEntry> | null;
  quizActive: boolean;
  className?: string;
  children?: React.ReactNode;
};

const PILL_BASE =
  "h-9 rounded-sm flex items-center justify-center text-white font-slab font-medium text-sm shadow-sm select-none transition-transform active:scale-95 gap-1";

const pillBg = (color: Color) =>
  color === "green" ? "bg-poster-green"
  : color === "yellow" ? "bg-poster-yellow"
  : color === "purple" ? "bg-poster-purple"
  : "bg-poster-red-deep";

const CarouselPill = ({
  id, color, activeWordId, onTap, morphMap, quizActive, className, children,
}: PillProps) => {
  const word = WORDS[id];
  const morph = morphMap?.get(id) ?? null;
  const subs = word?.subWords;
  const isActive = activeWordId === id;
  const hasActiveSub = activeWordId?.startsWith(`${id}::`) ?? false;
  const effectiveBg = pillBg((morph?.color ?? color) as Color);

  if (quizActive && subs && !morph) {
    return (
      <div className={cn("flex gap-1 items-stretch", className)}>
        {subs.map((sw, i) => {
          const subId = `${id}::${i}`;
          return (
            <button key={subId} data-cell-id={subId}
              data-formal={sw.gender === "formal" ? "" : undefined}
              onClick={(e) => { e.stopPropagation(); onTap(subId); }}
              className={cn(PILL_BASE, "flex-1 min-w-0", effectiveBg, activeWordId === subId && "ring-2 ring-poster-ink/50")}
            >{sw.token}</button>
          );
        })}
      </div>
    );
  }

  let content: React.ReactNode;
  if (morph) {
    content = morph.parts.map((p, i) => {
      const sw = subs?.[i];
      const subId = subs ? `${id}::${i}` : null;
      const inner = <>{p.stem}<span className="font-bold">{p.ending}</span></>;
      return (
        <span key={i}>
          {i > 0 && <span aria-hidden className="opacity-70 mx-1">•</span>}
          {subId ? (
            <span data-cell-id={subId} data-formal={sw?.gender === "formal" ? "" : undefined}
              role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onTap(subId); }}
              className={cn("sub-tok", activeWordId === subId && "sub-tok-active")}
            >{inner}</span>
          ) : inner}
        </span>
      );
    });
  } else if (children) {
    content = children;
  } else if (subs) {
    content = subs.map((sw, i) => {
      const subId = `${id}::${i}`;
      return (
        <span key={subId} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden className="opacity-70">•</span>}
          <span data-cell-id={subId} data-formal={sw.gender === "formal" ? "" : undefined}
            role="button" tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onTap(subId); }}
            className={cn("sub-tok", activeWordId === subId && "sub-tok-active")}
          >{sw.token}</span>
        </span>
      );
    });
  } else {
    content = word?.display;
  }

  return (
    <button data-cell-id={id}
      onClick={(e) => { e.stopPropagation(); onTap(id); }}
      className={cn(PILL_BASE, effectiveBg, (isActive || hasActiveSub) && "ring-2 ring-poster-ink/50", className)}
    >{content}</button>
  );
};

/* ─── CarouselPrepWord ─────────────────────────────────────────────────── */

const CarouselPrepWord = ({ id, active, onTap, tiny }: {
  id: string; active: boolean; onTap: (id: string) => void; tiny?: boolean;
}) => (
  <button data-cell-id={id}
    onClick={(e) => { e.stopPropagation(); onTap(id); }}
    className={cn("block w-full text-center font-slab text-white leading-tight",
      tiny ? "text-[10px]" : "text-[13px]",
      active && "underline underline-offset-2",
    )}
  >{WORDS[id]?.display}</button>
);

/* ─── SectionLabel ─────────────────────────────────────────────────────── */

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-wide font-display font-semibold text-poster-ink/50 mb-1.5">
    {children}
  </div>
);

/* ─── PossessivesColumn ────────────────────────────────────────────────── */

const POSS_IDS = ["pos-mein","pos-dein","pos-sein","pos-unser","pos-euer","pos-ihr"] as const;

type PossColProps = Pick<PillProps, "activeWordId" | "onTap" | "morphMap" | "quizActive">;

const PossessivesColumn = ({ activeWordId, onTap, morphMap, quizActive }: PossColProps) => {
  const p: Omit<PillProps, "id"> = { color: "red", activeWordId, onTap, morphMap, quizActive };
  return (
    <div data-group="g-pos" data-quiz-hide className="w-[42%] flex flex-col gap-1.5">
      {POSS_IDS.map(k => (
        <CarouselPill key={k} {...p} id={k}
          className="w-full text-xs font-display font-semibold" />
      ))}
      <div className="pt-1 border-t border-poster-ink/10">
        <CarouselPill {...p} id="pos-kein"
          className="w-full text-xs font-display font-semibold ring-1 ring-poster-ink/20" />
      </div>
    </div>
  );
};

/* ─── Page helpers ─────────────────────────────────────────────────────── */

type PageProps = {
  activeWordId: string | null;
  onTap: (id: string) => void;
  onTapCase: (c: CaseKey) => void;
  onTapBackground: () => void;
  morphMap: Map<string, MorphEntry> | null;
  quizActive: boolean;
};

const pageClick = (onTapBackground: () => void) => (e: React.MouseEvent) => {
  const t = e.target as HTMLElement;
  if (!t.closest("button, [role='button'], a")) onTapBackground();
};

/* ─── AkkPage ──────────────────────────────────────────────────────────── */

const AKK_PRONS = ["akk-mich","akk-dich","akk-ihn","akk-uns","akk-euch","akk-sieSie"] as const;
const AKK_PREPS = ["akk-prep-für","akk-prep-gegen","akk-prep-um","akk-prep-bis","akk-prep-ohne","akk-prep-durch"] as const;
const TWL = ["twL-in","twL-auf","twL-an","twL-unter","twL-neben","twL-hinter","twL-über","twL-vor","twL-zwischen","twL-unter2"] as const;

const AkkPage = ({ activeWordId, onTap, onTapCase, onTapBackground, morphMap, quizActive }: PageProps) => {
  const p: Omit<PillProps, "id"> = { color: "green", activeWordId, onTap, morphMap, quizActive };
  const posProps: PossColProps = { activeWordId, onTap, morphMap, quizActive };
  return (
    <div className="h-full overflow-y-auto" onClick={pageClick(onTapBackground)}>
      <div className="px-5 py-3 space-y-3 pb-8">

        <button onClick={(e) => { e.stopPropagation(); onTapCase("akk"); }}
          className="w-full flex items-center gap-3 active:scale-95 transition-transform">
          <img src={bicycle} className="h-12 object-contain shrink-0" draggable={false} />
          <div className="text-left min-w-0">
            <div className="font-display font-bold text-lg text-poster-green leading-tight">Akkusativ</div>
            <div className="text-[11px] text-poster-ink/60">WEN • WOHIN — direct object</div>
          </div>
        </button>

        <div>
          <SectionLabel>Prepositions (always Akk)</SectionLabel>
          <div data-group="g-akk-prep" className="bg-poster-green rounded-sm py-2 px-3 grid grid-cols-3 gap-y-1.5 gap-x-1">
            {AKK_PREPS.map(k => <CarouselPrepWord key={k} id={k} active={activeWordId === k} onTap={onTap} />)}
          </div>
        </div>

        <div>
          <SectionLabel>Pronouns &amp; possessives</SectionLabel>
          <div className="flex gap-2">
            <div data-group="g-akk-pron" className="flex-1 flex flex-col gap-1.5">
              {AKK_PRONS.map(k => <CarouselPill key={k} {...p} id={k} className="w-full" />)}
            </div>
            <PossessivesColumn {...posProps} />
          </div>
        </div>

        <div>
          <SectionLabel>Articles</SectionLabel>
          <div data-group="g-akk-art" className="grid grid-cols-2 gap-1.5">
            <CarouselPill {...p} id="akk-einen">ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">en</span></CarouselPill>
            <CarouselPill {...p} id="akk-den" />
            <CarouselPill {...p} id="akk-eine">ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">e</span></CarouselPill>
            <CarouselPill {...p} id="akk-die" />
            <CarouselPill {...p} id="akk-ein" />
            <CarouselPill {...p} id="akk-das" />
            <CarouselPill {...p} id="akk-none" />
            <CarouselPill {...p} id="akk-diePl">di<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">e</span></CarouselPill>
          </div>
        </div>

        <div>
          <SectionLabel>Two-way preps (Akk = movement)</SectionLabel>
          <div data-group="g-twL" className="bg-poster-green rounded-sm py-2 px-3 grid grid-cols-5 gap-y-1 gap-x-1 border-2 border-dashed border-white">
            {TWL.map(k => <CarouselPrepWord key={k} id={k} active={activeWordId === k} onTap={onTap} tiny />)}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─── NomPage ──────────────────────────────────────────────────────────── */

const NOM_ROWS: [string, string][] = [
  ["nom-ich","nom-end-e"],["nom-du","nom-end-st"],["nom-er","nom-end-t"],
  ["nom-wir","nom-end-en"],["nom-ihr","nom-end-t2"],["nom-sieSie","nom-end-en2"],
];

const NomPage = ({ activeWordId, onTap, onTapCase, onTapBackground, morphMap, quizActive }: PageProps) => {
  const p: Omit<PillProps, "id"> = { color: "yellow", activeWordId, onTap, morphMap, quizActive };
  const posProps: PossColProps = { activeWordId, onTap, morphMap, quizActive };
  return (
    <div className="h-full overflow-y-auto" onClick={pageClick(onTapBackground)}>
      <div className="px-5 py-3 space-y-3 pb-8">

        <button onClick={(e) => { e.stopPropagation(); onTapCase("nom"); }}
          className="w-full flex items-center gap-3 active:scale-95 transition-transform">
          <img src={seinCloud} className="h-12 object-contain shrink-0" draggable={false} />
          <div className="text-left min-w-0">
            <div className="font-display font-bold text-lg text-poster-yellow leading-tight">Nominativ</div>
            <div className="text-[11px] text-poster-ink/60">WER — subject / to be</div>
          </div>
        </button>

        <div>
          <SectionLabel>Pronouns + verb endings &amp; possessives</SectionLabel>
          <div className="flex gap-2">
            <div data-group="g-nom-pron" className="flex-1 flex flex-col gap-1.5">
              {NOM_ROWS.map(([pronId, endId]) => (
                <div key={pronId} className="flex gap-1">
                  <CarouselPill {...p} id={pronId} className="flex-1" />
                  <CarouselPill {...p} id={endId} className="w-12 text-xs" />
                </div>
              ))}
            </div>
            <PossessivesColumn {...posProps} />
          </div>
        </div>

        <div>
          <SectionLabel>Articles</SectionLabel>
          <div data-group="g-nom-art" className="grid grid-cols-2 gap-1.5">
            <CarouselPill {...p} id="nom-ein" />
            <CarouselPill {...p} id="nom-der" />
            <CarouselPill {...p} id="nom-eine">ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">e</span></CarouselPill>
            <CarouselPill {...p} id="nom-die" />
            <CarouselPill {...p} id="nom-ein2" />
            <CarouselPill {...p} id="nom-das" />
            <CarouselPill {...p} id="nom-none" />
            <CarouselPill {...p} id="nom-diePl" />
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─── DatPage ──────────────────────────────────────────────────────────── */

const DAT_PRONS = ["dat-mir","dat-dir","dat-ihm","dat-uns","dat-euch","dat-ihnen"] as const;
const DAT_PREPS = ["dat-prep-zu","dat-prep-von","dat-prep-mit","dat-prep-bei","dat-prep-nach","dat-prep-seit","dat-prep-ab","dat-prep-aus","dat-prep-gegenüber","dat-prep-außer"] as const;
const TWR = ["twR-in","twR-auf","twR-an","twR-unter","twR-neben","twR-hinter","twR-über","twR-vor","twR-zwischen","twR-unter2"] as const;

const DatPage = ({ activeWordId, onTap, onTapCase, onTapBackground, morphMap, quizActive }: PageProps) => {
  const p: Omit<PillProps, "id"> = { color: "purple", activeWordId, onTap, morphMap, quizActive };
  const posProps: PossColProps = { activeWordId, onTap, morphMap, quizActive };
  return (
    <div className="h-full overflow-y-auto" onClick={pageClick(onTapBackground)}>
      <div className="px-5 py-3 space-y-3 pb-8">

        <button onClick={(e) => { e.stopPropagation(); onTapCase("dat"); }}
          className="w-full flex items-center gap-3 active:scale-95 transition-transform">
          <img src={envelope} className="h-12 object-contain shrink-0" draggable={false} />
          <div className="text-left min-w-0">
            <div className="font-display font-bold text-lg text-poster-purple leading-tight">Dativ</div>
            <div className="text-[11px] text-poster-ink/60">WEM • WO • WANN — indirect object</div>
          </div>
        </button>

        <div>
          <SectionLabel>Prepositions (always Dat)</SectionLabel>
          <div data-group="g-dat-prep" className="bg-poster-purple rounded-sm py-2 px-3 grid grid-cols-5 gap-y-1 gap-x-1">
            {DAT_PREPS.map(k => (
              <CarouselPrepWord key={k} id={k} active={activeWordId === k} onTap={onTap}
                tiny={k === "dat-prep-gegenüber"} />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Pronouns &amp; possessives</SectionLabel>
          <div className="flex gap-2">
            <div data-group="g-dat-pron" className="flex-1 flex flex-col gap-1.5">
              {DAT_PRONS.map(k => <CarouselPill key={k} {...p} id={k} className="w-full" />)}
            </div>
            <PossessivesColumn {...posProps} />
          </div>
        </div>

        <div>
          <SectionLabel>Articles</SectionLabel>
          <div data-group="g-dat-art" className="grid grid-cols-2 gap-1.5">
            <CarouselPill {...p} id="dat-einem">ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">em</span></CarouselPill>
            <CarouselPill {...p} id="dat-dem" />
            <CarouselPill {...p} id="dat-einer">ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">er</span></CarouselPill>
            <CarouselPill {...p} id="dat-der" />
            <CarouselPill {...p} id="dat-einem2">ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">em</span></CarouselPill>
            <CarouselPill {...p} id="dat-dem2" />
            <CarouselPill {...p} id="dat-noneN">—…<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">n</span></CarouselPill>
            <CarouselPill {...p} id="dat-denN">den…<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">n</span></CarouselPill>
          </div>
        </div>

        <div>
          <SectionLabel>Two-way preps (Dat = location)</SectionLabel>
          <div data-group="g-twR" className="bg-poster-purple rounded-sm py-2 px-3 grid grid-cols-5 gap-y-1 gap-x-1 border-2 border-dashed border-white">
            {TWR.map(k => <CarouselPrepWord key={k} id={k} active={activeWordId === k} onTap={onTap} tiny />)}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─── Tab bar config ───────────────────────────────────────────────────── */

const TABS = [
  { label: "Akk",  dot: "bg-poster-green",  active: "border-poster-green text-poster-green" },
  { label: "Nom",  dot: "bg-poster-yellow", active: "border-poster-yellow text-poster-yellow" },
  { label: "Dat",  dot: "bg-poster-purple", active: "border-poster-purple text-poster-purple" },
];

const CASE_BG = ["bg-poster-green", "bg-poster-yellow", "bg-poster-purple"] as const;

/* ─── MobileCarousel ───────────────────────────────────────────────────── */

type Props = {
  activeCase: CaseKey | null;
  activeWordId: string | null;
  onTapCase: (c: CaseKey) => void;
  onTapWord: (id: string) => void;
  onTapBackground: () => void;
  genderOn: boolean;
  onToggleGender: () => void;
  morphMap: Map<string, MorphEntry> | null;
  quizBlur: boolean;
  quizActive: boolean;
  currentPage: number;
  onPageChange: (p: number) => void;
};

export const MobileCarousel = ({
  activeWordId, onTapCase, onTapWord, onTapBackground,
  morphMap, quizBlur, quizActive, currentPage, onPageChange,
}: Props) => {
  const [containerWidth, setContainerWidth] = useState(
    () => typeof window !== "undefined" ? window.innerWidth : 390,
  );
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startPage: 0, captured: false });
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startPage: currentPage, captured: false };
    didDragRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6 && !dragRef.current.captured) {
      dragRef.current.captured = true;
      didDragRef.current = true;
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (dragRef.current.captured) setDragOffset(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (!dragRef.current.captured) return; // pure tap — let onClick fire normally on the pill
    setIsDragging(false);
    const dx = e.clientX - dragRef.current.startX;
    const threshold = containerWidth * 0.25;
    let p = dragRef.current.startPage;
    if (dx < -threshold && p < 2) p++;
    else if (dx > threshold && p > 0) p--;
    onPageChange(p);
    setDragOffset(0);
  };

  const onPointerCancel = () => {
    if (!dragRef.current.active || !dragRef.current.captured) return;
    dragRef.current.active = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  const translateX = -currentPage * containerWidth + dragOffset;

  const sharedProps: PageProps = {
    activeWordId,
    onTap: onTapWord,
    onTapCase,
    onTapBackground,
    morphMap,
    quizActive,
  };

  return (
    <div className={cn("flex-1 min-h-0 flex flex-col", quizBlur && "quiz-active")}>

      {/* Tab bar */}
      <div className="shrink-0 flex border-b border-poster-ink/10 bg-poster-bg/95 backdrop-blur">
        {TABS.map((tab, i) => (
          <button key={tab.label} type="button" onClick={() => onPageChange(i)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-display font-semibold border-b-2 transition-colors",
              currentPage === i ? tab.active : "border-transparent text-poster-ink/50",
            )}
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", tab.dot, currentPage !== i && "opacity-40")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pages container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden relative touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={(e) => {
          if (didDragRef.current) {
            e.stopPropagation();
            e.preventDefault();
            didDragRef.current = false;
          }
        }}
      >
        {/* Sliding track */}
        <div
          className="flex h-full"
          style={{
            width: `${3 * containerWidth}px`,
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? "none" : "transform 280ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="h-full" style={{ width: containerWidth }}>
            <AkkPage {...sharedProps} />
          </div>
          <div className="h-full" style={{ width: containerWidth }}>
            <NomPage {...sharedProps} />
          </div>
          <div className="h-full" style={{ width: containerWidth }}>
            <DatPage {...sharedProps} />
          </div>
        </div>

        {/* Left edge strip — previous case color */}
        {currentPage > 0 && (
          <button
            className={cn("absolute left-0 inset-y-0 w-3 z-30 opacity-75 cursor-pointer", CASE_BG[currentPage - 1])}
            onClick={(e) => { e.stopPropagation(); onPageChange(currentPage - 1); }}
            aria-label="Previous case"
          />
        )}

        {/* Right edge strip — next case color */}
        {currentPage < 2 && (
          <button
            className={cn("absolute right-0 inset-y-0 w-3 z-30 opacity-75 cursor-pointer", CASE_BG[currentPage + 1])}
            onClick={(e) => { e.stopPropagation(); onPageChange(currentPage + 1); }}
            aria-label="Next case"
          />
        )}
      </div>

    </div>
  );
};
