-- 학생들이 로그인 없이도 설문 문항에 접근할 수 있도록 공개 읽기 정책 추가
CREATE POLICY "Public can view questions for surveys"
ON public.questions 
FOR SELECT 
USING (true);

-- 설문과 설문 문항도 공개 읽기 가능하도록 정책 추가
CREATE POLICY "Public can view surveys for surveys"
ON public.surveys 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view survey questions for surveys"
ON public.survey_questions 
FOR SELECT 
USING (true);