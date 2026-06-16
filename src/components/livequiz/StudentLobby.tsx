// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AVATARS } from "./avatars";

const STORAGE_KEY = "livequiz_student";

export type StudentIdentity = {
  student_id: string;
  student_name: string;
  student_avatar: string;
  session_id: string;
  session_code: string;
};

function getOrCreateStudentId(): string {
  try {
    const raw = localStorage.getItem("livequiz_student_id");
    if (raw) return raw;
    const id = crypto.randomUUID();
    localStorage.setItem("livequiz_student_id", id);
    return id;
  } catch { return crypto.randomUUID(); }
}

type Props = {
  onJoined: (identity: StudentIdentity) => void;
};

export function StudentLobby({ onJoined }: Props) {
  const initialCode = useMemo(() => {
    const u = new URL(window.location.href);
    return (u.searchParams.get("code") ?? "").toUpperCase();
  }, []);
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore previous identity for same session if rejoining
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prev = JSON.parse(raw);
      if (prev?.session_code === code) {
        setName(prev.student_name ?? "");
        setAvatar(prev.student_avatar ?? AVATARS[0].key);
      }
    } catch {}
  }, [code]);

  async function handleJoin() {
    setError(null);
    if (!code.trim() || !name.trim()) { setError("Enter a code and your name."); return; }
    setBusy(true);

    const { data: sess, error: sErr } = await supabase
      .from("quiz_session")
      .select("id, code")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();
    if (sErr || !sess) { setError("Session not found."); setBusy(false); return; }

    const student_id = getOrCreateStudentId();
    const identity: StudentIdentity = {
      student_id,
      student_name: name.trim(),
      student_avatar: avatar,
      session_id: sess.id,
      session_code: sess.code,
    };

    // Write a join row (question_index=-1) so teacher sees participant
    const { error: insErr } = await supabase.from("quiz_responses").upsert({
      session_id: sess.id,
      student_id,
      student_name: identity.student_name,
      student_avatar: identity.student_avatar,
      question_index: -1,
      answer: "join",
      is_correct: false,
      response_ms: 0,
      points: 0,
    }, { onConflict: "session_id,student_id,question_index" });
    if (insErr) { setError("Couldn't join session."); setBusy(false); return; }

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(identity)); } catch {}
    onJoined(identity);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Live Quiz</h1>
          <p className="text-muted-foreground">Join your class</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Session code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name"
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label>Pick an avatar</Label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAvatar(a.key)}
                className={cn(
                  "aspect-square rounded-xl border-2 p-1 flex items-center justify-center bg-card transition-all",
                  avatar === a.key ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-muted-foreground",
                )}
              >
                <img src={a.src} alt={a.label} className="max-w-full max-h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-sm text-destructive text-center">{error}</div>}

        <Button onClick={handleJoin} disabled={busy} className="w-full" size="lg">
          {busy ? "Joining…" : "Join"}
        </Button>
      </div>
    </div>
  );
}
