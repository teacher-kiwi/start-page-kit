import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First verify the token and get survey info with classroom details
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        id, 
        classroom_id, 
        created_at,
        classrooms!inner (
          id,
          school_name,
          grade,
          class_number,
          teacher_name
        )
      `)
      .eq('token', token)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .single();

    if (surveyError || !surveyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get students for the classroom
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, student_number, photo_url')
      .eq('classroom_id', surveyData.classroom_id)
      .order('student_number');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch students' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        students: studentsData,
        surveyId: surveyData.id,
        classroom: surveyData.classrooms
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-student-list function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});