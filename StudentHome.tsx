import React from 'react';
import { Card } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { Link } from "wouter";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";

export default function StudentHome() {
  const { user, isAuthenticated } = useAuth();
  const localUser = localStorage.getItem('auth_user');
  const isLocallyAuthenticated = !!localUser;
  const effectiveUser = user || (isLocallyAuthenticated ? JSON.parse(localUser!) : null);

  if (!isAuthenticated && !isLocallyAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const stats = [
    { icon: "📅", label: "오늘 수업", value: "2", unit: "개" },
    { icon: "✅", label: "출석률", value: "96.5", unit: "%" },
    { icon: "📚", label: "등록 반", value: "3", unit: "개" },
    { icon: "🔔", label: "새 공지", value: "2", unit: "개" },
  ];
  
  const displayName = effectiveUser?.name || '학생';

  const quickActions = [
    { icon: "📅", label: "시간표", href: "/student/schedule" },
    { icon: "📢", label: "공지사항", href: "/student/notices" },
    { icon: "✅", label: "출석 현황", href: "/student/attendance" },
    { icon: "👤", label: "내 정보", href: "/student/profile" },
  ];

  const notices = [
    { title: "2월 수강료 안내", content: "2월 수강료 납부 기한은 2월 28일입니다.", time: "2일 전" },
    { title: "겨울방학 특강 안내", content: "겨울방학 특강 신청을 받습니다.", time: "5일 전" },
    { title: "시설 점검 안내", content: "1월 15일 시설 점검으로 휴원합니다.", time: "1주 전" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      {/* 헤더 */}
      <header
        className="border-b"
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            {displayName}님 환영합니다! 👋
          </h1>
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            📚 학원 관리 시스템
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: theme.colors.text.tertiary }}
          >
            학생 포털
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 인사말 */}
        <div>
          <h2
            className="text-4xl font-bold mb-2"
            style={{ color: theme.colors.text.primary }}
          >
            안녕하세요, {user?.name}님! 👋
          </h2>
          <p
            className="text-base"
            style={{ color: theme.colors.text.tertiary }}
          >
            오늘도 열심히 공부하세요
          </p>
        </div>

        {/* 주요 정보 - 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, idx) => (
            <Card key={idx} variant="elevated" padding="md">
              <div className="text-center">
                <p className="text-3xl mb-2">{stat.icon}</p>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.accent.primary }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  {stat.unit}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* 빠른 액션 */}
        <div>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: theme.colors.text.primary }}
          >
            빠른 메뉴
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <Link key={idx} href={action.href}>
                <Button
                  variant="primary"
                  size="lg"
                  isFullWidth
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 공지사항 */}
        <div>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: theme.colors.text.primary }}
          >
            최근 공지사항
          </h3>
          <div className="space-y-2">
            {notices.map((notice, idx) => (
              <Card
                key={idx}
                variant="elevated"
                padding="md"
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {notice.title}
                    </p>
                    <p
                      className="text-sm mt-1 line-clamp-2"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {notice.content}
                    </p>
                  </div>
                  <p
                    className="text-xs flex-shrink-0"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    {notice.time}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
