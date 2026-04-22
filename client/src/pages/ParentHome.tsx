import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getCommuteStatusMeta,
  getLatestMockExam,
  PARENT_NAV_ITEMS,
} from "@/lib/portal";
import { uiThemeVars } from "@/styles/runtime-theme";
import { useMemo, useState } from "react";

export default function ParentHome() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const selectedSnapshot = useMemo(() => {
    if (snapshots.length === 0) return null;
    if (!selectedStudentId) return snapshots[0];
    return snapshots.find((snapshot: any) => snapshot.student.id === selectedStudentId) ?? snapshots[0];
  }, [selectedStudentId, snapshots]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!selectedSnapshot) {
    return (
      <PortalLayout title="부모 페이지" subtitle="자녀 학습 현황" navItems={PARENT_NAV_ITEMS} variant="portal-light">
        <Card variant="elevated" padding="lg">
          <EmptyState
            title="연결된 학생이 없습니다."
            description="부모 계정의 연락처가 학생 정보의 보호자 연락처와 같아야 합니다."
          />
        </Card>
      </PortalLayout>
    );
  }

  const latestMockExam = getLatestMockExam(selectedSnapshot.grades.mockExams);
  const todayStatusMeta = getCommuteStatusMeta(selectedSnapshot.commute.todayStatus);

  return (
    <PortalLayout
      title="부모 페이지"
      subtitle="자녀의 학습, 공지, 등하원 기록을 한 화면에서 확인하세요."
      navItems={PARENT_NAV_ITEMS}
      variant="portal-light"
    >
      <div className="space-y-6">
        {snapshots.length > 1 ? (
          <Card variant="elevated" padding="md">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {snapshots.map((snapshot: any) => {
                const isActive = snapshot.student.id === selectedSnapshot.student.id;
                return (
                  <button
                    key={snapshot.student.id}
                    onClick={() => setSelectedStudentId(snapshot.student.id)}
                    className="shrink-0 rounded-full px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: isActive ? uiThemeVars.accentPrimary : uiThemeVars.surfaceAlt,
                      color: isActive ? "#fff" : uiThemeVars.textPrimary,
                      border: `1px solid ${isActive ? uiThemeVars.accentPrimary : uiThemeVars.borderPrimary}`,
                    }}
                  >
                    {snapshot.student.name}
                  </button>
                );
              })}
            </div>
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatCard label="오늘 상태" value={todayStatusMeta.label} color="success" />
          <StatCard label="수강 반" value={selectedSnapshot.summary.totalClasses} color="info" />
          <StatCard label="미납/대기" value={selectedSnapshot.summary.pendingPayments} color="warning" />
          <StatCard label="최근 내신" value={selectedSnapshot.summary.latestSchoolGrade ?? "-"} color="default" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card
            variant="elevated"
            padding="lg"
            className="lg:col-span-2"
            style={{
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.10) 0%, rgba(37, 99, 235, 0.08) 58%, rgba(45, 212, 191, 0.10) 100%)",
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <Badge variant="info" size="sm">
                  보호자 연결 중
                </Badge>
                <h2 className="mt-3 text-xl font-semibold sm:text-2xl" style={{ color: uiThemeVars.textPrimary }}>
                  {selectedSnapshot.student.name}
                </h2>
                <p className="mt-1 text-sm" style={{ color: uiThemeVars.textSecondary }}>
                  {selectedSnapshot.student.email || "이메일 없음"} · {selectedSnapshot.student.phone || "전화번호 없음"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p style={{ color: uiThemeVars.textTertiary }}>보호자명</p>
                <p style={{ color: uiThemeVars.textPrimary }}>{selectedSnapshot.student.parentName || "-"}</p>
              </div>
              <div>
                <p style={{ color: uiThemeVars.textTertiary }}>보호자 연락처</p>
                <p style={{ color: uiThemeVars.textPrimary }}>{selectedSnapshot.student.parentPhone || "-"}</p>
              </div>
              <div>
                <p style={{ color: uiThemeVars.textTertiary }}>최근 등원</p>
                <p style={{ color: uiThemeVars.textPrimary }}>{formatTime(selectedSnapshot.commute.latestCheckInAt)}</p>
              </div>
              <div>
                <p style={{ color: uiThemeVars.textTertiary }}>최근 하원</p>
                <p style={{ color: uiThemeVars.textPrimary }}>{formatTime(selectedSnapshot.commute.latestCheckOutAt)}</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              성적 요약
            </h2>
            {latestMockExam ? (
              <div className="space-y-3">
                <p style={{ color: uiThemeVars.textPrimary }}>
                  최근 모의고사: {latestMockExam.mockExamMonth}월
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: uiThemeVars.textSecondary }}>
                  <div>국어 {latestMockExam.korean ?? "-"}</div>
                  <div>영어 {latestMockExam.english ?? "-"}</div>
                  <div>수학 {latestMockExam.math ?? "-"}</div>
                  <div>과학 {latestMockExam.science ?? "-"}</div>
                </div>
                <p style={{ color: uiThemeVars.textTertiary }}>
                  내신 등급: {selectedSnapshot.grades.latestSchoolGrade?.schoolGrade ?? "-"}
                </p>
              </div>
            ) : (
              <p style={{ color: uiThemeVars.textTertiary }}>등록된 성적이 없습니다.</p>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              최근 출결
            </h2>
            <div className="space-y-3">
              {selectedSnapshot.commute.records.slice(0, 5).map((record: any) => {
                const meta = getCommuteStatusMeta(record.status);
                return (
                  <div
                    key={record.id}
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p style={{ color: uiThemeVars.textPrimary }}>{formatDate(record.commuteDate)}</p>
                        <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
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
              {selectedSnapshot.commute.records.length === 0 ? (
                <p style={{ color: uiThemeVars.textTertiary }}>아직 출결 기록이 없습니다.</p>
              ) : null}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              최근 공지
            </h2>
            <div className="space-y-3">
              {selectedSnapshot.notices.slice(0, 5).map((notice: any) => (
                <div
                  key={notice.id}
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                >
                  <p className="font-medium" style={{ color: uiThemeVars.textPrimary }}>
                    {notice.title}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    {notice.content}
                  </p>
                </div>
              ))}
              {selectedSnapshot.notices.length === 0 ? (
                <p style={{ color: uiThemeVars.textTertiary }}>확인할 공지가 없습니다.</p>
              ) : null}
            </div>
          </Card>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
            수납 현황
          </h2>
          <div className="space-y-3">
            {selectedSnapshot.payments.slice(0, 6).map((payment: any) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ backgroundColor: uiThemeVars.surfaceAlt }}
              >
                <div>
                  <p style={{ color: uiThemeVars.textPrimary }}>{payment.month}</p>
                  <p className="text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    납부기한 {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: uiThemeVars.textPrimary }}>{formatCurrency(payment.amount)}</p>
                  <Badge
                    size="sm"
                    variant={
                      payment.status === "paid"
                        ? "success"
                        : payment.status === "overdue"
                          ? "error"
                          : "warning"
                    }
                  >
                    {payment.status === "paid"
                      ? "납부 완료"
                      : payment.status === "overdue"
                        ? "미납"
                        : "대기"}
                  </Badge>
                </div>
              </div>
            ))}
            {selectedSnapshot.payments.length === 0 ? (
              <p style={{ color: uiThemeVars.textTertiary }}>등록된 수납 정보가 없습니다.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
