-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all access to students" ON public.students;

-- Create secure RLS policies for students table
-- Only authenticated users can view students
CREATE POLICY "Authenticated users can view students" 
ON public.students 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can insert students
CREATE POLICY "Authenticated users can insert students" 
ON public.students 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update students
CREATE POLICY "Authenticated users can update students" 
ON public.students 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Only authenticated users can delete students
CREATE POLICY "Authenticated users can delete students" 
ON public.students 
FOR DELETE 
TO authenticated 
USING (true);

-- Update other tables with similar security issues
-- Fix classrooms table
DROP POLICY IF EXISTS "Allow all access to classrooms" ON public.classrooms;

CREATE POLICY "Authenticated users can view classrooms" 
ON public.classrooms 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert classrooms" 
ON public.classrooms 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update classrooms" 
ON public.classrooms 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete classrooms" 
ON public.classrooms 
FOR DELETE 
TO authenticated 
USING (true);

-- Fix questions table  
DROP POLICY IF EXISTS "Allow all access to questions" ON public.questions;

CREATE POLICY "Authenticated users can view questions" 
ON public.questions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert questions" 
ON public.questions 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions" 
ON public.questions 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete questions" 
ON public.questions 
FOR DELETE 
TO authenticated 
USING (true);

-- Fix relationship_responses table
DROP POLICY IF EXISTS "Allow all access to relationship_responses" ON public.relationship_responses;

CREATE POLICY "Authenticated users can view relationship_responses" 
ON public.relationship_responses 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert relationship_responses" 
ON public.relationship_responses 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update relationship_responses" 
ON public.relationship_responses 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete relationship_responses" 
ON public.relationship_responses 
FOR DELETE 
TO authenticated 
USING (true);