-- 스토리지 버킷에 파일 크기 제한 정책 추가 (1MB = 1048576 bytes)
CREATE POLICY "파일 크기 제한 1MB" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'images' AND 
  (metadata->>'size')::bigint <= 1048576
);

-- 기존 파일 업데이트시에도 크기 제한 적용
CREATE POLICY "파일 업데이트 크기 제한 1MB" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'images' AND 
  (metadata->>'size')::bigint <= 1048576
);