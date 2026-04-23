import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Button from "@/components/common/Button";
import { Card } from "@/components/common/CommonComponents";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";

function getRoleHome(role?: string) {
  if (role === "admin" || role === "teacher") return "/admin";
  if (role === "parent") return "/parent";
  return "/student";
}

const INITIAL_FORM = {
  role: "student" as "student" | "parent",
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  phone: "",
  attendancePin: "",
  schoolName: "",
  parentName: "",
  parentPhone: "",
  dateOfBirth: "",
  address: "",
  notes: "",
};

export default function Signup() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const checkEmailQuery = trpc.auth.checkEmail.useQuery(
    { email: formData.email },
    {
      enabled:
        formData.email.length > 0 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    },
  );
  const schoolSearchQuery = trpc.schoolDirectory.search.useQuery(
    { query: formData.schoolName },
    {
      enabled:
        formData.role === "student" && formData.schoolName.trim().length > 0,
      staleTime: 10_000,
    },
  );
  const signupMutation = trpc.auth.signup.useMutation();

  useEffect(() => {
    if (checkEmailQuery.data) {
      setEmailAvailable(checkEmailQuery.data.available);
    }
  }, [checkEmailQuery.data]);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      delete next.submit;
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.email) {
      nextErrors.email = "이메일을 입력해 주세요.";
    } else if (emailAvailable === false) {
      nextErrors.email = "이미 가입된 이메일입니다.";
    }

    if (!formData.password) {
      nextErrors.password = "비밀번호를 입력해 주세요.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (formData.password !== formData.passwordConfirm) {
      nextErrors.passwordConfirm = "비밀번호 확인이 일치하지 않습니다.";
    }

    if (!formData.name.trim()) {
      nextErrors.name = "이름을 입력해 주세요.";
    }

    if (formData.role === "student") {
      if (!formData.attendancePin) {
        nextErrors.attendancePin = "출석번호 4자리를 입력해 주세요.";
      } else if (!/^\d{4}$/.test(formData.attendancePin)) {
        nextErrors.attendancePin = "출석번호는 숫자 4자리여야 합니다.";
      }

      if (!formData.schoolName.trim()) {
        nextErrors.schoolName = "학교명을 입력해 주세요.";
      }
    }

    if (formData.role === "student" && formData.parentPhone && !formData.parentName.trim()) {
      nextErrors.parentName = "보호자 연락처를 입력했다면 보호자 이름도 입력해 주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signupMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name,
        phone: formData.phone || undefined,
        role: formData.role,
        attendancePin:
          formData.role === "student" ? formData.attendancePin : undefined,
        schoolName:
          formData.role === "student" ? formData.schoolName.trim() : undefined,
        parentName: formData.parentName || undefined,
        parentPhone: formData.parentPhone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      });

      setSuccessMessage("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");
      setTimeout(() => setLocation("/login"), 1200);
    } catch (error: any) {
      setErrors({
        submit: error.message || "회원가입 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-12"
        style={{ backgroundColor: theme.colors.background.primary }}
      >
        <div className="w-full max-w-md">
          <Card
            variant="elevated"
            padding="lg"
            className="border text-center"
            style={{
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border.primary,
            }}
          >
            <h2 className="mb-4 text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
              이미 로그인된 상태입니다.
            </h2>
            <p style={{ color: theme.colors.text.secondary }}>{user.email}</p>
            <Button className="mt-6 w-full" onClick={() => setLocation(getRoleHome(user.role))}>
              대시보드로 이동
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const schoolSuggestions = schoolSearchQuery.data?.items ?? [];

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <img src="/logo.png" alt="ET" className="h-10 w-10 rounded-xl object-cover" />
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text.primary }}>
              ET영어전문학원
            </h1>
          </div>
          <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
            학생 또는 부모 계정을 등록합니다.
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                계정 유형
              </label>
              <select
                value={formData.role}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    role: event.target.value as "student" | "parent",
                    schoolName:
                      event.target.value === "student" ? current.schoolName : "",
                  }))
                }
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              >
                <option value="student">학생</option>
                <option value="parent">부모</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                이메일
              </label>
              <input
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {emailAvailable !== null ? (
                <p
                  className="mt-1 text-sm"
                  style={{
                    color: emailAvailable
                      ? theme.colors.status.success
                      : theme.colors.status.error,
                  }}
                >
                  {emailAvailable ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다."}
                </p>
              ) : null}
              {errors.email ? (
                <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                비밀번호
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {errors.password ? (
                <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                비밀번호 확인
              </label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(event) => updateField("passwordConfirm", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {errors.passwordConfirm ? (
                <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                  {errors.passwordConfirm}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                이름
              </label>
              <input
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
              {errors.name ? (
                <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                연락처
              </label>
              <input
                value={formData.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            {formData.role === "student" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    출석번호
                  </label>
                  <input
                    value={formData.attendancePin}
                    onChange={(event) =>
                      updateField(
                        "attendancePin",
                        event.target.value.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                    inputMode="numeric"
                    maxLength={4}
                    className="w-full rounded-lg border px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.primary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary,
                    }}
                  />
                  {errors.attendancePin ? (
                    <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                      {errors.attendancePin}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    학교명
                  </label>
                  <input
                    list="school-directory-options"
                    value={formData.schoolName}
                    onChange={(event) => updateField("schoolName", event.target.value)}
                    placeholder="학교 이름 입력"
                    className="w-full rounded-lg border px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.primary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary,
                    }}
                  />
                  <datalist id="school-directory-options">
                    {schoolSuggestions.map((item) => (
                      <option key={`${item.schoolLevel}-${item.schoolName}`} value={item.schoolName}>
                        {item.address || ""}
                      </option>
                    ))}
                  </datalist>
                  {errors.schoolName ? (
                    <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                      {errors.schoolName}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs" style={{ color: theme.colors.text.secondary }}>
                      광주 학교 목록이 자동 추천되며, 목록에 없어도 직접 입력할 수 있습니다.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    보호자 이름
                  </label>
                  <input
                    value={formData.parentName}
                    onChange={(event) => updateField("parentName", event.target.value)}
                    className="w-full rounded-lg border px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.primary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary,
                    }}
                  />
                  {errors.parentName ? (
                    <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
                      {errors.parentName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    보호자 연락처
                  </label>
                  <input
                    value={formData.parentPhone}
                    onChange={(event) => updateField("parentPhone", event.target.value)}
                    className="w-full rounded-lg border px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.primary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary,
                    }}
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                생년월일
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(event) => updateField("dateOfBirth", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                주소
              </label>
              <input
                value={formData.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="min-h-28 w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            {errors.submit ? (
              <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errors.submit}
              </div>
            ) : null}

            {successMessage ? (
              <div className="md:col-span-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            ) : null}

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1" isLoading={isLoading}>
                회원가입
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setLocation("/login")}>
                로그인으로 이동
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
