-- Enable RLS on tables
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ahp_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "experts_insert_anyone" ON public.experts;
DROP POLICY IF EXISTS "experts_select_authenticated" ON public.experts;
DROP POLICY IF EXISTS "experts_delete_authenticated" ON public.experts;
DROP POLICY IF EXISTS "ahp_submissions_insert_anyone" ON public.ahp_submissions;
DROP POLICY IF EXISTS "ahp_submissions_select_authenticated" ON public.ahp_submissions;
DROP POLICY IF EXISTS "ahp_submissions_delete_authenticated" ON public.ahp_submissions;

-- Experts table policies
CREATE POLICY "experts_insert_anyone" ON public.experts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "experts_select_authenticated" ON public.experts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "experts_delete_authenticated" ON public.experts
  FOR DELETE
  TO authenticated
  USING (true);

-- AHP submissions table policies
CREATE POLICY "ahp_submissions_insert_anyone" ON public.ahp_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "ahp_submissions_select_authenticated" ON public.ahp_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ahp_submissions_delete_authenticated" ON public.ahp_submissions
  FOR DELETE
  TO authenticated
  USING (true);