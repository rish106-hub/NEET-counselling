-- Enable Row Level Security on all public tables.
-- All server-side writes use the service_role key which bypasses RLS.
-- These policies grant anon SELECT on public reference data only.

ALTER TABLE public.colleges              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutoffs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.output_cache          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_rank_brackets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neet_year_stats       ENABLE ROW LEVEL SECURITY;

-- Public reference data: read-only for everyone (college info is not sensitive).
CREATE POLICY "public_read_colleges"              ON public.colleges            FOR SELECT USING (true);
CREATE POLICY "public_read_cutoffs"               ON public.cutoffs             FOR SELECT USING (true);
CREATE POLICY "public_read_deadlines"             ON public.deadlines           FOR SELECT USING (true);
CREATE POLICY "public_read_documents"             ON public.documents           FOR SELECT USING (true);
CREATE POLICY "public_read_score_rank_brackets"   ON public.score_rank_brackets FOR SELECT USING (true);
CREATE POLICY "public_read_neet_year_stats"       ON public.neet_year_stats     FOR SELECT USING (true);

-- output_cache: server-only via service_role — no policy = deny all anon/authenticated.
-- service_role bypasses RLS so the API routes still work.
