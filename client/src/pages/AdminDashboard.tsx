import { useAuth } from "@/_core/hooks/useAuth";
import AdminCalendarPanel from "@/components/AdminCalendarPanel";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS, formatDateTime } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useLocation } from "wouter";

const QUEUE_ITEMS = [
  { key: "unclassified", label: "미분류 학생", view: "unclassified", color: theme.colors.status.info },
  {
    key: "unassignedClass",
    label: "반 미배정",
    view: "unassigned_class",
    color: theme.colors.status.warning,
  },
  { key: "overdue", label: "미납 학생", view: "overdue", color: theme.colors.status.error },
  {
    key: "pendingCheckout",
    label: "미하원 학생",
    view: "pending_checkout",
    color: theme.colors.status.warning,
  },
  { key: "followUp", label: "상담 필요", view: "follow_up", color: theme.colors.status.info },
  { key: "leaving", label: "퇴원예정", view: "leaving", color: theme.colors.status.error },
] as const;

export default function AdminDashboard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.portal.adminSummary.useQuery(undefined, LIVE_QUERY_OPTIONS);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              className="text-3xl font-bold md:text-4xl"
              style={{ color: theme.colors.text.primary }}
            >
              관리자 대시보드
            </h1>
            <p className="mt-2 text-base" style={{ color: theme.colors.text.tertiary }}>
              학생, 등하원, 수납, 공지, 일정을 한 화면에서 확인합니다.
            </p>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
            마지막 동기화 {formatDateTime(data?.syncedAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="전체 학생" value={data?.kpis.totalStudents ?? 0} color="info" />
          <StatCard label="운영 반" value={data?.kpis.totalClasses ?? 0} color="success" />
          <StatCard label="오늘 등원" value={data?.kpis.todayCheckInCount ?? 0} color="success" />
          <StatCard label="오늘 하원" value={data?.kpis.todayCheckOutCount ?? 0} color="info" />
          <StatCard label="현재 원내" value={data?.kpis.onSiteCount ?? 0} color="warning" />
          <StatCard label="미납 건수" value={data?.kpis.overduePayments ?? 0} color="error" />
        </div>

        <Card variant="elevated" padding="lg">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                학생 운영 큐
              </h2>
              <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                클릭하면 해당 저장 보기로 바로 이동합니다.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {QUEUE_ITEMS.map((item) => {
              const value = Number((data?.studentQueues as Record<string, number> | undefined)?.[item.key] ?? 0);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(`/admin/students?view=${item.view}`)}
                  className="rounded-xl border p-4 text-left transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold" style={{ color: item.color }}>
                    {value.toLocaleString("ko-KR")}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <AdminCalendarPanel />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card variant="elevated" padding="lg" className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              최근 활동
            </h2>
            {isLoading ? (
              <p style={{ color: theme.colors.text.tertiary }}>데이터를 불러오는 중입니다.</p>
            ) : data?.recentActivities?.length ? (
              <div className="space-y-3">
                {data.recentActivities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p style={{ color: theme.colors.text.primary }}>{activity.title}</p>
                        <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                          {activity.detail}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs" style={{ color: theme.colors.text.tertiary }}>
                        {formatDateTime(activity.time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="최근 활동이 없습니다." />
            )}
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              빠른 경고
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.background.secondary }}>
                <p style={{ color: theme.colors.text.tertiary }}>미하원 학생</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: theme.colors.status.warning }}>
                  {data?.alerts.pendingCheckoutCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.background.secondary }}>
                <p style={{ color: theme.colors.text.tertiary }}>수납 대기</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: theme.colors.status.error }}>
                  {data?.alerts.pendingPayments ?? 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
