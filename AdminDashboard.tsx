import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, Badge, StatCard } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { Link } from "wouter";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";
import { Calendar } from "@/components/Calendar";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  // KPI 데이터 - 실제 데이터가 없으므로 0으로 표시
  const kpis = [
    { icon: '👥', label: '총 학생 수', value: '0', change: '등록된 학생', color: 'primary' },
    { icon: '📚', label: '운영 중인 반', value: '0', change: '운영 중인 반', color: 'info' },
    { icon: '📅', label: '오늘 수업', value: '0', change: '예정된 수업', color: 'success' },
    { icon: '📊', label: '출석률', value: '0%', change: '이번 주 평균', color: 'warning' },
  ];

  // 빠른 액션 메뉴
  const quickActions = [
    { href: '/admin/students', icon: '👥', label: '학생 관리' },
    { href: '/admin/classes', icon: '📚', label: '반 관리' },
    { href: '/admin/attendance', icon: '📋', label: '출결 관리' },
    { href: '/admin/notices', icon: '📢', label: '공지사항' },
  ];

  // 최근 활동 데이터
  const recentActivities = [
    { title: '아직 등록된 활동이 없습니다', time: '대기 중', type: '대기', color: 'info' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 헤더 */}
        <div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: theme.colors.text.primary }}
          >
            관리자 대시보드
          </h1>
          <p
            className="text-base"
            style={{ color: theme.colors.text.tertiary }}
          >
            학원 운영 통합 시스템 - 오늘의 주요 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 캘린더 */}
        <div>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            학사 일정 및 시험 일정
          </h2>
          <Calendar />
        </div>

        {/* KPI 카드 - 4개 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <StatCard
              key={idx}
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              color={kpi.color as any}
            />
          ))}
        </div>

        {/* 빠른 액션 - 4개 버튼 */}
        <div>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            빠른 액션
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card
                  variant="elevated"
                  padding="md"
                  className="h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="text-3xl">{action.icon}</div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {action.label}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 최근 활동 리스트 */}
          <div className="lg:col-span-2">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              최근 활동
            </h2>
            <Card variant="elevated" padding="lg">
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between py-3 border-b last:border-b-0"
                    style={{ borderColor: theme.colors.border.light }}
                  >
                    <div className="flex-1">
                      <p
                        className="font-medium"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {activity.title}
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        {activity.time}
                      </p>
                    </div>
                    <Badge
                      variant={activity.color as any}
                      size="sm"
                    >
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 주의 사항 */}
          <div>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              주의 사항
            </h2>
            <div className="space-y-3">
              {/* 미납 현황 */}
              <Card variant="elevated" padding="md">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: theme.colors.text.primary }}
                    >
                      미납 학생
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: theme.colors.status.error }}
                    >
                      0명
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      이번 달 미납
                    </p>
                  </div>
                </div>
              </Card>

              {/* 결석 현황 */}
              <Card variant="elevated" padding="md">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">❌</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: theme.colors.text.primary }}
                    >
                      결석 학생
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: theme.colors.status.error }}
                    >
                      0명
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      이번 주 결석
                    </p>
                  </div>
                </div>
              </Card>

              {/* 지각 현황 */}
              <Card variant="elevated" padding="md">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⏰</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: theme.colors.text.primary }}
                    >
                      지각 학생
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: theme.colors.status.warning }}
                    >
                      0명
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      이번 주 지각
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
