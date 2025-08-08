-- Storage 정책 설정 for images bucket
-- 누구나 이미지를 볼 수 있도록 설정
CREATE POLICY "Public read access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

-- 인증된 사용자가 이미지를 업로드할 수 있도록 설정  
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images');

-- 인증된 사용자가 자신이 업로드한 이미지를 수정할 수 있도록 설정
CREATE POLICY "Authenticated users can update their images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'images');

-- 인증된 사용자가 이미지를 삭제할 수 있도록 설정
CREATE POLICY "Authenticated users can delete images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'images');