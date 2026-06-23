import type { ReactNode } from "react";
import { WORDS, type CaseKey } from "./wordData";

export type CaseColorMode = "tokens" | "phrase" | "all";

/** lowercased token → set of possible cases */
const TOKEN_CASE: Map<string, Set<CaseKey>> = (() => {
  const m = new Map<string, Set<CaseKey>>();
  const add = (tok: string, c: CaseKey) => {
    const k = tok.toLowerCase();
    if (!m.has(k)) m.set(k, new Set());
    m.get(k)!.add(c);
  };
  for (const w of Object.values(WORDS)) {
    if (!w.case) continue;
    // split display tokens like "ihn • sie • es" or "sie • Sie"
    const parts = w.display.split(/[•·/]/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (p === "—" || p.includes("…")) continue;
      add(p, w.case);
    }
    if (w.subWords) for (const s of w.subWords) add(s.token, w.case);
  }
  return m;
})();

const caseColorVar: Record<CaseKey, string> = {
  nom: "hsl(var(--poster-yellow))",
  akk: "hsl(var(--poster-green))",
  dat: "hsl(var(--poster-purple))",
};

/** Tokenize a sentence preserving punctuation/whitespace. */
function tokenize(s: string): { text: string; isWord: boolean }[] {
  const out: { text: string; isWord: boolean }[] = [];
  const re = /([A-Za-zÄÖÜäöüß]+)|([^A-Za-zÄÖÜäöüß]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m[1]) out.push({ text: m[1], isWord: true });
    else out.push({ text: m[2], isWord: false });
  }
  return out;
}

function caseFor(token: string): CaseKey | null {
  const set = TOKEN_CASE.get(token.toLowerCase());
  if (!set || set.size !== 1) return null;
  return [...set][0];
}

/** Returns colored React nodes for a German sentence. */
export function colorizeSentence(
  sentence: string,
  mode: CaseColorMode,
  hint?: CaseKey | null,
): ReactNode[] {
  const tokens = tokenize(sentence);
  // First pass: per-token case
  const caseAt: (CaseKey | null)[] = tokens.map((t) =>
    t.isWord ? caseFor(t.text) : null,
  );

  // Phrase propagation: an article/preposition sets the "current" case;
  // propagate to following capitalized (noun) and lowercase adjective tokens
  // until punctuation that breaks the phrase.
  if (mode === "phrase" || mode === "all") {
    let cur: CaseKey | null = null;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!t.isWord) {
        if (/[.,;:!?]/.test(t.text)) cur = null;
        continue;
      }
      const c = caseAt[i];
      if (c) {
        cur = c;
        continue;
      }
      // unknown word — if we have a current case from a preceding article/prep, paint it
      if (cur && mode === "phrase") {
        caseAt[i] = cur;
      }
    }
  }

  // Apply hint for ambiguous tokens when nothing else worked (e.g. "das" in dat example)
  if (hint) {
    for (let i = 0; i < tokens.length; i++) {
      if (!tokens[i].isWord || caseAt[i]) continue;
      const set = TOKEN_CASE.get(tokens[i].text.toLowerCase());
      if (set && set.has(hint)) caseAt[i] = hint;
    }
  }

  return tokens.map((t, i) => {
    if (!t.isWord) return t.text;
    const c = caseAt[i];
    if (c) {
      return (
        <span key={i} style={{ color: caseColorVar[c], fontWeight: 600 }}>
          {t.text}
        </span>
      );
    }
    return <span key={i}>{t.text}</span>;
  });
}
