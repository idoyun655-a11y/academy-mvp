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
import { theme } from "@/styles/design-system";
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
      <PortalLayout title="부모 페이지" subtitle="자녀 학습 현황" navItems={PARENT_NAV_ITEMS}>
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
    <PortalLayout title="부모 페이지" subtitle="자녀 학습 현황" navItems={PARENT_NAV_ITEMS}>
      <div className="space-y-6">
        {snapshots.length > 1 && (
          <Card variant="elevated" padding="md">
            <div className="flex flex-wrap gap-2">
              {snapshots.map((snapshot: any) => {
                const isActive = snapshot.student.id === selectedSnapshot.student.id;
                return (
                  <button
                    key={snapshot.student.id}
                    onClick={() => setSelectedStudentId(snapshot.student.id)}
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: isActive
                        ? theme.colors.accent.primary
                        : theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${
                        isActive ? theme.colors.accent.primary : theme.colors.border.primary
                      }`,
                    }}
                  >
                    {snapshot.student.name}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="오늘 상태" value={todayStatusMeta.label} color="success" />
          <StatCard label="수강 반" value={selectedSnapshot.summary.totalClasses} color="info" />
          <StatCard label="미납/대기" value={selectedSnapshot.summary.pendingPayments} color="warning" />
          <StatCard label="최근 내신" value={selectedSnapshot.summary.latestSchoolGrade ?? "-"} color="default" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card variant="elevated" padding="lg" className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                  {selectedSnapshot.student.name}
                </h2>
                <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                  {selectedSnapshot.student.email || "이메일 없음"} · {selectedSnapshot.student.phone || "전화번호 없음"}
                </p>
              </div>
              <Badge variant="info" size="sm">
                보호자 연결 중
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p style={{ color: theme.colors.text.tertiary }}>보호자명</p>
                <p style={{ color: theme.colors.text.primary }}>{selectedSnapshot.student.parentName || "-"}</p>
              </div>
              <div>
                <p style={{ color: theme.colors.text.tertiary }}>보호자 연락처</p>
                <p style={{ color: theme.colors.text.primary }}>{selectedSnapshot.student.parentPhone || "-"}</p>
              </div>
              <div>
                <p style={{ color: theme.colors.text.tertiary }}>최근 등원</p>
                <p style={{ color: theme.colors.text.primary }}>{formatTime(selectedSnapshot.commute.latestCheckInAt)}</p>
              </div>
              <div>
                <p style={{ color: theme.colors.text.tertiary }}>최근 하원</p>
                <p style={{ color: theme.colors.text.primary }}>{formatTime(selectedSnapshot.commute.latestCheckOutAt)}</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              성적 요약
            </h2>
            {latestMockExam ? (
              <div className="space-y-3">
                <p style={{ color: theme.colors.text.primary }}>
                  최근 모의고사: {latestMockExam.mockExamMonth}월
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>국어 {latestMockExam.korean ?? "-"}</div>
                  <div>영어 {latestMockExam.english ?? "-"}</div>
                  <div>수학 {latestMockExam.math ?? "-"}</div>
                  <div>과학 {latestMockExam.science ?? "-"}</div>
                </div>
                <p style={{ color: theme.colors.text.tertiary }}>
                  내신 등급: {selectedSnapshot.grades.latestSchoolGrade?.schoolGrade ?? "-"}
                </p>
              </div>
            ) : (
              <p style={{ color: theme.colors.text.tertiary }}>등록된 성적이 없습니다.</p>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              최근 출결
            </h2>
            <div className="space-y-3">
              {selectedSnapshot.commute.records.slice(0, 5).map((record: any) => {
                const meta = getCommuteStatusMeta(record.status);
                return (
                  <div
                    key={record.id}
                    className="rounded-lg p-3"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ color: theme.colors.text.primary }}>{formatDate(record.commuteDate)}</p>
                        <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
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
              {selectedSnapshot.commute.records.length === 0 && (
                <p style={{ color: theme.colors.text.tertiary }}>아직 출결 기록이 없습니다.</p>
              )}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              최근 공지
            </h2>
            <div className="space-y-3">
              {selectedSnapshot.notices.slice(0, 5).map((notice: any) => (
                <div
                  key={notice.id}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <p className="font-medium" style={{ color: theme.colors.text.primary }}>
                    {notice.title}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                    {notice.content}
                  </p>
                </div>
              ))}
              {selectedSnapshot.notices.length === 0 && (
                <p style={{ color: theme.colors.text.tertiary }}>확인할 공지가 없습니다.</p>
              )}
            </div>
          </Card>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            수납 현황
          </h2>
          <div className="space-y-3">
            {selectedSnapshot.payments.slice(0, 6).map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ backgroundColor: theme.colors.background.secondary }}
              >
                <div>
                  <p style={{ color: theme.colors.text.primary }}>{payment.month}</p>
                  <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    납부기한 {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: theme.colors.text.primary }}>{formatCurrency(payment.amount)}</p>
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
            {selectedSnapshot.payments.length === 0 && (
              <p style={{ color: theme.colors.text.tertiary }}>등록된 수납 정보가 없습니다.</p>
            )}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
