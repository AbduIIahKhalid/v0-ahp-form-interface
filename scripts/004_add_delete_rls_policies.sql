-- Add RLS policies for DELETE operations to allow authenticated admin users to delete records
-- Experts table - allow authenticated users to delete (for admin dashboard)
CREATE POLICY "experts_delete_authenticated" ON public.experts
  FOR DELETE
  TO authenticated
  USING (true);

-- AHP submissions table - allow authenticated users to delete (for admin dashboard)
CREATE POLICY "ahp_submissions_delete_authenticated" ON public.ahp_submissions
  FOR DELETE
  TO authenticated
  USING (true);