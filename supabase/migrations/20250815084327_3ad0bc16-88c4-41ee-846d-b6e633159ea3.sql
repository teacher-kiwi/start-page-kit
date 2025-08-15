-- Fix profiles table RLS policy to allow INSERT operations
-- Currently users cannot insert into profiles table due to missing INSERT policy

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());