-- Fix infinite recursion in RLS policies by simplifying them

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_current_teacher_name();

-- Recreate RLS policies without circular references
DROP POLICY IF EXISTS "Teachers can view own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can insert own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can update own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can delete own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Token-based access to classrooms" ON public.classrooms;

-- Simplified classrooms policies
CREATE POLICY "Teachers can view own classrooms" 
ON public.classrooms 
FOR SELECT 
USING (user_id = auth.uid());

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

-- Token-based access for classrooms (simplified)
CREATE POLICY "Token-based access to classrooms" 
ON public.classrooms 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (user_id = auth.uid())
    ELSE (id IN (
      SELECT classroom_id FROM surveys 
      WHERE token IS NOT NULL 
      AND created_at > now() - interval '30 minutes'
    ))
  END
);

-- Update other tables' policies to remove get_current_teacher_name() references
DROP POLICY IF EXISTS "Teachers can view students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can update students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can delete students in their classrooms" ON public.students;

CREATE POLICY "Teachers can view students in their classrooms" 
ON public.students 
FOR SELECT 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Teachers can insert students in their classrooms" 
ON public.students 
FOR INSERT 
WITH CHECK (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Teachers can update students in their classrooms" 
ON public.students 
FOR UPDATE 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
))
WITH CHECK (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Teachers can delete students in their classrooms" 
ON public.students 
FOR DELETE 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

-- Update surveys policies
DROP POLICY IF EXISTS "Teachers can view own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Teachers can insert own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Teachers can update own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Teachers can delete own surveys" ON public.surveys;

CREATE POLICY "Teachers can view own surveys" 
ON public.surveys 
FOR SELECT 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Teachers can insert own surveys" 
ON public.surveys 
FOR INSERT 
WITH CHECK (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Teachers can update own surveys" 
ON public.surveys 
FOR UPDATE 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Teachers can delete own surveys" 
ON public.surveys 
FOR DELETE 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

-- Update survey_questions policies
DROP POLICY IF EXISTS "Teachers can view own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Teachers can insert own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Teachers can update own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Teachers can delete own survey questions" ON public.survey_questions;

CREATE POLICY "Teachers can view own survey questions" 
ON public.survey_questions 
FOR SELECT 
USING (survey_id IN (
  SELECT s.id FROM surveys s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can insert own survey questions" 
ON public.survey_questions 
FOR INSERT 
WITH CHECK (survey_id IN (
  SELECT s.id FROM surveys s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can update own survey questions" 
ON public.survey_questions 
FOR UPDATE 
USING (survey_id IN (
  SELECT s.id FROM surveys s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can delete own survey questions" 
ON public.survey_questions 
FOR DELETE 
USING (survey_id IN (
  SELECT s.id FROM surveys s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

-- Update relationship_responses policies
DROP POLICY IF EXISTS "Teachers can view responses for their students" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can insert responses for their students" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can update responses for their students" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can delete responses for their students" ON public.relationship_responses;

CREATE POLICY "Teachers can view responses for their students" 
ON public.relationship_responses 
FOR SELECT 
USING (respondent_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can insert responses for their students" 
ON public.relationship_responses 
FOR INSERT 
WITH CHECK (respondent_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can update responses for their students" 
ON public.relationship_responses 
FOR UPDATE 
USING (respondent_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can delete responses for their students" 
ON public.relationship_responses 
FOR DELETE 
USING (respondent_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

-- Update relationship_response_targets policies
DROP POLICY IF EXISTS "Teachers can view response targets for their students" ON public.relationship_response_targets;
DROP POLICY IF EXISTS "Teachers can insert response targets for their students" ON public.relationship_response_targets;
DROP POLICY IF EXISTS "Teachers can update response targets for their students" ON public.relationship_response_targets;
DROP POLICY IF EXISTS "Teachers can delete response targets for their students" ON public.relationship_response_targets;

CREATE POLICY "Teachers can view response targets for their students" 
ON public.relationship_response_targets 
FOR SELECT 
USING (target_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can insert response targets for their students" 
ON public.relationship_response_targets 
FOR INSERT 
WITH CHECK (target_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can update response targets for their students" 
ON public.relationship_response_targets 
FOR UPDATE 
USING (target_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));

CREATE POLICY "Teachers can delete response targets for their students" 
ON public.relationship_response_targets 
FOR DELETE 
USING (target_id IN (
  SELECT s.id FROM students s
  JOIN classrooms c ON s.classroom_id = c.id
  WHERE c.user_id = auth.uid()
));