// 개발용 더미 세션 관리 유틸리티

export interface DummyUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    name: string;
  };
}

// 더미 세션 확인
export const getDummySession = (): DummyUser | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const dummySession = localStorage.getItem('dummy_session');
    return dummySession ? JSON.parse(dummySession) : null;
  } catch {
    return null;
  }
};

// 더미 세션 삭제 (로그아웃용)
export const clearDummySession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dummy_session');
  }
};

// 현재 사용자 정보 가져오기 (실제 또는 더미)
export const getCurrentUser = async () => {
  // 먼저 더미 세션 확인
  const dummyUser = getDummySession();
  if (dummyUser) {
    return { user: dummyUser, isDemo: true };
  }

  // 실제 supabase 세션 확인
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();
  
  return { user: session?.user || null, isDemo: false };
};