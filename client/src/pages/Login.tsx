import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Card, Input } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import {
  AUTH_TOKEN_STORAGE_KEY,
  setBrowserSessionCookie,
} from "@/lib/session";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });

      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(result.user));
      setBrowserSessionCookie(result.token);
      utils.auth.me.setData(undefined, result.user);
      void utils.auth.me.invalidate();

      toast.success("로그인되었습니다.");

      if (result.user.role === "admin" || result.user.role === "teacher") {
        setLocation("/admin");
      } else if (result.user.role === "parent") {
        setLocation("/parent");
      } else {
        setLocation("/student");
      }
    } catch (error: any) {
      toast.error(error.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-5">
            <img src="/logo.png" alt="ET" className="h-12 w-12 rounded-xl object-cover" />
            <div className="text-left">
              <p
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: theme.colors.accent.secondary }}
              >
                ET English Academy
              </p>
              <h1
                className="text-3xl font-bold"
                style={{ color: theme.colors.text.primary }}
              >
                학원 운영 시스템
              </h1>
            </div>
          </div>
          <p
            className="text-sm"
            style={{ color: theme.colors.text.tertiary }}
          >
            학생, 부모, 관리자 페이지가 같은 데이터로 동기화됩니다.
          </p>
        </div>

        <div
          className="mb-5 rounded-[28px] border p-5 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(244,247,255,0.95) 100%)",
            borderColor: "rgba(148, 163, 184, 0.22)",
            boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#6366f1" }}
          >
            제작자 회사명
          </p>
          <img
            src="/don-studio.png"
            alt="D:ON Studio"
            className="mx-auto mt-4 w-full max-w-[260px] object-contain"
          />
          <p
            className="mt-3 text-xl font-bold"
            style={{ color: "#111827" }}
          >
            D:ON Studio
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: "#475569" }}
          >
            Design · Branding · Product Build
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                이메일
              </label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="etacademy@gmail.com"
                size="md"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                비밀번호
              </label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                size="md"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isFullWidth
              isLoading={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </Card>

        <div
          className="text-center text-sm mt-6 space-y-2"
          style={{ color: theme.colors.text.tertiary }}
        >
          <div>
            계정이 없나요?{" "}
            <button
              onClick={() => setLocation("/signup")}
              className="font-medium hover:opacity-80"
              style={{ color: theme.colors.accent.primary }}
            >
              회원가입
            </button>
          </div>
          <div>
            비밀번호를 재설정하시나요?{" "}
            <button
              onClick={() => setLocation("/forgot-password")}
              className="font-medium hover:opacity-80"
              style={{ color: theme.colors.accent.primary }}
            >
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
