-- 학생들이 로그인 없이도 설문에 접근할 수 있도록 공개 읽기 정책 추가
CREATE POLICY "Public can view classrooms for surveys" 
ON public.classrooms 
FOR SELECT 
USING (true);

-- 학생들이 로그인 없이도 학생 목록을 볼 수 있도록 공개 읽기 정책 추가  
CREATE POLICY "Public can view students for surveys"
ON public.students 
FOR SELECT 
USING (true);