-- Create profiles table to link authenticated users to teacher names (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('Asia/Seoul'::text, now()),
  UNIQUE(user_id)
);

-- Enable RLS on profiles (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add user_id column to classrooms to establish ownership (if not exists)
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, teacher_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'preferred_username',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create security definer function to get current user's teacher name
CREATE OR REPLACE FUNCTION public.get_current_teacher_name()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT teacher_name FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Authenticated users can insert classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Authenticated users can update classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Authenticated users can delete classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can view own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can insert own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can update own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can delete own classrooms" ON public.classrooms;

DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can update students in their classrooms" ON public.students;
DROP POLICY IF EXISTS "Teachers can delete students in their classrooms" ON public.students;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view relationship_responses" ON public.relationship_responses;
DROP POLICY IF EXISTS "Authenticated users can insert relationship_responses" ON public.relationship_responses;
DROP POLICY IF EXISTS "Authenticated users can update relationship_responses" ON public.relationship_responses;
DROP POLICY IF EXISTS "Authenticated users can delete relationship_responses" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can view responses for their students" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can insert responses for their students" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can update responses for their students" ON public.relationship_responses;
DROP POLICY IF EXISTS "Teachers can delete responses for their students" ON public.relationship_responses;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create secure RLS policies for classrooms - users can only access their own classrooms
CREATE POLICY "Teachers can view own classrooms"
ON public.classrooms
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  teacher_name = public.get_current_teacher_name()
);

CREATE POLICY "Teachers can insert own classrooms"
ON public.classrooms
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  teacher_name = public.get_current_teacher_name()
);

CREATE POLICY "Teachers can update own classrooms"
ON public.classrooms
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  teacher_name = public.get_current_teacher_name()
)
WITH CHECK (
  user_id = auth.uid() OR
  teacher_name = public.get_current_teacher_name()
);

CREATE POLICY "Teachers can delete own classrooms"
ON public.classrooms
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  teacher_name = public.get_current_teacher_name()
);

-- Create secure RLS policies for students - users can only access students in their classrooms
CREATE POLICY "Teachers can view students in their classrooms"
ON public.students
FOR SELECT
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
  )
);

CREATE POLICY "Teachers can insert students in their classrooms"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
  )
);

CREATE POLICY "Teachers can update students in their classrooms"
ON public.students
FOR UPDATE
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
  )
)
WITH CHECK (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
  )
);

CREATE POLICY "Teachers can delete students in their classrooms"
ON public.students
FOR DELETE
TO authenticated
USING (
  classroom_id IN (
    SELECT id FROM public.classrooms 
    WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
  )
);

-- Create secure RLS policies for relationship_responses - restrict to teacher's students only
CREATE POLICY "Teachers can view responses for their students"
ON public.relationship_responses
FOR SELECT
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  ) AND
  target_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  )
);

CREATE POLICY "Teachers can insert responses for their students"
ON public.relationship_responses
FOR INSERT
TO authenticated
WITH CHECK (
  respondent_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  ) AND
  target_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  )
);

CREATE POLICY "Teachers can update responses for their students"
ON public.relationship_responses
FOR UPDATE
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  ) AND
  target_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  )
)
WITH CHECK (
  respondent_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  ) AND
  target_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  )
);

CREATE POLICY "Teachers can delete responses for their students"
ON public.relationship_responses
FOR DELETE
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  ) AND
  target_id IN (
    SELECT id FROM public.students 
    WHERE classroom_id IN (
      SELECT id FROM public.classrooms 
      WHERE user_id = auth.uid() OR teacher_name = public.get_current_teacher_name()
    )
  )
);