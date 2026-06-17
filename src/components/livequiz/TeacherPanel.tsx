// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";

/** Subject+verb prefix for each preposition, used to build a complete sentence. */
const VERB_CTX: Record<string, { de: string; en: string }> = {
  für:       { de: "Das ist",        en: "This is"         },
  gegen:     { de: "Er läuft",       en: "He runs"         },
  ohne:      { de: "Er kommt",       en: "He comes"        },
  um:        { de: "Wir gehen",      en: "We walk"         },
  durch:     { de: "Er fährt",       en: "He drives"       },
  bis:       { de: "Wir fahren",     en: "We drive"        },
  mit:       { de: "Er kommt",       en: "He comes"        },
  zu:        { de: "Sie geht",       en: "She goes"        },
  von:       { de: "Er kommt",       en: "He comes"        },
  bei:       { de: "Er wohnt",       en: "He lives"        },
  nach:      { de: "Sie fährt",      en: "She travels"     },
  seit:      { de: "Er lernt",       en: "He has learned"  },
  ab:        { de: "Der Zug fährt",  en: "The train goes"  },
  aus:       { de: "Er kommt",       en: "He comes"        },
  gegenüber: { de: "Er sitzt",       en: "He sits"         },
  außer:     { de: "Alle kommen",    en: "Everyone comes"  },
  in:        { de: "Er ist",         en: "He is"           },
  auf:       { de: "Es liegt",       en: "It is"           },
  an:        { de: "Er steht",       en: "He stands"       },
  unter:     { de: "Es liegt",       en: "It is"           },
  neben:     { de: "Er steht",       en: "He stands"       },
  hinter:    { de: "Er wartet",      en: "He waits"        },
  über:      { de: "Er fliegt",      en: "He flies"        },
  vor:       { de: "Er steht",       en: "He stands"       },
  zwischen:  { de: "Es liegt",       en: "It is"           },
};

const PREP_EN: Record<string, string> = {
  für: "for", gegen: "against", ohne: "without", um: "around",
  durch: "through", bis: "to", mit: "with", zu: "to", von: "from",
  bei: "with", nach: "to", seit: "since", ab: "from", aus: "from",
  gegenüber: "across from", außer: "except", in: "in", auf: "on",
  an: "at", unter: "under", neben: "next to", hinter: "behind",
  über: "over", vor: "in front of", zwischen: "between",
};

const NOM_EN: Record<string, string> = {
  bin: "am", bist: "are", ist: "is", sind: "are", seid: "are",
};

function articleEn(nounArticle: string): string {
  if (!nounArticle || nounArticle === "—") return "";
  if (["ein", "eine", "einen", "einem", "einer"].includes(nounArticle)) return "a";
  return "the";
}

/** Returns sentence parts so the hint word can be rendered greyed in the German blank. */
function buildSentence(q: any): { deBefore: string; hint: string; deAfter: string; en: string } {
  const prep = q.prep.token;
  const ctx = VERB_CTX[prep] ?? { de: "Er geht", en: "He goes" };
  const prepEn = PREP_EN[prep] ?? prep;

  if (q.prep.case === "nom") {
    const verbEn = NOM_EN[prep] ?? prep;
    const hint = q.targetEn ?? "";
    const sfxDe = q.suffix ? " " + q.suffix : "";
    const sfxEn = q.suffixEn ? " " + q.suffixEn : "";
    return {
      deBefore: "",
      hint,
      deAfter: ` ${prep}${sfxDe}.`,
      en: `${hint} ${verbEn}${sfxEn}.`,
    };
  }

  if (q.kind === "pronoun") {
    const hint = q.targetEn ?? "";
    return {
      deBefore: `${ctx.de} ${prep} `,
      hint,
      deAfter: ".",
      en: `${ctx.en} ${prepEn} ${hint}.`,
    };
  }

  // article question
  const artEn = articleEn(q.nounArticle);
  const sfxDe = q.suffix ? " " + q.suffix : "";
  const sfxEn = q.suffixEn ? " " + q.suffixEn : "";
  return {
    deBefore: `${ctx.de} ${prep} `,
    hint: artEn,
    deAfter: ` ${q.nounDe}${sfxDe}.`,
    en: `${ctx.en} ${prepEn}${artEn ? " " + artEn : ""} ${q.nounEn}${sfxEn}.`,
  };
}
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { avatarSrc } from "./avatars";
import { sampleQuestions, PILL_LABEL, eliminationTiersData, computeElimCount } from "./scoring";
import { Play, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  createLiveSession,
  getTeacherSession,
  updateLiveSession,
  listResponses,
} from "@/lib/livequiz.functions";

function makeCode(): string {
  // Timestamp prefix guarantees uniqueness even under rapid double-submit
  const ts = Date.now().toString(36).toUpperCase();
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 4; i++) r += ch[Math.floor(Math.random() * ch.length)];
  return ts + r;
}

type Session = {
  id: string;
  code: string;
  host_token: string;
  phase: "lobby" | "active" | "results" | "ended";
  current_question_index: number;
  question_started_at: string | null;
  timer_max_seconds: number;
  questions: any[];
};

const STORAGE_KEY = "livequiz_teacher_session";

export function TeacherPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false); // synchronous guard against double-submit

  const createFn     = useServerFn(createLiveSession);
  const getTeacherFn = useServerFn(getTeacherSession);
  const updateFn     = useServerFn(updateLiveSession);
  const listFn       = useServerFn(listResponses);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { id, hostToken } = JSON.parse(raw);
      if (!id || !hostToken) return;
      getTeacherFn({ data: { sessionId: id, hostToken } }).then((row) => {
        if (row && (row as any).phase !== "ended") setSession(row as Session);
      }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;
    async function tick() {
      try {
        const rows = await listFn({ data: { sessionId: session.id, hostToken: session.host_token } });
        if (!cancelled) setResponses(rows as any[]);
      } catch {}
    }
    tick();
    const iv = setInterval(tick, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [session?.id, session?.host_token]);

  const participants = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string }>();
    for (const r of responses) {
      if (!m.has(r.student_id)) m.set(r.student_id, { name: r.student_name, avatar: r.student_avatar });
    }
    return m;
  }, [responses]);

  async function createSession() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const row = await createFn({
        data: { code: makeCode(), gameMode: "prep-lock", questions: sampleQuestions(10), timerMaxSeconds: 30 },
      });
      setSession(row as Session);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: (row as any).id, hostToken: (row as any).host_token }));
      } catch {}
    } catch (e: any) {
      alert(e?.message ?? "Could not create session. Reset any existing session first.");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  async function applyPatch(patch: any) {
    if (!session) return;
    await updateFn({ data: { sessionId: session.id, hostToken: session.host_token, patch } });
    setSession({ ...session, ...patch });
  }

  async function startQuiz() {
    await applyPatch({ phase: "active", current_question_index: 0, question_started_at: new Date().toISOString() });
  }

  async function nextQuestion() {
    if (!session) return;
    const next = session.current_question_index + 1;
    if (next >= session.questions.length) {
      await applyPatch({ phase: "results" });
    } else {
      await applyPatch({ current_question_index: next, question_started_at: new Date().toISOString() });
    }
  }

  async function resetSession() {
    if (!session) return;
    if (!confirm("End this session and start a new one?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    await updateFn({ data: { sessionId: session.id, hostToken: session.host_token, patch: { phase: "ended" } } }).catch(() => {});
    setSession(null);
    setResponses([]);
  }

  const joinUrl = `${window.location.origin}/?livequiz`;

  // Timer for elimination animation
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (session?.phase !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [session?.phase]);

  const activeQ = session?.phase === "active"
    ? session.questions?.[session.current_question_index]
    : null;
  const startedAt = session?.question_started_at
    ? new Date(session.question_started_at).getTime()
    : Date.now();
  const timerMaxMs = (session?.timer_max_seconds || 30) * 1000;
  const elapsed = Math.max(0, now - startedAt);
  const activeTiers = activeQ ? eliminationTiersData(activeQ) : null;
  const cappedElimCount = (session?.phase === "active" && activeTiers)
    ? computeElimCount(elapsed, timerMaxMs, activeTiers.tier0Count, activeTiers.tier1Count, activeTiers.tier2Count)
    : 0;

  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-elim]").forEach((el) => el.removeAttribute("data-quiz-elim"));
    clear();
    if (!activeTiers || session?.phase !== "active" || cappedElimCount === 0) return clear;
    activeTiers.order.slice(0, cappedElimCount).forEach((pillId) => {
      document.querySelectorAll(`[data-cell-id="${pillId}"]`).forEach((el) =>
        (el as HTMLElement).setAttribute("data-quiz-elim", "1"),
      );
    });
    return clear;
  }, [cappedElimCount, activeQ?.correctPillId, session?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const answeredThisQ = session
    ? responses.filter((r) => r.question_index === session.current_question_index).length
    : 0;

  const sentence = activeQ ? buildSentence(activeQ) : null;

  return (
    <>
      {/* ── QR — fixed top-right ── */}
      <div className="fixed top-[52px] right-4 z-50 flex flex-col items-center gap-1.5">
        <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold text-center">
          Scan to join!
        </div>
        <div className="bg-white rounded-xl p-2 shadow-lg border border-poster-ink/10">
          <QRCode value={joinUrl} size={96} level="M" />
        </div>
      </div>

      {/* ── Left teacher panel: question → controls ── */}
      <div className="fixed left-0 top-[52px] bottom-0 w-[380px] z-50 flex flex-col p-4 gap-3 pointer-events-none">

        {/* Question text — floats over cheatsheet, grows to fill space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-2">
          {activeQ && sentence && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
                Q{session.current_question_index + 1} / {session.questions.length}
                {" · "}{answeredThisQ} / {participants.size} answered
              </div>
              <div className="text-5xl font-bold text-poster-ink leading-tight tracking-tight drop-shadow-sm">
                {sentence.deBefore}
                <span className="text-poster-ink/35 italic">{sentence.hint}</span>
                {sentence.deAfter}
              </div>
              <div className="text-2xl text-poster-ink/60 font-medium drop-shadow-sm italic">
                {sentence.en}
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="pointer-events-auto bg-poster-bg/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-poster-ink/10">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-between px-4 py-3 bg-poster-teal text-white"
          >
            <span className="font-bold text-sm tracking-tight">Live Quiz · Teacher</span>
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {!collapsed && (
            <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
              {!session ? (
                <button
                  onClick={createSession}
                  disabled={creating}
                  className="w-full py-3 rounded-full bg-poster-teal text-white font-bold text-base hover:bg-poster-teal/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating…" : "Start Session"}
                </button>
              ) : (
                <>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold mb-2">
                      Joined ({participants.size})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...participants.values()].map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-poster-yellow/20 rounded-full px-2 py-1 text-xs font-medium text-poster-ink"
                        >
                          <img src={avatarSrc(p.avatar)} alt="" className="w-4 h-4" />
                          <span>{p.name}</span>
                        </div>
                      ))}
                      {participants.size === 0 && (
                        <div className="text-xs text-poster-ink/30 italic">No students yet</div>
                      )}
                    </div>
                  </div>

                  {session.phase === "lobby" && (
                    <button
                      onClick={startQuiz}
                      disabled={participants.size === 0}
                      className="w-full py-3 rounded-full bg-poster-teal text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-teal/90 disabled:opacity-40 transition-colors"
                    >
                      <Play size={16} /> Start
                    </button>
                  )}

                  {session.phase === "active" && (
                    <div className="space-y-2">
                      <div className="text-xs text-poster-ink/40 text-center">
                        {answeredThisQ} / {participants.size} answered
                      </div>
                      <button
                        onClick={nextQuestion}
                        className="w-full py-3 rounded-full bg-poster-yellow text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-yellow/90 transition-colors"
                      >
                        <SkipForward size={16} />
                        {session.current_question_index + 1 >= session.questions.length ? "End → Results" : "Next →"}
                      </button>
                    </div>
                  )}

                  {(session.phase === "results" || session.phase === "ended") && (
                    <div className="text-center text-sm font-semibold text-poster-ink/60 py-1">
                      {session.phase === "results" ? "Showing results to students" : "Session ended"}
                    </div>
                  )}

                  <button
                    onClick={resetSession}
                    className="w-full py-2 text-xs text-poster-ink/30 hover:text-poster-ink/60 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={13} /> End / Reset
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
