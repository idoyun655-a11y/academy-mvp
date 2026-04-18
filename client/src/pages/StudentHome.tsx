import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import {
  formatDate,
  getLatestMockExam,
  STUDENT_NAV_ITEMS,
} from "@/lib/portal";
import { theme } from "@/styles/design-system";
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
      <PortalLayout
        title="학생 포털"
        subtitle="내 학습 현황"
        navItems={STUDENT_NAV_ITEMS}
      >
        <Card variant="elevated" padding="lg">
          <EmptyState
            title="연결된 학생 정보가 없습니다"
            description="학생 계정과 학생 레코드가 연결되어야 포털 데이터를 확인할 수 있습니다."
          />
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title={`${snapshot.student.name} 학생 페이지`}
      subtitle="내 학습 현황"
      navItems={STUDENT_NAV_ITEMS}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="출석률"
            value={`${snapshot.attendance.summary.rate}%`}
            color="success"
          />
          <StatCard
            label="수강 반"
            value={snapshot.summary.totalClasses}
            color="info"
          />
          <StatCard
            label="공지"
            value={snapshot.summary.totalNotices}
            color="warning"
          />
          <StatCard
            label="최근 내신"
            value={snapshot.summary.latestSchoolGrade ?? "-"}
            color="default"
          />
        </div>

        <Card variant="elevated" padding="lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                오늘도 같은 데이터로 연동 중입니다
              </h2>
              <p
                className="text-sm mt-2"
                style={{ color: theme.colors.text.tertiary }}
              >
                관리자 페이지에서 공지, 출결, 성적을 바꾸면 이 화면이 자동으로 다시 불러옵니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STUDENT_NAV_ITEMS.slice(1).map((item) => (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.primary}`,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="elevated" padding="lg" className="lg:col-span-2">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              최근 공지
            </h2>
            <div className="space-y-3">
              {snapshot.notices.slice(0, 5).map((notice: any) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p
                        className="font-medium"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {notice.title}
                      </p>
                      <p
                        className="text-sm mt-2"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        {notice.content}
                      </p>
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {formatDate(notice.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {snapshot.notices.length === 0 && (
                <p style={{ color: theme.colors.text.tertiary }}>
                  게시된 공지가 없습니다.
                </p>
              )}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              성적 요약
            </h2>
            {latestMockExam ? (
              <div className="space-y-3">
                <Badge variant="info" size="sm">
                  {latestMockExam.mockExamMonth}월 모의고사
                </Badge>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>국어 {latestMockExam.korean ?? "-"}</div>
                  <div>영어 {latestMockExam.english ?? "-"}</div>
                  <div>수학 {latestMockExam.math ?? "-"}</div>
                  <div>과학 {latestMockExam.science ?? "-"}</div>
                </div>
                <p style={{ color: theme.colors.text.tertiary }}>
                  최근 내신: {snapshot.grades.latestSchoolGrade?.schoolGrade ?? "-"}
                </p>
              </div>
            ) : (
              <p style={{ color: theme.colors.text.tertiary }}>
                등록된 성적이 없습니다.
              </p>
            )}
          </Card>
        </div>

        <Card variant="elevated" padding="lg">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            수강 중인 반
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.classes.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: theme.colors.background.secondary }}
              >
                <p
                  className="font-medium"
                  style={{ color: theme.colors.text.primary }}
                >
                  {item.name}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  {item.subject} · {item.teacherName || "강사 미지정"} · {item.room || "강의실 미지정"}
                </p>
              </div>
            ))}
            {snapshot.classes.length === 0 && (
              <p style={{ color: theme.colors.text.tertiary }}>
                등록된 수강 반이 없습니다.
              </p>
            )}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
