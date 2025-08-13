-- Add student_number column to students table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'student_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.students ADD COLUMN student_number INTEGER;
        
        -- Add index for better performance when querying by student number
        CREATE INDEX IF NOT EXISTS idx_students_student_number ON public.students(student_number);
        
        -- Add a comment to the column
        COMMENT ON COLUMN public.students.student_number IS 'Student number within the classroom';
    END IF;
END $$;