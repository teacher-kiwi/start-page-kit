-- RLS 활성화 및 기본 정책 설정

-- classrooms 테이블에 RLS 활성화
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- students 테이블에 RLS 활성화  
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- documents 테이블에 RLS 활성화
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- classrooms 테이블 정책 (모든 사용자가 접근 가능)
CREATE POLICY "Allow all access to classrooms" 
ON public.classrooms 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- students 테이블 정책 (모든 사용자가 접근 가능)
CREATE POLICY "Allow all access to students" 
ON public.students 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- documents 테이블 정책 (모든 사용자가 접근 가능)
CREATE POLICY "Allow all access to documents" 
ON public.documents 
FOR ALL 
USING (true) 
WITH CHECK (true);