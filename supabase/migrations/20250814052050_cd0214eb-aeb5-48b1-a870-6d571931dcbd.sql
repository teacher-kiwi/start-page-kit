-- 학생들이 로그인 없이도 응답을 저장할 수 있도록 공개 쓰기 정책 추가
CREATE POLICY "Public can insert responses"
ON public.relationship_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can insert response targets"
ON public.relationship_response_targets 
FOR INSERT 
WITH CHECK (true);