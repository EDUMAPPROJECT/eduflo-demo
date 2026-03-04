import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { Lock, ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/errorLogger";
import { supabase } from "@/integrations/supabase/client";

/** redirect 쿼리에서 안전한 경로만 반환 (오픈 리다이렉트 방지) */
function getSafeRedirect(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get("redirect");
  if (!redirect || typeof redirect !== "string") return null;
  const path = redirect.trim();
  if (path === "" || !path.startsWith("/") || path.includes("//")) return null;
  return path;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectAfterAuth = getSafeRedirect(searchParams);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        toast.error(error.message || "로그인에 실패했습니다");
        return;
      }
      if (data?.session?.user?.id) {
        await navigateByDatabaseRole(data.session.user.id);
        toast.success("로그인되었습니다");
      }
    } catch (error) {
      logError("email-login", error);
      toast.error("로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const navigateByDatabaseRole = async (userId: string) => {
    if (redirectAfterAuth) {
      navigate(redirectAfterAuth, { replace: true });
      return;
    }
    const fallback = "/p/home";
    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role, is_super_admin")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logError("role-fetch", error);
        navigate(fallback);
        return;
      }
      if (!roleData) {
        navigate(fallback);
        return;
      }
      if (roleData.is_super_admin) {
        navigate("/super/home");
      } else if (roleData.role === "admin") {
        navigate("/admin/home");
      } else if (roleData.role === "student") {
        navigate("/s/home");
      } else {
        navigate("/p/home");
      }
    } catch (error) {
      logError("navigate-by-role", error);
      navigate(fallback);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 animate-float">
          <Logo size="lg" />
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          <h2 className="text-xl font-semibold text-foreground text-center mb-2">
            로그인
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            체험 계정으로 로그인하세요
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>

            <Button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full h-14 text-base"
              size="xl"
            >
              {loading ? "로그인 중..." : "로그인"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
