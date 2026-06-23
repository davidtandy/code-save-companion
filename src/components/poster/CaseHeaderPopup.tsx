// @ts-nocheck
import { cn } from "@/lib/utils";
import type { CaseKey } from "./wordData";

export type IconRect = { left: number; top: number; width: number; height: number };

type Props = {
  caseKey: CaseKey;
  iconSrc: string;
  iconRect: IconRect;
  onClose: () => void;
};

const CASE_LABEL: Record<CaseKey, string> = {
  nom: "Nominativ",
  akk: "Akkusativ",
  dat: "Dativ",
};

const CASE_COLOR: Record<CaseKey, string> = {
  nom: "bg-poster-yellow",
  akk: "bg-poster-teal",
  dat: "bg-poster-purple",
};

export function CaseHeaderPopup({ caseKey, iconSrc, iconRect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} />
      <div
        className={cn(
          "fixed z-[81] rounded-2xl shadow-2xl border border-poster-ink/10 bg-white p-4 flex items-center gap-3",
          "w-48",
        )}
        style={{
          left: iconRect.left + iconRect.width / 2 - 96,
          top: iconRect.top + iconRect.height + 8,
        }}
      >
        <img src={iconSrc} alt={caseKey} className="w-10 h-10 object-contain" draggable={false} />
        <div>
          <div className="font-bold text-sm text-poster-ink">{CASE_LABEL[caseKey]}</div>
          <div className={cn("text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block text-white", CASE_COLOR[caseKey])}>
            {caseKey}
          </div>
        </div>
      </div>
    </>
  );
}
