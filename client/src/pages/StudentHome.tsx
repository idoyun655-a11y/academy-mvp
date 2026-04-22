import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import {
  formatDate,
  formatTime,
  getCommuteStatusMeta,
  getLatestMockExam,
  STUDENT_NAV_ITEMS,
} from "@/lib/portal";
import { uiThemeVars } from "@/styles/runtime-theme";
import { useLocation } from "wouter";

export default function StudentHome() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const [, setLocation] = useLocation();
  const snapshot = snapshots[0];
  const latestMockExam = snapshot ? getLatestMockExam(snapshot.grades.mockExams) : null;

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout title="학생 홈" subtitle="학습 현황" navItems={STUDENT_NAV_ITEMS} variant="portal-light">
        <Card variant="elevated" padding="lg">
          <EmptyState
            title="연결된 학생 정보가 없습니다."
            description="학생 계정과 학생 레코드가 연결되어야 데이터를 확인할 수 있습니다."
          />
        </Card>
      </PortalLayout>
    );
  }

  const todayStatusMeta = getCommuteStatusMeta(snapshot.commute.todayStatus);

  return (
    <PortalLayout
      title={`${snapshot.student.name} 학생 페이지`}
      subtitle="오늘의 학습과 등하원 현황을 한눈에 확인하세요."
      navItems={STUDENT_NAV_ITEMS}
      variant="portal-light"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="오늘 상태" value={todayStatusMeta.label} color="success" />
          <StatCard label="수강 반" value={snapshot.summary.totalClasses} color="info" />
          <StatCard label="공지" value={snapshot.summary.totalNotices} color="warning" />
          <StatCard label="최근 내신" value={snapshot.summary.latestSchoolGrade ?? "-"} color="default" />
        </div>

        <Card
          variant="elevated"
          padding="lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(14, 165, 233, 0.10) 55%, rgba(45, 212, 191, 0.10) 100%)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge variant="info" size="sm">
                오늘의 등하원
              </Badge>
              <h2 className="mt-4 text-2xl font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                등원 {formatTime(snapshot.commute.latestCheckInAt)} / 하원 {formatTime(snapshot.commute.latestCheckOutAt)}
              </h2>
              <p className="mt-2 text-sm" style={{ color: uiThemeVars.textSecondary }}>
                미하원 상태면 학원에 아직 남아 있는 학생으로 표시됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STUDENT_NAV_ITEMS.slice(1).map((item) => (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: uiThemeVars.surface,
                    color: uiThemeVars.textPrimary,
                    border: `1px solid ${uiThemeVars.borderPrimary}`,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card variant="elevated" padding="lg" className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: uiThemeVars.accentSecondary }}>
                  Latest Notices
                </p>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                  최근 공지
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLocation("/student/notices")}
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: uiThemeVars.accentSoft,
                  color: uiThemeVars.accentPrimary,
                }}
              >
                전체 보기
              </button>
            </div>
            <div className="space-y-3">
              {snapshot.notices.slice(0, 5).map((notice: any) => (
                <div
                  key={notice.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: uiThemeVars.textPrimary }}>
                        {notice.title}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                        {notice.content}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                      {formatDate(notice.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {snapshot.notices.length === 0 ? (
                <p style={{ color: uiThemeVars.textTertiary }}>게시된 공지가 없습니다.</p>
              ) : null}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: uiThemeVars.accentPrimary }}>
              Recent Score
            </p>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              성적 요약
            </h2>
            {latestMockExam ? (
              <div className="mt-4 space-y-3">
                <Badge variant="info" size="sm">
                  {latestMockExam.mockExamMonth}월 모의고사
                </Badge>
                <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: uiThemeVars.textSecondary }}>
                  <div>국어 {latestMockExam.korean ?? "-"}</div>
                  <div>영어 {latestMockExam.english ?? "-"}</div>
                  <div>수학 {latestMockExam.math ?? "-"}</div>
                  <div>과학 {latestMockExam.science ?? "-"}</div>
                </div>
                <p style={{ color: uiThemeVars.textTertiary }}>
                  최근 내신: {snapshot.grades.latestSchoolGrade?.schoolGrade ?? "-"}
                </p>
              </div>
            ) : (
              <p className="mt-4" style={{ color: uiThemeVars.textTertiary }}>
                등록된 성적이 없습니다.
              </p>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              최근 출결
            </h2>
            <div className="space-y-3">
              {snapshot.commute.records.slice(0, 5).map((record: any) => {
                const meta = getCommuteStatusMeta(record.status);
                return (
                  <div
                    key={record.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium" style={{ color: uiThemeVars.textPrimary }}>
                          {formatDate(record.commuteDate)}
                        </p>
                        <p className="mt-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                          등원 {formatTime(record.checkInAt)} / 하원 {formatTime(record.checkOutAt)}
                        </p>
                      </div>
                      <Badge size="sm" style={{ backgroundColor: meta.color, color: "#fff" }}>
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              수강 중인 반
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {snapshot.classes.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                >
                  <p className="font-medium" style={{ color: uiThemeVars.textPrimary }}>
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    {item.subject} · {item.teacherName || "강사 미지정"} · {item.room || "강의실 미지정"}
                  </p>
                </div>
              ))}
              {snapshot.classes.length === 0 ? (
                <p style={{ color: uiThemeVars.textTertiary }}>등록된 수강 반이 없습니다.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
