-- Fix infinite recursion in classrooms RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Teachers can view own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can insert own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can update own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can delete own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Token-based access to classrooms" ON public.classrooms;

-- Create security definer function to check classroom ownership
CREATE OR REPLACE FUNCTION public.user_owns_classroom(classroom_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = classroom_id AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check token-based access
CREATE OR REPLACE FUNCTION public.is_classroom_accessible_by_token(classroom_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE classroom_id = $1 
    AND token IS NOT NULL 
    AND created_at > NOW() - INTERVAL '30 minutes'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate RLS policies using security definer functions
CREATE POLICY "Teachers can view own classrooms" 
ON public.classrooms 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
    ELSE public.is_classroom_accessible_by_token(id)
  END
);

CREATE POLICY "Teachers can insert own classrooms" 
ON public.classrooms 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can update own classrooms" 
ON public.classrooms 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can delete own classrooms" 
ON public.classrooms 
FOR DELETE 
USING (user_id = auth.uid());