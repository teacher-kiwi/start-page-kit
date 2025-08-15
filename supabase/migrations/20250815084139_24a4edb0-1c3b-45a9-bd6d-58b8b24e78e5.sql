-- Drop function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.get_current_teacher_name() CASCADE;

-- Recreate all necessary RLS policies without the problematic function

-- Classrooms policies
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

-- Token-based access for classrooms
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

-- Relationship responses policies
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

-- Token-based insert for relationship responses
CREATE POLICY "Token-based insert to relationship_responses" 
ON public.relationship_responses 
FOR INSERT 
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (
      respondent_id IN (
        SELECT s.id FROM students s
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

-- Relationship response targets policies
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

-- Token-based insert for relationship response targets
CREATE POLICY "Token-based insert to relationship_response_targets" 
ON public.relationship_response_targets 
FOR INSERT 
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (
      target_id IN (
        SELECT s.id FROM students s
        JOIN classrooms c ON s.classroom_id = c.id
        WHERE c.user_id = auth.uid()
      )
    )
    ELSE (
      response_id IN (
        SELECT rr.id FROM relationship_responses rr
        JOIN surveys sv ON rr.survey_id = sv.id
        WHERE sv.token IS NOT NULL 
        AND sv.created_at > now() - interval '30 minutes'
      )
    )
  END
);