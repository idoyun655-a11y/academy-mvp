import React, { useState } from 'react';
import { useLocation } from 'wouter';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/CommonComponents';
import { theme } from '@/styles/design-system';
import { trpc } from '@/lib/trpc';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordMutation.mutateAsync({ email });
      setSuccessMessage(result.message);
      if (result.tempPassword) {
        setTempPassword(result.tempPassword);
      }
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || '비밀번호 재설정에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="ET" className="h-10 w-10" />
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
            비밀번호 찾기
          </h2>
        </div>

        {/* 폼 */}
        <Card
          variant="elevated"
          padding="lg"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary,
          }}
          className="border"
        >
          {successMessage ? (
            <div className="text-center">
              <div
                className="p-4 rounded-lg mb-4 border"
                style={{
                  backgroundColor: theme.colors.background.tertiary,
                  borderColor: theme.colors.border.primary,
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.colors.text.primary }}
                >
                  {successMessage}
                </p>
                {tempPassword && (
                  <p
                    className="text-sm mt-2 font-bold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    임시 비밀번호: {tempPassword}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                로그인 페이지로 이동
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이메일 입력 */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                />
                {errors.email && (
                  <p
                className="text-sm mt-1"
                style={{ color: theme.colors.text.secondary }}
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 에러 메시지 */}
              {errors.submit && (
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.background.tertiary,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* 제출 버튼 */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? '처리 중...' : '비밀번호 재설정'}
              </Button>

              {/* 로그인 링크 */}
              <div className="text-center">
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  계정이 있으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => setLocation('/login')}
                    className="font-medium hover:underline"
                    style={{ color: theme.colors.text.primary }}
                  >
                    로그인
                  </button>
                </p>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
