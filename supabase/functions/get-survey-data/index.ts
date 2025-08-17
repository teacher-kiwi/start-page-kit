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

    // Verify token and get survey info with classroom data
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        id,
        title,
        classroom_id,
        classrooms!inner(
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
      console.error('Survey verification failed:', surveyError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get students from the classroom
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, photo_url, student_number')
      .eq('classroom_id', surveyData.classroom_id)
      .order('student_number', { ascending: true });

    if (studentsError) {
      console.error('Error loading students:', studentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to load students' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get survey questions with question details
    const { data: questionsData, error: questionsError } = await supabase
      .from('survey_questions')
      .select(`
        order_num,
        questions!inner(
          id,
          question_text
        )
      `)
      .eq('survey_id', surveyData.id)
      .order('order_num', { ascending: true });

    if (questionsError) {
      console.error('Error loading questions:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to load questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the response
    const response = {
      surveyId: surveyData.id,
      classroom: {
        id: surveyData.classrooms.id,
        school_name: surveyData.classrooms.school_name,
        grade: surveyData.classrooms.grade,
        class_number: surveyData.classrooms.class_number,
        teacher_name: surveyData.classrooms.teacher_name
      },
      students: studentsData || [],
      questions: questionsData?.map(sq => ({
        id: sq.id,
        question_text: sq.questions.question_text
      })) || []
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-survey-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});