-- Drop function with CASCADE and create IF NOT EXISTS policies
DROP FUNCTION IF EXISTS public.get_current_teacher_name() CASCADE;

-- Drop all existing RLS policies first
DROP POLICY IF EXISTS "Teachers can view own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can insert own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can update own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can delete own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Token-based access to classrooms" ON public.classrooms;

DROP POLICY IF EXISTS "Teachers can view students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can update students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can delete students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Token-based access to students" ON public.students;

DROP POLICY IF EXISTS "Teachers can view own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Teachers can insert own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Teachers can update own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Teachers can delete own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Token-based access to surveys" ON public.surveys;

DROP POLICY IF EXISTS "Teachers can view own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Teachers can insert own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Teachers can update own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Teachers can delete own survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Token-based access to survey_questions" ON public.survey_questions;

-- Now create the simplified policies
-- Classrooms policies (user_id based only)
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
USING (user_id = auth.uid());

CREATE POLICY "Teachers can delete own classrooms" 
ON public.classrooms 
FOR DELETE 
USING (user_id = auth.uid());

-- Token-based access for classrooms (allows public access with valid token)
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

-- Students policies
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
));

CREATE POLICY "Teachers can delete students in their classrooms" 
ON public.students 
FOR DELETE 
USING (classroom_id IN (
  SELECT id FROM classrooms 
  WHERE user_id = auth.uid()
));

-- Token-based access for students
CREATE POLICY "Token-based access to students" 
ON public.students 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (
      classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid()
      )
    )
    ELSE (
      classroom_id IN (
        SELECT classroom_id FROM surveys 
        WHERE token IS NOT NULL 
        AND created_at > now() - interval '30 minutes'
      )
    )
  END
);

-- Surveys policies
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

-- Token-based access for surveys
CREATE POLICY "Token-based access to surveys" 
ON public.surveys 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (
      classroom_id IN (
        SELECT id FROM classrooms 
        WHERE user_id = auth.uid()
      )
    )
    ELSE (
      token IS NOT NULL 
      AND created_at > now() - interval '30 minutes'
    )
  END
);

-- Survey questions policies
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

-- Token-based access for survey questions
CREATE POLICY "Token-based access to survey_questions" 
ON public.survey_questions 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (
      survey_id IN (
        SELECT s.id FROM surveys s
        JOIN classrooms c ON s.classroom_id = c.id
        WHERE c.user_id = auth.uid()
      )
    )
    ELSE (
      survey_id IN (
        SELECT id FROM surveys 
        WHERE token IS NOT NULL 
        AND created_at > now() - interval '30 minutes'
      )
    )
  END
);