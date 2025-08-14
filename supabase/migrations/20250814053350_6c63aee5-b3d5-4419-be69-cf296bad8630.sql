-- 기존 공개 정책들을 삭제하고 다시 생성
DROP POLICY IF EXISTS "Public can insert responses" ON public.relationship_responses;
DROP POLICY IF EXISTS "Public can insert response targets" ON public.relationship_response_targets;

-- anon 사용자(로그아웃 상태)가 응답을 저장할 수 있도록 정책 추가
CREATE POLICY "Anonymous users can insert responses"
ON public.relationship_responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anonymous users can insert response targets"
ON public.relationship_response_targets 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);