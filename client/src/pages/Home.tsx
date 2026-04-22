import React from "react";
import Button from "@/components/common/Button";
import { Card } from "@/components/common/CommonComponents";
import { Link } from "wouter";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      icon: "📚",
      title: "통합 학생 관리",
      description: "학생 정보, 반 배치, 등하원 기록까지 한 화면에서 운영할 수 있습니다.",
    },
    {
      icon: "🗓️",
      title: "요일별 시간표 관리",
      description: "반마다 월~일 수업 요일을 선택하고 각 요일마다 다른 수업 시간을 저장합니다.",
    },
    {
      icon: "🏫",
      title: "운영 콘솔",
      description: "원장이 학생, 반, 공지, 수납 현황을 빠르게 전환하며 관리할 수 있습니다.",
    },
    {
      icon: "🚶",
      title: "등하원 체크",
      description: "학생 번호 입력만으로 등원과 하원을 자동 기록해 출결 흐름을 단순화합니다.",
    },
    {
      icon: "📢",
      title: "공지 공유",
      description: "공지 내용을 올리고 필요한 경우 외부 공유 흐름과 함께 빠르게 전달할 수 있습니다.",
    },
    {
      icon: "💳",
      title: "수강료 관리",
      description: "납부 현황과 대기·미납 상태를 한 번에 확인하고 관리할 수 있습니다.",
    },
  ];

  const testimonials = [
    {
      name: "김학원장",
      role: "학원 원장",
      text: "운영에 필요한 화면이 한 곳에 모여 있어서 학생이 많아도 관리가 훨씬 빨라졌습니다.",
    },
    {
      name: "이강사",
      role: "강사",
      text: "시간표와 공지가 정리되어 있어서 수업 준비와 전달이 훨씬 수월합니다.",
    },
    {
      name: "박학부모",
      role: "학부모",
      text: "등하원 기록과 공지를 바로 확인할 수 있어 아이 학원 생활을 더 안심하고 볼 수 있습니다.",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.primary }}>
      <nav
        className="border-b"
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ET" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.24em]"
                style={{ color: theme.colors.accent.secondary }}
              >
                ET English Academy
              </p>
              <div className="text-2xl font-bold" style={{ color: theme.colors.accent.primary }}>
                ET영어전문학원
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href={user?.role === "admin" || user?.role === "teacher" ? "/admin" : user?.role === "parent" ? "/parent" : "/student"}>
                <Button variant="secondary" size="md">
                  대시보드
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary" size="md">
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="md">
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section
        className="py-16 md:py-24"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="text-center lg:text-left">
            <p
              className="mb-4 text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: theme.colors.accent.secondary }}
            >
              Academy Operating Platform
            </p>
            <h1
              className="text-5xl font-bold leading-tight md:text-6xl"
              style={{ color: theme.colors.text.primary }}
            >
              학원 운영의 모든 것을
              <br />
              한 곳에서
            </h1>
            <p
              className="mt-6 max-w-2xl text-lg md:text-xl"
              style={{ color: theme.colors.text.tertiary }}
            >
              학생 관리부터 반 시간표, 공지, 수납, 등하원 기록까지 ET영어전문학원 운영에 필요한 흐름을
              통합한 프리미엄 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link href="/login">
                <Button variant="primary" size="lg">
                  무료로 시작하기
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary" size="lg">
                  회원가입
                </Button>
              </Link>
            </div>
          </div>

          <Card
            variant="elevated"
            padding="lg"
            className="overflow-hidden rounded-[32px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(37, 99, 235, 0.18) 45%, rgba(45, 212, 191, 0.20) 100%)",
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <div className="space-y-6">
              <div className="rounded-3xl border bg-white/90 p-6" style={{ borderColor: "rgba(255,255,255,0.22)" }}>
                <p
                  className="text-sm font-semibold uppercase tracking-[0.28em]"
                  style={{ color: "#4f46e5" }}
                >
                  제작자 회사명
                </p>
                <div className="mt-5 flex flex-col items-center gap-5 text-center">
                  <img
                    src="/don-studio.png"
                    alt="D:ON Studio"
                    className="w-full max-w-[360px] rounded-3xl bg-white object-contain"
                  />
                  <div>
                    <p className="text-base font-medium" style={{ color: "#1f3b68" }}>
                      Design • Branding • Product Build
                    </p>
                    <h2 className="mt-2 text-4xl font-bold md:text-5xl" style={{ color: "#111827" }}>
                      D:ON Studio
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm" style={{ color: "#dbeafe" }}>
                    운영 콘솔
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">학생 · 반 · 공지</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm" style={{ color: "#dbeafe" }}>
                    출결 흐름
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">등원 · 하원 자동 기록</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm" style={{ color: "#dbeafe" }}>
                    포털
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">학생 · 학부모 확인 화면</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
              주요 기능
            </h2>
            <p className="text-lg" style={{ color: theme.colors.text.tertiary }}>
              학원 운영에 필요한 핵심 흐름을 실무 중심으로 정리했습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <Card key={idx} variant="elevated" padding="lg" className="hover:shadow-lg transition-shadow">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                  {feature.title}
                </h3>
                <p className="text-base" style={{ color: theme.colors.text.tertiary }}>
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ backgroundColor: theme.colors.background.secondary }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>
                학원 운영의
                <br />
                새로운 표준
              </h2>
              <p className="text-lg mb-4" style={{ color: theme.colors.text.tertiary }}>
                학생 수가 많아져도 반, 시간표, 공지, 수납, 등하원 기록을 빠르게 전환하며 운영할 수 있게
                설계했습니다.
              </p>
              <p className="text-lg mb-8" style={{ color: theme.colors.text.tertiary }}>
                ET영어전문학원처럼 실제 운영 환경에 맞춰 관리자 화면은 단단하게, 학생과 학부모 화면은 읽기
                쉽게 구성했습니다.
              </p>
              <Link href="/login">
                <Button variant="primary" size="lg">
                  지금 시작하기
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "400+", label: "관리 가능한 학생 규모" },
                { value: "7일", label: "요일별 개별 시간표 지원" },
                { value: "1화면", label: "원장 중심 운영 콘솔" },
                { value: "실시간", label: "등하원 기록 확인" },
              ].map((item) => (
                <Card key={item.label} variant="elevated" padding="md">
                  <div className="text-center">
                    <p className="mb-2 text-4xl font-bold" style={{ color: theme.colors.accent.primary }}>
                      {item.value}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                      {item.label}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
              사용자 후기
            </h2>
            <p className="text-lg" style={{ color: theme.colors.text.tertiary }}>
              실제 운영자와 사용자 관점에서 느낀 변화를 담았습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} variant="elevated" padding="lg" className="hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <p className="text-lg italic" style={{ color: theme.colors.text.secondary }}>
                    "{testimonial.text}"
                  </p>
                </div>
                <div className="border-t pt-4" style={{ borderColor: theme.colors.border.primary }}>
                  <p className="font-semibold" style={{ color: theme.colors.text.primary }}>
                    {testimonial.name}
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    {testimonial.role}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ backgroundColor: theme.colors.background.secondary }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold" style={{ color: theme.colors.text.primary }}>
            지금 바로 시작해보세요
          </h2>
          <p className="mb-8 text-xl" style={{ color: theme.colors.text.tertiary }}>
            ET영어전문학원 운영 환경에 맞춘 콘솔과 포털을 지금 바로 사용할 수 있습니다.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button variant="primary" size="lg">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="secondary" size="lg">
                회원가입
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
