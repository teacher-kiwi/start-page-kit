-- Fix security vulnerability in documents table
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Allow all access to documents" ON public.documents;

-- Create restrictive policies for authenticated users only
CREATE POLICY "Authenticated users can view documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert documents" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents" 
ON public.documents 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents" 
ON public.documents 
FOR DELETE 
TO authenticated
USING (true);