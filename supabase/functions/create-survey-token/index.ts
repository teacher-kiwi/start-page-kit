// supabase/functions/create-survey-token/index.ts
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

    const { surveyId } = await req.json();
    if (!surveyId) {
      return new Response(
        JSON.stringify({ error: 'Survey ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 현재 토큰과 생성시간 확인
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('token, token_created_at')
      .eq('id', surveyId)
      .single();

    if (surveyError) {
      console.error('Error fetching survey:', surveyError);
      return new Response(
        JSON.stringify({ error: 'Survey not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const THIRTY_MIN = 30 * 60 * 1000;

    // 2. 기존 토큰이 있고, 유효기간(30분) 이내라면 그대로 반환
    if (survey?.token && survey?.token_created_at) {
      const createdAt = new Date(survey.token_created_at);
      if (now.getTime() - createdAt.getTime() < THIRTY_MIN) {
        return new Response(
          JSON.stringify({ token: survey.token }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. 새 토큰 발급
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 32);

    const { data, error } = await supabase
      .from('surveys')
      .update({ token, token_created_at: now.toISOString() })
      .eq('id', surveyId)
      .select('token')
      .single();

    if (error) {
      console.error('Error updating survey with token:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ token: data.token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-survey-token function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
