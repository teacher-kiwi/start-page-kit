-- surveys 테이블에 token 컬럼 추가
ALTER TABLE public.surveys 
ADD COLUMN token TEXT;

-- token 유효성 검사를 위한 함수 생성
CREATE OR REPLACE FUNCTION public.is_token_valid(survey_token TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE token = survey_token 
    AND created_at > NOW() - INTERVAL '30 minutes'
  );
$$;

-- token으로 survey ID를 가져오는 함수
CREATE OR REPLACE FUNCTION public.get_survey_id_by_token(survey_token TEXT)
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.surveys 
  WHERE token = survey_token 
  AND created_at > NOW() - INTERVAL '30 minutes'
  LIMIT 1;
$$;

-- 기존 공개 정책들을 삭제
DROP POLICY IF EXISTS "Public can view classrooms for surveys" ON public.classrooms;
DROP POLICY IF EXISTS "Public can view students for surveys" ON public.students;
DROP POLICY IF EXISTS "Public can view questions for surveys" ON public.questions;
DROP POLICY IF EXISTS "Public can view survey questions for surveys" ON public.survey_questions;
DROP POLICY IF EXISTS "Public can view surveys for surveys" ON public.surveys;
DROP POLICY IF EXISTS "Anonymous users can insert responses" ON public.relationship_responses;
DROP POLICY IF EXISTS "Anonymous users can insert response targets" ON public.relationship_response_targets;

-- 토큰 기반 읽기 정책들
CREATE POLICY "Token-based access to classrooms"
ON public.classrooms 
FOR SELECT 
TO anon, authenticated
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      ((user_id = auth.uid()) OR (teacher_name = get_current_teacher_name()))
    ELSE 
      id IN (
        SELECT classroom_id FROM public.surveys 
        WHERE token IS NOT NULL 
        AND created_at > NOW() - INTERVAL '30 minutes'
      )
  END
);

CREATE POLICY "Token-based access to students"
ON public.students 
FOR SELECT 
TO anon, authenticated
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      classroom_id IN (
        SELECT classrooms.id FROM classrooms 
        WHERE ((classrooms.user_id = auth.uid()) OR (classrooms.teacher_name = get_current_teacher_name()))
      )
    ELSE 
      classroom_id IN (
        SELECT classroom_id FROM public.surveys 
        WHERE token IS NOT NULL 
        AND created_at > NOW() - INTERVAL '30 minutes'
      )
  END
);

CREATE POLICY "Token-based access to questions"
ON public.questions 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Token-based access to survey_questions"
ON public.survey_questions 
FOR SELECT 
TO anon, authenticated
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      survey_id IN (
        SELECT s.id FROM surveys s 
        WHERE s.classroom_id IN (
          SELECT classrooms.id FROM classrooms 
          WHERE ((classrooms.user_id = auth.uid()) OR (classrooms.teacher_name = get_current_teacher_name()))
        )
      )
    ELSE 
      survey_id IN (
        SELECT id FROM public.surveys 
        WHERE token IS NOT NULL 
        AND created_at > NOW() - INTERVAL '30 minutes'
      )
  END
);

CREATE POLICY "Token-based access to surveys"
ON public.surveys 
FOR SELECT 
TO anon, authenticated
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      classroom_id IN (
        SELECT classrooms.id FROM classrooms 
        WHERE ((classrooms.user_id = auth.uid()) OR (classrooms.teacher_name = get_current_teacher_name()))
      )
    ELSE 
      token IS NOT NULL AND created_at > NOW() - INTERVAL '30 minutes'
  END
);

-- 토큰 기반 쓰기 정책들 (응답 저장)
CREATE POLICY "Token-based insert to relationship_responses"
ON public.relationship_responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      respondent_id IN (
        SELECT s.id FROM students s 
        WHERE s.classroom_id IN (
          SELECT classrooms.id FROM classrooms 
          WHERE ((classrooms.user_id = auth.uid()) OR (classrooms.teacher_name = get_current_teacher_name()))
        )
      )
    ELSE 
      survey_id IN (
        SELECT id FROM public.surveys 
        WHERE token IS NOT NULL 
        AND created_at > NOW() - INTERVAL '30 minutes'
      )
  END
);

CREATE POLICY "Token-based insert to relationship_response_targets"
ON public.relationship_response_targets 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      target_id IN (
        SELECT s.id FROM students s 
        WHERE s.classroom_id IN (
          SELECT classrooms.id FROM classrooms 
          WHERE ((classrooms.user_id = auth.uid()) OR (classrooms.teacher_name = get_current_teacher_name()))
        )
      )
    ELSE 
      response_id IN (
        SELECT rr.id FROM relationship_responses rr 
        JOIN surveys sv ON rr.survey_id = sv.id
        WHERE sv.token IS NOT NULL 
        AND sv.created_at > NOW() - INTERVAL '30 minutes'
      )
  END
);