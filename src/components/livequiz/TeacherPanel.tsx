// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";

/** Subject+verb prefix for each preposition. enPrep overrides the default PREP_EN lookup. */
const VERB_CTX: Record<string, { de: string; en: string; enPrep?: string }> = {
  für:       { de: "Das ist",        en: "This is"          },
  gegen:     { de: "Er kämpft",      en: "He competes"      }, // "gegen" = against/versus
  ohne:      { de: "Er kommt",       en: "He comes"         },
  um:        { de: "Es geht",        en: "It's",  enPrep: "about" }, // "es geht um" = it's about
  durch:     { de: "Er geht",        en: "He goes"          },
  bis:       { de: "Wir fahren",     en: "We drive"         },
  mit:       { de: "Er kommt",       en: "He comes"         },
  zu:        { de: "Sie geht",       en: "She goes"         },
  von:       { de: "Er kommt",       en: "He comes"         },
  bei:       { de: "Er wohnt",       en: "He lives"         },
  nach:      { de: "Er fragt",       en: "He asks", enPrep: "about" }, // "fragen nach" = ask about
  seit:      { de: "Er lernt",       en: "He has studied"   },
  ab:        { de: "Der Zug fährt",  en: "The train departs" },
  aus:       { de: "Er kommt",       en: "He comes"         },
  gegenüber: { de: "Er sitzt",       en: "He sits", enPrep: "across from" },
  außer:     { de: "Alle kommen",    en: "Everyone comes",  enPrep: "except" },
  in:        { de: "Er ist",         en: "He is"            },
  auf:       { de: "Es liegt",       en: "It is"            },
  an:        { de: "Er steht",       en: "He stands"        },
  unter:     { de: "Es liegt",       en: "It is"            },
  neben:     { de: "Er steht",       en: "He stands"        },
  hinter:    { de: "Er wartet",      en: "He waits"         },
  über:      { de: "Er fliegt",      en: "He flies"         },
  vor:       { de: "Er steht",       en: "He stands"        },
  zwischen:  { de: "Es liegt",       en: "It is"            },
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
function buildSentence(q: any) {
  if (!q.prep) {
    const deBefore = q.pre || "";
    const hint = q.correctWWord || (q as any).targetEn || "?";
    const deAfter = (q.boxedNoun ? " " + q.boxedNoun : "") + (q.post || "");
    return { deBefore, hint, deAfter, en: "", enBefore: "", enBlank: "", enAfter: "" };
  }

  const prep = q.prep.token;
  const ctx = VERB_CTX[prep] ?? { de: "Er geht", en: "He goes" };
  const prepEn = ctx.enPrep ?? PREP_EN[prep] ?? prep;

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
      enBefore: "",
      enBlank: hint,
      enAfter: ` ${verbEn}${sfxEn}.`,
    };
  }

  if (q.kind === "pronoun") {
    const hint = q.targetEn ?? "";
    return {
      deBefore: `${ctx.de} ${prep} `,
      hint,
      deAfter: ".",
      en: `${ctx.en} ${prepEn} ${hint}.`,
      enBefore: `${ctx.en} ${prepEn} `,
      enBlank: hint,
      enAfter: ".",
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
    enBefore: artEn ? `${ctx.en} ${prepEn} ` : `${ctx.en} ${prepEn} ${q.nounEn}${sfxEn}.`,
    enBlank: artEn,
    enAfter: artEn ? ` ${q.nounEn}${sfxEn}.` : "",
  };
}
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { avatarSrc } from "./avatars";
import { sampleQuestions, sampleQWQuestions, sampleWFragenQuestions, PILL_LABEL, eliminationTiersData, computeElimCount } from "./scoring";
import { TeacherQWDisplay } from "./TeacherQWDisplay";
import { TeacherWFragenDisplay } from "./TeacherWFragenDisplay";
import { QuestionWordSVGMap, loadZones } from "@/components/poster/QuestionWordSVGMap";
import { Play, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  createLiveSession,
  getTeacherSession,
  updateLiveSession,
  listResponses,
  resetLiveSession,
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
  const [selectedGame, setSelectedGame] = useState<"article" | "question-words" | "wfragen">("article");
  const [wfragenLevel, setWfragenLevel] = useState<"easy" | "hard">("easy");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [prevRankOrder, setPrevRankOrder] = useState<string[]>([]);
  const [pillAvatars, setPillAvatars] = useState<{ key: string; x: number; y: number; avatarKey: string; delayMs: number; floatDur: number; floatPhase: number }[]>([]);
  const creatingRef = useRef(false); // synchronous guard against double-submit

  const createFn     = useServerFn(createLiveSession);
  const getTeacherFn = useServerFn(getTeacherSession);
  const updateFn     = useServerFn(updateLiveSession);
  const listFn       = useServerFn(listResponses);
  const resetFn      = useServerFn(resetLiveSession);

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
      const gameMode = selectedGame === "question-words" ? "question-words"
        : selectedGame === "wfragen" ? "wfragen"
        : "prep-lock";
      const questions = selectedGame === "question-words" ? sampleQWQuestions()
        : selectedGame === "wfragen" ? sampleWFragenQuestions(wfragenLevel)
        : sampleQuestions(20);
      const row = await createFn({
        data: { code: makeCode(), gameMode, questions, timerMaxSeconds: 30 },
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

  function freshQuestions() {
    return selectedGame === "question-words" ? sampleQWQuestions()
      : selectedGame === "wfragen" ? sampleWFragenQuestions(wfragenLevel)
      : sampleQuestions(20);
  }

  async function resetSession() {
    if (!session) return;
    try {
      const row = await resetFn({
        data: { sessionId: session.id, hostToken: session.host_token, questions: freshQuestions() },
      });
      setSession(row as Session);
      setResponses([]);
    } catch (e: any) {
      alert(e?.message ?? "Reset failed");
    } finally {
      setConfirmReset(false);
    }
  }

  async function playAgain() {
    if (!session) return;
    try {
      const row = await resetFn({
        data: { sessionId: session.id, hostToken: session.host_token, questions: freshQuestions() },
      });
      setSession(row as Session);
      setResponses([]);
    } catch (e: any) {
      alert(e?.message ?? "Reset failed");
    }
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
  const activeTiers = activeQ && session?.game_mode !== "question-words" && session?.game_mode !== "wfragen" ? eliminationTiersData(activeQ) : null;
  const cappedElimCount = (session?.phase === "active" && activeTiers)
    ? computeElimCount(elapsed, timerMaxMs, activeTiers.tier0Count, activeTiers.tier1Count, activeTiers.tier2Count, activeTiers.tier3Count, activeTiers.tier4Count)
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

  // Pulse the correct pill during breakdown
  useEffect(() => {
    const clear = () =>
      document.querySelectorAll("[data-quiz-correct]").forEach((el) => el.removeAttribute("data-quiz-correct"));
    clear();
    if (!showBreakdown || !activeQ || session?.game_mode === "question-words" || session?.game_mode === "wfragen") return clear;
    document.querySelectorAll(`[data-cell-id="${activeQ.correctPillId}"]`).forEach((el) =>
      (el as HTMLElement).setAttribute("data-quiz-correct", "1"),
    );
    return clear;
  }, [showBreakdown, activeQ?.correctPillId]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeRatio = Math.max(0, Math.min(1, 1 - elapsed / timerMaxMs));
  const timerExpired = timeRatio <= 0;

  const answeredThisQ = session
    ? responses.filter((r) => r.question_index === session.current_question_index).length
    : 0;

  const sessionLeaderboard = useMemo(() => {
    const totals = new Map<string, { id: string; name: string; avatar: string; points: number }>();
    for (const r of responses) {
      if (r.question_index < 0) continue;
      const cur = totals.get(r.student_id) ?? { id: r.student_id, name: r.student_name, avatar: r.student_avatar, points: 0 };
      cur.points += r.points || 0;
      totals.set(r.student_id, cur);
    }
    return [...totals.values()].sort((a, b) => b.points - a.points);
  }, [responses]);

  // Auto-advance: timer expired → immediate
  useEffect(() => {
    if (!timerExpired || session?.phase !== "active" || showBreakdown) return;
    setShowBreakdown(true);
  }, [timerExpired, session?.phase, session?.current_question_index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance: all students answered → 1s delay
  useEffect(() => {
    if (session?.phase !== "active" || showBreakdown || participants.size === 0) return;
    if (answeredThisQ < participants.size) return;
    const t = setTimeout(() => setShowBreakdown(true), 1000);
    return () => clearTimeout(t);
  }, [answeredThisQ, participants.size, session?.phase, session?.current_question_index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset breakdown when question advances
  useEffect(() => {
    setPrevRankOrder(sessionLeaderboard.map((t) => t.id));
    setShowBreakdown(false);
    setPanelExpanded(false);
    setStatsExpanded(false);
    setPillAvatars([]);
  }, [session?.current_question_index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Slide panel up 1.5s after breakdown; reveal rank animations at 2.5s
  useEffect(() => {
    if (!showBreakdown) { setPanelExpanded(false); setStatsExpanded(false); return; }
    const t1 = setTimeout(() => setPanelExpanded(true), 1500);
    const t2 = setTimeout(() => setStatsExpanded(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showBreakdown, session?.current_question_index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scatter avatars onto their chosen pills after breakdown
  useEffect(() => {
    if (!showBreakdown) { setPillAvatars([]); return; }
    const t = setTimeout(() => {
      const qi = session?.current_question_index ?? 0;
      const cur = responses.filter((r) => r.question_index === qi);
      const byPill = new Map<string, string[]>();
      for (const r of cur) {
        if (!byPill.has(r.answer)) byPill.set(r.answer, []);
        byPill.get(r.answer)!.push(r.student_avatar);
      }
      const avatars: typeof pillAvatars = [];
      let gi = 0;
      for (const [pillId, keys] of byPill) {
        const el = document.querySelector(`[data-cell-id="${pillId}"]`);
        if (!el) { gi += keys.length; continue; }
        const rect = el.getBoundingClientRect();
        const spacing = 14;
        const totalW = (keys.length - 1) * spacing;
        const cx = rect.left + rect.width / 2 - totalW / 2 - 6;
        const cy = rect.bottom - 6;
        keys.forEach((avatarKey, i) => {
          avatars.push({ key: `${pillId}-${i}`, x: cx + i * spacing, y: cy, avatarKey, delayMs: gi * 55, floatDur: 1.8 + Math.random() * 1.6, floatPhase: Math.random() * 2400 });
          gi++;
        });
      }
      setPillAvatars(avatars);
    }, 400);
    return () => clearTimeout(t);
  }, [showBreakdown, session?.current_question_index]); // eslint-disable-line react-hooks/exhaustive-deps

  const sentence = activeQ
    ? activeQ.sentence
      ? (() => {
          const [deBefore, deAfter] = activeQ.sentence.split("_____");
          const _artEn = articleEn(activeQ.nounArticle ?? "");
          const _nounEn: string = activeQ.nounEn ?? "";
          const _sentEn: string = activeQ.sentenceEn ?? "";
          let _enBefore = _sentEn, _enBlank = "", _enAfter = "";
          if (_artEn && _nounEn) {
            const _target = ` ${_artEn} ${_nounEn}`;
            const _idx = _sentEn.toLowerCase().indexOf(_target.toLowerCase());
            if (_idx !== -1) { _enBefore = _sentEn.slice(0, _idx + 1); _enBlank = _artEn; _enAfter = _sentEn.slice(_idx + 1 + _artEn.length); }
          }
          return { deBefore: deBefore ?? "", hint: _artEn || (activeQ as any).targetEn || "?", deAfter: deAfter ?? "", en: _sentEn, enBefore: _enBefore, enBlank: _enBlank, enAfter: _enAfter };
        })()
      : buildSentence(activeQ)
    : null;

  // W-Fragen's word step doesn't involve the cheatsheet at all (students answer via
  // the question-word icons) — hide it and show the three icons large instead.
  const showBigIconsTakeover = session?.phase === "active" && session?.game_mode === "wfragen" && activeQ?.step === "wword";

  return (
    <>
      {showBigIconsTakeover && (
        <div className="fixed inset-0 z-40 bg-poster-bg flex items-center justify-center px-12">
          <div className="w-full max-w-4xl">
            <QuestionWordSVGMap
              zones={loadZones()}
              onWordClick={() => {}}
              correctWord={showBreakdown ? activeQ.correctWWord : null}
              gap={24}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* ── QR — fixed top-right, doubles on hover ── */}
      <div className="fixed top-0 right-0 z-[150] flex flex-col items-end gap-1 transition-transform duration-200 origin-top-right hover:scale-[2.5]">
        <div className="bg-white rounded-bl-xl p-1.5 shadow-lg border-b border-l border-poster-ink/10">
          <QRCode value={joinUrl} size={52} level="M" />
        </div>
        <div className="text-[9px] uppercase tracking-widest text-poster-ink/50 font-semibold pr-1">
          Scan to join!
        </div>
      </div>

      {/* ── Left teacher panel: question → controls ── */}
      <div className="fixed left-0 top-[52px] bottom-0 w-[460px] flex flex-col p-4 gap-3 pointer-events-none"
          style={{ zIndex: statsExpanded ? 200 : 50 }}>

        {/* Question sentence — blank fills in with answer on breakdown */}
        <div
          className="flex flex-col items-center justify-center text-center space-y-4 px-2 overflow-hidden"
          style={{
            flexGrow: panelExpanded ? 0 : 1,
            opacity: panelExpanded ? 0 : 1,
            maxHeight: panelExpanded ? 0 : undefined,
            transition: "flex-grow 0.5s ease-in-out, opacity 0.35s ease-in-out, max-height 0.5s ease-in-out",
          }}
        >
          {activeQ && (
            session?.game_mode === "question-words"
              ? <TeacherQWDisplay
                  q={activeQ}
                  questionIndex={session.current_question_index}
                  totalQuestions={session.questions.length}
                  responses={responses}
                  showBreakdown={showBreakdown}
                  answeredThisQ={answeredThisQ}
                  participantCount={participants.size}
                />
              : session?.game_mode === "wfragen"
              ? <TeacherWFragenDisplay
                  q={activeQ}
                  questionIndex={session.current_question_index}
                  totalQuestions={session.questions.length}
                  responses={responses}
                  showBreakdown={showBreakdown}
                  answeredThisQ={answeredThisQ}
                  participantCount={participants.size}
                />
              : sentence && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
                Q{session.current_question_index + 1} / {session.questions.length}
                {" · "}{answeredThisQ} / {participants.size} answered
              </div>
              <div className="text-5xl font-bold text-poster-ink leading-snug tracking-tight drop-shadow-sm">
                {sentence.deBefore && <span>{sentence.deBefore}</span>}
                {showBreakdown ? (
                  <span key="filled" className="answer-fill text-poster-teal px-2">
                    {PILL_LABEL[activeQ.correctPillId] ?? activeQ.correctPillId}
                  </span>
                ) : (
                  <span key="blank" className="text-poster-ink/35 italic px-2 inline-block min-w-[64px] text-center" style={{ borderBottom: "3px solid black" }}>
                    {sentence.hint || " "}
                  </span>
                )}
                {sentence.deAfter && <span>{sentence.deAfter.trimStart()}</span>}
              </div>
              <div className="text-2xl text-poster-ink/60 font-medium drop-shadow-sm italic">
                {sentence.enBefore}
                {sentence.enBlank && <span style={{ borderBottom: "2px solid currentColor", paddingBottom: 1 }}>{sentence.enBlank}</span>}
                {sentence.enAfter}
              </div>
            </>
              )
          )}
        </div>

        {/* Controls — shows student stats during breakdown, normal controls otherwise */}
        <div
          className="pointer-events-auto bg-poster-bg/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-poster-ink/10 flex flex-col"
          style={
            showBreakdown && !panelExpanded
              ? { maxHeight: 0, overflow: "hidden" }
              : { flexGrow: panelExpanded ? 1 : 0, transition: "flex-grow 0.5s ease-in-out" }
          }
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-between px-4 py-3 bg-poster-teal text-white"
          >
            <span className="font-bold text-sm tracking-tight">Live Quiz · Teacher</span>
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {!collapsed && (
            <div className={cn("p-4 space-y-3 overflow-y-auto", panelExpanded ? "flex-1" : "max-h-[40vh]")}>
              {!session ? (
                <>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold mb-2">Game</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(["article", "question-words", "wfragen"] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGame(g)}
                          className={cn(
                            "flex-1 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                            selectedGame === g
                              ? "bg-poster-teal text-white"
                              : "bg-white/60 text-poster-ink/60 border border-poster-ink/15 hover:bg-white"
                          )}
                        >
                          {g === "article" ? "Article Quiz" : g === "question-words" ? "Question Words" : "W-Fragen"}
                        </button>
                      ))}
                    </div>
                    {selectedGame === "wfragen" && (
                      <div className="mt-2 flex gap-1.5">
                        {(["easy", "hard"] as const).map((lv) => (
                          <button
                            key={lv}
                            onClick={() => setWfragenLevel(lv)}
                            className={cn(
                              "flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize",
                              wfragenLevel === lv
                                ? "bg-poster-yellow text-white"
                                : "bg-white/60 text-poster-ink/50 border border-poster-ink/15 hover:bg-white"
                            )}
                          >
                            {lv}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={createSession}
                    disabled={creating}
                    className="w-full py-3 rounded-full bg-poster-teal text-white font-bold text-base hover:bg-poster-teal/90 disabled:opacity-50 transition-colors"
                  >
                    {creating ? "Creating…" : "Start Session"}
                  </button>
                </>
              ) : showBreakdown && session.phase === "active" ? (
                <>
                  {/* Rankings */}
                  {sessionLeaderboard.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold">Rankings</div>
                      {sessionLeaderboard.slice(0, 5).map((t, i) => {
                        const prevRank = prevRankOrder.indexOf(t.id);
                        const change = prevRank === -1 ? 0 : prevRank - i;
                        const slideFromPx = prevRank === -1 ? 0 : (prevRank - i) * 34;
                        return (
                          <div
                            key={t.id}
                            className={cn("flex items-center gap-2 rounded-full px-3 py-1.5", i === 0 ? "bg-poster-yellow" : "bg-white/60")}
                            style={statsExpanded && slideFromPx !== 0 ? { '--rank-slide-from': `${slideFromPx}px`, animation: 'rank-slide 1.1s ease-out both' } as React.CSSProperties : undefined}
                          >
                            <span className={cn("text-xs font-bold w-4 text-center", i === 0 ? "text-white" : "text-poster-ink/30")}>{i + 1}</span>
                            <img src={avatarSrc(t.avatar)} alt="" className="w-5 h-5" draggable={false} />
                            <span className={cn("flex-1 text-sm font-semibold", i === 0 ? "text-white" : "text-poster-ink")}>{t.name}</span>
                            {statsExpanded && change !== 0 && (
                              <span className={cn("rank-change text-xs font-bold tabular-nums", change > 0 ? "text-poster-teal" : "text-poster-red")}>
                                {change > 0 ? `+${change}` : change}
                              </span>
                            )}
                            <span className={cn("text-sm font-bold tabular-nums", i === 0 ? "text-white" : "text-poster-ink")}>{t.points}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Next */}
                  <button
                    onClick={() => { nextQuestion(); setShowBreakdown(false); }}
                    className="w-full py-3 rounded-full bg-poster-teal text-white font-bold flex items-center justify-center gap-2 hover:bg-poster-teal/90 transition-colors"
                  >
                    <SkipForward size={16} />
                    {session.current_question_index + 1 >= session.questions.length ? "End → Results" : "Next Question →"}
                  </button>
                  {confirmReset ? (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 text-xs text-poster-ink/40 rounded-full border border-poster-ink/10 hover:bg-poster-ink/5 transition-colors">Cancel</button>
                      <button onClick={resetSession} className="flex-1 py-2 text-xs text-red-500 font-semibold rounded-full border border-red-200 hover:bg-red-50 transition-colors">Yes, reset</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="w-full py-2 text-xs text-poster-ink/30 hover:text-poster-ink/60 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw size={13} /> End / Reset
                    </button>
                  )}
                </>
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
                    <>
                      <div className="text-center text-sm font-semibold text-poster-ink/60 py-1">
                        {session.phase === "results" ? "Showing results to students" : "Session ended"}
                      </div>
                      <button
                        onClick={playAgain}
                        className="w-full py-3 rounded-full bg-poster-teal/10 text-poster-teal font-bold flex items-center justify-center gap-2 hover:bg-poster-teal/20 transition-colors"
                      >
                        <RotateCcw size={16} /> Play Again
                      </button>
                    </>
                  )}

                  {confirmReset ? (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 text-xs text-poster-ink/40 rounded-full border border-poster-ink/10 hover:bg-poster-ink/5 transition-colors">Cancel</button>
                      <button onClick={resetSession} className="flex-1 py-2 text-xs text-red-500 font-semibold rounded-full border border-red-200 hover:bg-red-50 transition-colors">Yes, reset</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="w-full py-2 text-xs text-poster-ink/30 hover:text-poster-ink/60 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw size={13} /> End / Reset
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {pillAvatars.map(({ key, x, y, avatarKey, delayMs, floatDur, floatPhase }) => (
        <div
          key={key}
          className="fixed z-[300] pointer-events-none avatar-scatter"
          style={{ left: x, top: y, '--scatter-delay': `${delayMs}ms`, '--float-dur': `${floatDur}s`, '--float-phase': `${floatPhase}ms` } as React.CSSProperties}
        >
          <img src={avatarSrc(avatarKey)} alt="" className="w-3 h-3 rounded-full shadow ring-1 ring-white" draggable={false} />
        </div>
      ))}
    </>
  );
}
