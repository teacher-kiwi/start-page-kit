-- 같은 학급 내에서 학생 번호 중복 방지 제약조건 추가
ALTER TABLE students
ADD CONSTRAINT unique_student_number_per_class
UNIQUE (classroom_id, student_number);