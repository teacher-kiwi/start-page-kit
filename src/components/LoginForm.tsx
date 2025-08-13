import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KoreanInput } from "@/components/ui/korean-input";
import { Card } from "@/components/ui/card";
import { User, Lock } from "lucide-react";

export const LoginForm = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      // 아이디를 teacher_name으로 로컬스토리지에 저장
      localStorage.setItem("teacher_name", userId.trim());
      console.log("User logged in as:", userId.trim());
      console.log("Navigating to dashboard...");

      // 다음 페이지로 이동
      navigate("/dashboard");
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Service Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-8">우리끼리 속마음</h1>
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-8">
          <img src="/lovable-uploads/5b1b0384-19e2-45bb-9743-a9664c34f560.png" alt="우리끼리 속마음 마스코트" className="w-24 h-24 object-contain" />
        </div>

        {/* Login Form */}
        <Card className="p-8 shadow-lg border-0">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <KoreanInput type="text" placeholder="아이디" value={userId} onChange={e => setUserId(e.target.value)} icon={<User className="h-4 w-4" />} required />
              
              <KoreanInput type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} icon={<Lock className="h-4 w-4" />} required />
            </div>

            <Button type="submit" variant="korean" className="w-full">
              로그인
            </Button>
          </form>

          {/* Sign up link */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <button type="button" className="text-primary hover:underline font-medium" onClick={() => console.log("Navigate to signup")}>
                회원가입
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>;
};