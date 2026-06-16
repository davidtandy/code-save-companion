// Possessive ↔ ein-article morphing logic for selection flourishes.
import { WORDS } from "./wordData";

export type PillColor = "green" | "yellow" | "purple" | "red";
export type EndingGender = "m" | "f" | "n" | "pl" | null;

/** Indefinite ein-articles + plural dash-pills (no indef plural article). */
export const EIN_ARTICLES: { id: string; ending: string; color: PillColor; gender: EndingGender }[] = [
  { id: "nom-ein",    ending: "",   color: "yellow", gender: "m"  },
  { id: "nom-eine",   ending: "e",  color: "yellow", gender: "f"  },
  { id: "nom-ein2",   ending: "",   color: "yellow", gender: "n"  },
  { id: "nom-none",   ending: "e",  color: "yellow", gender: "pl" },
  { id: "akk-einen",  ending: "en", color: "green",  gender: "m"  },
  { id: "akk-eine",   ending: "e",  color: "green",  gender: "f"  },
  { id: "akk-ein",    ending: "",   color: "green",  gender: "n"  },
  { id: "akk-none",   ending: "e",  color: "green",  gender: "pl" },
  { id: "dat-einem",  ending: "em", color: "purple", gender: "m"  },
  { id: "dat-einer",  ending: "er", color: "purple", gender: "f"  },
  { id: "dat-einem2", ending: "em", color: "purple", gender: "n"  },
  { id: "dat-noneN",  ending: "en", color: "purple", gender: "pl" },
];
const EIN_IDS = new Set(EIN_ARTICLES.map((a) => a.id));

export const POSSESSIVE_IDS = [
  "pos-mein", "pos-dein", "pos-sein", "pos-unser", "pos-euer", "pos-ihr",
] as const;

/** Apply an ending to a possessive stem, with German contraction exceptions. */
export function applyEnding(stem: string, ending: string): string {
  if (!ending) return stem;
  const lower = stem.toLowerCase();
  if (lower === "euer") {
    const out = "eur" + ending;
    return stem[0] === "E" ? "E" + out.slice(1) : out;
  }
  return stem + ending;
}

function stemsFor(id: string): string[] {
  const w = WORDS[id];
  if (!w) return [];
  if (w.subWords?.length) return w.subWords.map((s) => s.token);
  return [w.display];
}

export type MorphEntry = {
  parts: { stem: string; ending: string }[];
  color: PillColor;
  index: number;
  /** Gender of the triggering ein-article — used to stroke ending under gender colors. */
  endingGender: EndingGender;
};

export function buildMorphMap(
  activeWordId: string | null,
  morphContextId?: string | null,
): Map<string, MorphEntry> {
  const map = new Map<string, MorphEntry>();
  // Sticky case: an ein-article context is preserved while a possessive (or its
  // sub-pill) is selected — show morph styling on ALL possessives.
  const stickyTrigger = (
    morphContextId && EIN_IDS.has(morphContextId) &&
    activeWordId && (activeWordId.startsWith("pos-") || activeWordId.split("::")[0]?.startsWith("pos-"))
  ) ? morphContextId : null;
  if (stickyTrigger) {
    const art = EIN_ARTICLES.find((a) => a.id === stickyTrigger)!;
    POSSESSIVE_IDS.forEach((pid, i) => {
      const stems = stemsFor(pid);
      const parts = stems.map((s) => {
        const full = applyEnding(s, art.ending);
        const head = full.slice(0, full.length - art.ending.length);
        return { stem: head, ending: art.ending };
      });
      map.set(pid, { parts, color: art.color, index: i, endingGender: art.gender });
    });
    return map;
  }
  if (!activeWordId) return map;
  if (activeWordId.startsWith("pos-")) return map;
  if (EIN_IDS.has(activeWordId)) {
    const art = EIN_ARTICLES.find((a) => a.id === activeWordId)!;
    POSSESSIVE_IDS.forEach((pid, i) => {
      const stems = stemsFor(pid);
      const parts = stems.map((s) => {
        const full = applyEnding(s, art.ending);
        const head = full.slice(0, full.length - art.ending.length);
        return { stem: head, ending: art.ending };
      });
      map.set(pid, { parts, color: art.color, index: i, endingGender: art.gender });
    });
  }
  return map;
}

export function selectionRevealsPossessiveRow(activeWordId: string | null, morphContextId?: string | null): boolean {
  if (activeWordId && EIN_IDS.has(activeWordId)) return true;
  if (morphContextId && EIN_IDS.has(morphContextId) && activeWordId &&
      (activeWordId.startsWith("pos-") || activeWordId.split("::")[0]?.startsWith("pos-"))) return true;
  return false;
}

export { EIN_IDS };
