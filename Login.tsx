import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { theme } from '@/styles/design-system';
import { Card, Badge, Input } from '@/components/common/CommonComponents';
import Button from '@/components/common/Button';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('ETenglishacademy@gmail.com');
  const [password, setPassword] = useState('ETenglish');
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      // 토큰 저장
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      
      // auth.me 캐시 무효화 및 재조회
      await utils.auth.me.invalidate();
      
      toast.success('로그인 성공!');
      
      // 사용자 정보를 localStorage에 저장
      localStorage.setItem('manus-runtime-user-info', JSON.stringify(result.user));
      
      // 역할별로 페이지 이동
      setTimeout(() => {
        if (result.user.role === 'admin' || result.user.role === 'teacher') {
          setLocation('/admin');
        } else {
          setLocation('/student');
        }
      }, 500);
    } catch (error: any) {
      toast.error(error.message || '로그인 실패');
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
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div
            className="text-4xl font-bold mb-2"
            style={{ color: theme.colors.accent.primary }}
          >
            📚
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: theme.colors.text.primary }}
          >
            학원 관리 시스템
          </h1>
          <p
            className="text-sm"
            style={{ color: theme.colors.text.tertiary }}
          >
            프리미엄 학원 운영 통합 플랫폼
          </p>
        </div>

        {/* 로그인 카드 */}
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 이메일 입력 */}
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ETenglishacademy@gmail.com"
                size="md"
                leftIcon="✉️"
              />
            </div>

            {/* 비밀번호 입력 */}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                size="md"
                leftIcon="🔒"
              />
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isFullWidth
              isLoading={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </Card>

        {/* 테스트 계정 안내 */}
        <Card
          variant="glass"
          padding="md"
          className="mt-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <h3
                className="font-semibold text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                테스트 계정
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { role: '관리자', email: 'ETenglishacademy@gmail.com', password: 'ETenglish' },
              ].map((account) => (
                <div key={account.email} className="flex items-start gap-2">
                  <Badge variant="info" size="sm">
                    {account.role}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-mono"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {account.email}
                    </p>
                    <p
                      className="text-xs font-mono"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {account.password}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 회원가입/비밀번호 찾기 링크 */}
        <div
          className="text-center text-sm mt-6 space-y-2"
          style={{ color: theme.colors.text.tertiary }}
        >
          <div>
            계정이 없으신가요? {' '}
            <button
              onClick={() => setLocation('/signup')}
              style={{ color: theme.colors.accent.primary }}
              className="font-medium hover:opacity-80 bg-none border-none cursor-pointer"
            >
              회원가입
            </button>
          </div>
          <div>
            비밀번호를 잊으셨나요? {' '}
            <button
              onClick={() => setLocation('/forgot-password')}
              style={{ color: theme.colors.accent.primary }}
              className="font-medium hover:opacity-80 bg-none border-none cursor-pointer"
            >
              비밀번호 찾기
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: theme.colors.text.tertiary }}
        >
          © 2026 Academy Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
