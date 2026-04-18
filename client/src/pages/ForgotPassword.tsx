import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/common/Button";
import { Card } from "@/components/common/CommonComponents";
import { theme } from "@/styles/design-system";
import { trpc } from "@/lib/trpc";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!email) {
      nextErrors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    if (!password) {
      nextErrors.password = "새 비밀번호를 입력해주세요.";
    } else if (password.length < 8) {
      nextErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (password !== passwordConfirm) {
      nextErrors.passwordConfirm = "비밀번호 확인이 일치하지 않습니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await resetPasswordMutation.mutateAsync({
        email,
        password,
        passwordConfirm,
      });
      setSuccessMessage(result.message);
      setErrors({});
    } catch (error: any) {
      setErrors({
        submit: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.svg" alt="ET" className="h-10 w-10" />
            <h1
              className="text-3xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >
              ET영어전문학원
            </h1>
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            비밀번호 재설정
          </h2>
          <p
            className="text-sm mt-2"
            style={{ color: theme.colors.text.tertiary }}
          >
            등록된 이메일로 계정을 찾은 뒤 새 비밀번호를 바로 설정합니다.
          </p>
        </div>

        <Card
          variant="elevated"
          padding="lg"
          className="border"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary,
          }}
        >
          {successMessage ? (
            <div className="space-y-4">
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: theme.colors.background.tertiary,
                  borderColor: theme.colors.border.primary,
                }}
              >
                <p style={{ color: theme.colors.text.primary }}>{successMessage}</p>
              </div>
              <Button className="w-full" onClick={() => setLocation("/login")}>
                로그인으로 이동
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="etacademy@gmail.com"
                  className="w-full rounded-lg border px-4 py-3 outline-none"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
                {errors.email ? (
                  <p className="text-sm mt-1" style={{ color: theme.colors.status.error }}>
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  새 비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상 입력"
                  className="w-full rounded-lg border px-4 py-3 outline-none"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
                {errors.password ? (
                  <p className="text-sm mt-1" style={{ color: theme.colors.status.error }}>
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  새 비밀번호 확인
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="같은 비밀번호를 다시 입력"
                  className="w-full rounded-lg border px-4 py-3 outline-none"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
                {errors.passwordConfirm ? (
                  <p className="text-sm mt-1" style={{ color: theme.colors.status.error }}>
                    {errors.passwordConfirm}
                  </p>
                ) : null}
              </div>

              {errors.submit ? (
                <div
                  className="rounded-lg border p-3"
                  style={{
                    backgroundColor: theme.colors.background.tertiary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.status.error,
                  }}
                >
                  {errors.submit}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "변경 중..." : "비밀번호 변경"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-sm hover:underline"
                  style={{ color: theme.colors.text.secondary }}
                >
                  로그인으로 돌아가기
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
