import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, respondent_id, responses } = await req.json();

    if (!token || !responses || !respondent_id) {
      return new Response(
        JSON.stringify({ error: 'Token, responses, and respondent_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ 토큰 검증 (token_created_at 기반)
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('id, classroom_id, token_created_at')
      .eq('token', token)
      .single();

    if (surveyError || !surveyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 토큰 만료 시간 계산 (예: 30분)
    const createdAt = new Date(surveyData.token_created_at);
    const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
    if (new Date() > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ 응답자 classroom 검증
    const { data: respondentData, error: respondentError } = await supabase
      .from('students')
      .select('classroom_id')
      .eq('id', respondent_id)
      .single();

    if (respondentError || !respondentData || respondentData.classroom_id !== surveyData.classroom_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid respondent for this survey' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ 응답 저장
    const responsesToInsert = responses.map((response: any) => ({
      survey_id: surveyData.id,
      respondent_id,
      survey_question_id: response.survey_question_id,
    }));
    
    const { data: savedResponses, error: responseError } = await supabase
      .from('relationship_responses')
      .insert(responsesToInsert)
      .select('id');

    if (responseError) {
      console.error('Error saving responses:', responseError);
      return new Response(
        JSON.stringify({ error: 'Failed to save responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ 대상자 저장
    const allTargetsToSave: any[] = [];
    responses.forEach((response: any, responseIndex: number) => {
      if (response.target_ids && Array.isArray(response.target_ids)) {
        response.target_ids.forEach((target_id: string) => {
          allTargetsToSave.push({
            response_id: savedResponses[responseIndex].id,
            target_id,
            extra_value: 0
          });
        });
      }
    });

    if (allTargetsToSave.length > 0) {
      const { error: targetError } = await supabase
        .from('relationship_response_targets')
        .insert(allTargetsToSave);

      if (targetError) {
        console.error('Error saving targets:', targetError);
        return new Response(
          JSON.stringify({ error: 'Failed to save response targets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
