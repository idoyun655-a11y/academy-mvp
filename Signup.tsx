import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/CommonComponents';
import { theme } from '@/styles/design-system';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Signup() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    role: 'student' as 'student' | 'parent',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 이메일 중복 확인
  const checkEmailMutation = trpc.auth.checkEmail.useQuery(
    { email: formData.email },
    { enabled: formData.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) }
  );

  useEffect(() => {
    if (checkEmailMutation.data) {
      setEmailAvailable(checkEmailMutation.data.available);
    }
  }, [checkEmailMutation.data]);

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string) => {
    let strength: 'weak' | 'medium' | 'strong' | null = null;
    if (password.length >= 8) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*]/.test(password);

      if ((hasUpperCase && hasNumber) || (hasNumber && hasSpecial)) {
        strength = 'strong';
      } else if (hasUpperCase || hasNumber || hasSpecial) {
        strength = 'medium';
      } else {
        strength = 'weak';
      }
    }
    setPasswordStrength(strength);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      calculatePasswordStrength(value);
    }

    // 에러 제거
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!emailAvailable) {
      newErrors.email = '이미 등록된 이메일입니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = '비밀번호는 대문자를 포함해야 합니다.';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = '비밀번호는 숫자를 포함해야 합니다.';
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const signupMutation = trpc.auth.signup.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await signupMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name,
        phone: formData.phone || undefined,
        role: formData.role,
      });

      setSuccessMessage('회원가입에 성공했습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    } catch (error: any) {
      // 에러 메시지 개선
      let errorMessage = error.message || '회원가입에 실패했습니다.';
      if (errorMessage.includes('Already registered')) {
        errorMessage = '이미 등록된 이메일입니다.';
      } else if (errorMessage.includes('Invalid credentials')) {
        errorMessage = '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.';
      }
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인된 사용자는 회원가입 페이지에 접근 불가
  if (user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: theme.colors.background.primary }}
      >
        <div className="w-full max-w-md">
          <Card
            variant="elevated"
            padding="lg"
            style={{
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border.primary,
            }}
            className="border text-center"
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              이미 로그인되어 있습니다
            </h2>
            <p
              className="mb-6"
              style={{ color: theme.colors.text.secondary }}
            >
              현재 계정: {user.email}
            </p>
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              대시보드로 이동
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
          <p
            className="text-lg"
            style={{ color: theme.colors.text.secondary }}
          >
            회원가입
          </p>
        </div>

        {/* 회원가입 폼 */}
        <Card
          variant="elevated"
          padding="lg"
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border.primary,
          }}
          className="border"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 역할 선택 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                가입 유형 *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: theme.colors.border.primary,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                }}
              >
                <option value="student">학생</option>
                <option value="parent">학부모</option>
              </select>
            </div>

            {/* 이메일 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                이메일 *
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: errors.email ? '#ef4444' : theme.colors.border.primary,
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.primary,
                  }}
                />
                {emailAvailable !== null && (
                  <div
                    className="flex items-center px-3 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: emailAvailable ? '#dcfce7' : '#fee2e2',
                      color: emailAvailable ? '#166534' : '#991b1b',
                    }}
                  >
                    {emailAvailable ? '✓' : '✗'}
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                비밀번호 *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="최소 8자, 대문자, 숫자 포함"
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: errors.password ? '#ef4444' : theme.colors.border.primary,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {passwordStrength && (
                <div className="mt-2 flex gap-1">
                  <div
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor:
                        passwordStrength === 'strong'
                          ? '#22c55e'
                          : passwordStrength === 'medium'
                          ? '#eab308'
                          : '#ef4444',
                    }}
                  />
                  <div
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor:
                        passwordStrength === 'strong'
                          ? '#22c55e'
                          : passwordStrength === 'medium'
                          ? '#eab308'
                          : '#e5e7eb',
                    }}
                  />
                  <div
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor:
                        passwordStrength === 'strong' ? '#22c55e' : '#e5e7eb',
                    }}
                  />
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                비밀번호 확인 *
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력해주세요"
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: errors.passwordConfirm ? '#ef4444' : theme.colors.border.primary,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {errors.passwordConfirm && (
                <p className="text-sm text-red-500 mt-1">{errors.passwordConfirm}</p>
              )}
            </div>

            {/* 이름 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                이름 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: errors.name ? '#ef4444' : theme.colors.border.primary,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                전화번호 (선택)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: theme.colors.border.primary,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            {/* 에러 메시지 */}
            {errors.submit && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                }}
              >
                {errors.submit}
              </div>
            )}

            {/* 성공 메시지 */}
            {successMessage && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                }}
              >
                {successMessage}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <Button
              variant="primary"
              size="lg"
              isFullWidth
              type="submit"
              disabled={isLoading || !emailAvailable}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p
              className="text-sm"
              style={{ color: theme.colors.text.tertiary }}
            >
              이미 계정이 있으신가요? {' '}
              <button
                onClick={() => setLocation('/login')}
                style={{ color: theme.colors.accent.primary }}
                className="font-medium hover:opacity-80 bg-none border-none cursor-pointer"
              >
                로그인
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
