-- questions 테이블에 RLS 활성화 및 정책 설정
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to questions" 
ON public.questions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- relationship_responses 테이블에 RLS 활성화 및 정책 설정  
ALTER TABLE public.relationship_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to relationship_responses" 
ON public.relationship_responses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 기본 질문 데이터 삽입
INSERT INTO public.questions (question_text, polarity) VALUES
('우리반에서 가장 친한 친구는?', 'positive'),
('함께 놀고 싶은 친구는?', 'positive'),
('도움이 필요할 때 찾고 싶은 친구는?', 'positive'),
('가장 믿을 만한 친구는?', 'positive'),
('팀 프로젝트를 함께 하고 싶은 친구는?', 'positive');