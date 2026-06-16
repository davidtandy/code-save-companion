// Grammatical person labels for pronouns and possessives.
// Kept separate from wordData to avoid mass-mutating that file.

import type { ReactNode } from "react";

/** Person string for a top-level word id. */
export const WORD_PERSON: Record<string, string> = {
  // 1st singular
  "nom-ich": "1st singular", "akk-mich": "1st singular", "dat-mir": "1st singular", "pos-mein": "1st singular",
  // 2nd singular (informal)
  "nom-du": "2nd singular", "akk-dich": "2nd singular", "dat-dir": "2nd singular", "pos-dein": "2nd singular",
  // 3rd singular
  "nom-er": "3rd singular", "akk-ihn": "3rd singular", "dat-ihm": "3rd singular", "pos-sein": "3rd singular",
  // 1st plural
  "nom-wir": "1st plural", "akk-uns": "1st plural", "dat-uns": "1st plural", "pos-unser": "1st plural",
  // 2nd plural (informal)
  "nom-ihr": "2nd plural", "akk-euch": "2nd plural", "dat-euch": "2nd plural", "pos-euer": "2nd plural",
  // 3rd plural / formal
  "nom-sieSie": "3rd plural / formal", "akk-sieSie": "3rd plural / formal", "dat-ihnen": "3rd plural / formal",
  "pos-ihr": "3rd plural / formal",
  // Negation
  "pos-kein": "negation",
};

/** Person per sub-token, indexed by parent word id then sub index. */
export const SUB_PERSON: Record<string, string[]> = {
  "nom-er":     ["3rd singular", "3rd singular", "3rd singular"],
  "akk-ihn":    ["3rd singular", "3rd singular", "3rd singular"],
  "dat-ihm":    ["3rd singular", "3rd singular", "3rd singular"],
  "nom-sieSie": ["3rd plural", "2nd formal"],
  "akk-sieSie": ["3rd plural", "2nd formal"],
  "dat-ihnen":  ["3rd plural", "2nd formal"],
  "pos-sein":   ["3rd singular", "3rd singular", "3rd singular"],
  "pos-ihr":    ["3rd plural", "2nd formal"],
};

/** Render a person string with the leading ordinal token bolded. */
export function renderPerson(p: string | undefined | null): ReactNode {
  if (!p) return null;
  const parts = p.split(/\s+/);
  const head = parts[0];
  const tail = parts.slice(1).join(" ");
  return (
    <>
      <span className="font-semibold text-poster-ink">{head}</span>
      {tail && <> {tail}</>}
      <span className="ml-0.5 text-poster-ink/50"> person</span>
    </>
  );
}
