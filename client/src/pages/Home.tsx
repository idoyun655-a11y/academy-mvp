import React from 'react';
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
      description: "학생 정보, 반 배치, 출석 관리를 한 곳에서 효율적으로 관리합니다",
    },
    {
      icon: "📅",
      title: "시간표 관리",
      description: "수업 시간표를 쉽게 등록하고 학생들과 공유합니다",
    },
    {
      icon: "✅",
      title: "출석 관리",
      description: "실시간 출석 기록 및 통계로 학생 관리를 더욱 효율적으로",
    },
    {
      icon: "📢",
      title: "공지사항 관리",
      description: "학원 소식과 공지사항을 학생 및 학부모에게 빠르게 전달합니다",
    },
    {
      icon: "🔔",
      title: "알림톡 발송",
      description: "중요한 소식을 알림톡으로 즉시 전달합니다",
    },
    {
      icon: "💳",
      title: "수강료 관리",
      description: "수강료 납부 현황을 체계적으로 관리합니다",
    },
  ];

  const testimonials = [
    {
      name: "김학원장",
      role: "학원 원장",
      text: "학원 운영이 정말 간편해졌습니다. 모든 업무를 한 시스템에서 처리할 수 있어 시간이 많이 절약됩니다.",
    },
    {
      name: "이강사",
      role: "강사",
      text: "학생 관리와 출석 기록이 자동으로 되어 수업에만 집중할 수 있습니다.",
    },
    {
      name: "박학부모",
      role: "학부모",
      text: "아이의 출석 현황과 공지사항을 실시간으로 확인할 수 있어 안심이 됩니다.",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      {/* 네비게이션 */}
      <nav
        className="border-b"
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="ET" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.24em]"
                style={{ color: theme.colors.accent.secondary }}
              >
                ET English Academy
              </p>
              <div
                className="text-2xl font-bold"
                style={{ color: theme.colors.accent.primary }}
              >
                ET영어전문학원
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href={user?.role === "admin" || user?.role === "teacher" ? "/admin" : "/student"}>
                  <Button variant="secondary" size="md">
                    대시보드
                  </Button>
                </Link>
              </>
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

      {/* 히어로 섹션 */}
      <section
        className="py-20 md:py-32"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            학원 운영의 모든 것을
            <br />
            한 곳에서
          </h1>
          <p
            className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
            style={{ color: theme.colors.text.tertiary }}
          >
            학생 관리부터 출석, 공지까지 학원 운영에 필요한 모든 기능을 통합한 프리미엄 플랫폼입니다
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button variant="primary" size="lg">
                무료로 시작하기
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              데모 보기
            </Button>
          </div>
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              주요 기능
            </h2>
            <p
              className="text-lg"
              style={{ color: theme.colors.text.tertiary }}
            >
              학원 운영을 위한 모든 필수 기능을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                variant="elevated"
                padding="lg"
                className="hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-base"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 학원 소개 */}
      <section
        className="py-20 md:py-32"
        style={{
          backgroundColor: theme.colors.background.secondary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-4xl font-bold mb-6"
                style={{ color: theme.colors.text.primary }}
              >
                학원 운영의
                <br />
                새로운 표준
              </h2>
              <p
                className="text-lg mb-4"
                style={{ color: theme.colors.text.tertiary }}
              >
                Academy System은 학원 원장, 강사, 학생, 학부모 모두를 위한 통합 플랫폼입니다.
              </p>
              <p
                className="text-lg mb-8"
                style={{ color: theme.colors.text.tertiary }}
              >
                복잡한 학원 운영 업무를 간단하게 정리하고, 학생 관리를 효율적으로 하며, 학부모와의 소통을 강화합니다.
              </p>
              <Link href="/login">
                <Button variant="primary" size="lg">
                  지금 시작하기
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card variant="elevated" padding="md">
                <div className="text-center">
                  <p
                    className="text-4xl font-bold mb-2"
                    style={{ color: theme.colors.accent.primary }}
                  >
                    1000+
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    학원 사용 중
                  </p>
                </div>
              </Card>

              <Card variant="elevated" padding="md">
                <div className="text-center">
                  <p
                    className="text-4xl font-bold mb-2"
                    style={{ color: theme.colors.accent.primary }}
                  >
                    50K+
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    활동 학생
                  </p>
                </div>
              </Card>

              <Card variant="elevated" padding="md">
                <div className="text-center">
                  <p
                    className="text-4xl font-bold mb-2"
                    style={{ color: theme.colors.accent.primary }}
                  >
                    99.9%
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    가용성
                  </p>
                </div>
              </Card>

              <Card variant="elevated" padding="md">
                <div className="text-center">
                  <p
                    className="text-4xl font-bold mb-2"
                    style={{ color: theme.colors.accent.primary }}
                  >
                    24/7
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    고객 지원
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 사용자 후기 */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              사용자 후기
            </h2>
            <p
              className="text-lg"
              style={{ color: theme.colors.text.tertiary }}
            >
              Academy System을 사용하는 학원들의 실제 후기입니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card
                key={idx}
                variant="elevated"
                padding="lg"
                className="hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <p
                    className="text-lg italic"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    "{testimonial.text}"
                  </p>
                </div>
                <div className="border-t" style={{ borderColor: theme.colors.border.primary }}>
                  <p
                    className="font-semibold mt-4"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {testimonial.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section
        className="py-20 md:py-32"
        style={{
          backgroundColor: theme.colors.background.secondary,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2
            className="text-4xl font-bold mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            지금 바로 시작하세요
          </h2>
          <p
            className="text-xl mb-8"
            style={{ color: theme.colors.text.tertiary }}
          >
            Academy System으로 학원 운영을 간단하고 효율적으로 만들어보세요
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* ET영어전문학원 소개 */}
      <section
        className="py-20 md:py-32"
        style={{
          backgroundColor: theme.colors.background.secondary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
                <img src="/logo.svg" alt="ET" className="h-12 w-12" />
              <h2
                className="text-4xl font-bold"
                style={{ color: theme.colors.text.primary }}
              >
                ET영어전문학원
              </h2>
            </div>
            <p
              className="text-xl mb-4"
              style={{ color: theme.colors.accent.primary }}
            >
              📚 매일 학습으로 실력 UP!
            </p>
            <p
              className="text-lg max-w-3xl mx-auto"
              style={{ color: theme.colors.text.tertiary }}
            >
              우리 영어학원은 월요일부터 금요일까지 매일 영어 수업을 제공하여 학생들의 영어 실력을 체계적으로 향상시킬 수 있는 특별한 학원입니다. 초등학생부터 고등학생까지 모든 학년을 위한 포괄적인 교육을 제공하며, 파닉스부터 수능까지 다양한 과정을 전문적으로 다룹니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card variant="elevated" padding="lg">
              <div className="text-center">
                <p
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.colors.accent.primary }}
                >
                  2008년
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  설립 이후 지역 대표 명품 입시 영어전문학원
                </p>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="text-center">
                <p
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.colors.accent.primary }}
                >
                  초등~고등
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  모든 학년을 위한 포괄적인 교육
                </p>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="text-center">
                <p
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.colors.accent.primary }}
                >
                  파닉스~수능
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  다양한 과정을 전문적으로 다룸
                </p>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <p
              className="text-lg mb-6"
              style={{ color: theme.colors.text.secondary }}
            >
              📞 전화: 062-972-2708 | 📷 인스타그램: @et_englishacademy
            </p>
            <p
              className="text-sm"
              style={{ color: theme.colors.text.tertiary }}
            >
              등록번호: 제 4179호 | 교습과목: 외국어(영어)
            </p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
