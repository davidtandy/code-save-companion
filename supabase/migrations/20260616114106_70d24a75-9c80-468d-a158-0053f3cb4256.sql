
CREATE TABLE public.quiz_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  game_mode text NOT NULL,
  phase text NOT NULL DEFAULT 'lobby',
  current_question_index int NOT NULL DEFAULT 0,
  question_started_at timestamptz,
  timer_max_seconds int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.quiz_session TO anon, authenticated;
GRANT ALL ON public.quiz_session TO service_role;

ALTER TABLE public.quiz_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read sessions" ON public.quiz_session FOR SELECT USING (true);
CREATE POLICY "anyone can create sessions" ON public.quiz_session FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update sessions" ON public.quiz_session FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_session(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  student_avatar text NOT NULL,
  question_index int NOT NULL,
  answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  response_ms int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id, question_index)
);

GRANT SELECT, INSERT ON public.quiz_responses TO anon, authenticated;
GRANT ALL ON public.quiz_responses TO service_role;

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read responses" ON public.quiz_responses FOR SELECT USING (true);
CREATE POLICY "anyone can insert responses" ON public.quiz_responses FOR INSERT WITH CHECK (true);

CREATE INDEX quiz_responses_session_idx ON public.quiz_responses(session_id, question_index);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_quiz_session_updated_at
BEFORE UPDATE ON public.quiz_session
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_session;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;
ALTER TABLE public.quiz_session REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_responses REPLICA IDENTITY FULL;
