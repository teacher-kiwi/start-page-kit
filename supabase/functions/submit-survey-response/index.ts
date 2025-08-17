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

    const { token, responses, respondentId } = await req.json();

    if (!token || !responses || !respondentId) {
      return new Response(
        JSON.stringify({ error: 'Token, responses, and respondentId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token and get survey info
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('id, classroom_id')
      .eq('token', token)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .single();

    if (surveyError || !surveyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify respondent belongs to the same classroom
    const { data: respondentData, error: respondentError } = await supabase
      .from('students')
      .select('classroom_id')
      .eq('id', respondentId)
      .single();

    if (respondentError || !respondentData || respondentData.classroom_id !== surveyData.classroom_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid respondent for this survey' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save responses
    const responsesToSave = responses.map((response: any) => ({
      survey_id: surveyData.id,
      survey_question_id: null, // Using direct questions for now
      respondent_id: respondentId
    }));

    const { data: savedResponses, error: responseError } = await supabase
      .from('relationship_responses')
      .insert(responsesToSave)
      .select('id');

    if (responseError) {
      console.error('Error saving responses:', responseError);
      return new Response(
        JSON.stringify({ error: 'Failed to save responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save response targets
    const targetsToSave = responses.map((response: any, index: number) => ({
      response_id: savedResponses[index].id,
      target_id: response.target_id,
      extra_value: 0
    }));

    const { error: targetError } = await supabase
      .from('relationship_response_targets')
      .insert(targetsToSave);

    if (targetError) {
      console.error('Error saving targets:', targetError);
      return new Response(
        JSON.stringify({ error: 'Failed to save response targets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-survey-response function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});