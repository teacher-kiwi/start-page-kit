// 인증 관련 유틸리티

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();
  
  return { user: session?.user || null };
};