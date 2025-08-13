import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const LoginForm = () => {
  const navigate = useNavigate();

  // 테스트를 위해 자동 리다이렉트 비활성화
  /*
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });

    // 기존 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  */

  const handleGoogleLogin = async () => {
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    if (error) {
      console.error("Google 로그인 오류:", error.message);
      alert("구글 로그인 중 오류가 발생했습니다.");
    }
  };

  // 개발용 더미 로그인
  const handleDummyLogin = () => {
    // 더미 사용자 데이터를 localStorage에 저장
    const dummyUser = {
      id: "dummy-user-123",
      email: "test@example.com",
      user_metadata: {
        full_name: "테스트 사용자",
        name: "테스트 사용자"
      }
    };
    
    localStorage.setItem('dummy_session', JSON.stringify(dummyUser));
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Service Title */}
        <div className="text-center">
          <h1 className="text-display font-brand font-bold text-foreground mb-8">우리끼리 속마음</h1>
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-8">
          <img
            src="/lovable-uploads/5b1b0384-19e2-45bb-9743-a9664c34f560.png"
            alt="우리끼리 속마음 마스코트"
            className="w-24 h-24 object-contain"
            loading="lazy"
          />
        </div>

        {/* Google Login Only */}
        <Card className="p-8 shadow-lg border-0">
          <div className="space-y-4">
            <Button type="button" variant="korean" className="w-full" onClick={handleGoogleLogin}>
              Google로 계속하기
            </Button>
            {/* 개발용 더미 로그인 버튼 */}
            <Button type="button" variant="outline" className="w-full" onClick={handleDummyLogin}>
              🛠️ 개발용 로그인 (테스트)
            </Button>
          </div>
          <div className="text-center mt-6 text-sm text-muted-foreground">
            구글 계정으로만 로그인할 수 있어요.
          </div>
        </Card>
      </div>
    </div>
  );
};