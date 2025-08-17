import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔑 토큰 유효성 검증 (token_expires_at 기준)
    const { data: survey, error } = await supabase
      .from("surveys")
      .select(`
        id,
        classroom_id,
        survey_questions(
          id,
          order_num,
          weight,
          questions(id, question_text)
        ),
        classrooms(
          id,
          students(
            id,
            name,
            photo_url,
            student_number
          )
        )
      `)
      .eq("token", token)
      .gte("token_expires_at", new Date().toISOString())
      .single();

    if (error || !survey) {
      console.error("Invalid or expired token:", error);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", code: "TOKEN_EXPIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 설문 문항 정리
    const questions = (survey.survey_questions || []).map((sq: any) => ({
      id: sq.id,
      question_id: sq.questions.id,
      question_text: sq.questions.question_text,
      order_num: sq.order_num,
      weight: sq.weight,
    }));

    // 학생 목록 정리
    const students = (survey.classrooms?.students || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      photo_url: s.photo_url,
      student_number: s.student_number,
    }));

    return new Response(
      JSON.stringify({
        survey_id: survey.id,
        questions,
        students,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in get-survey-data function:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
