import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import {
  STUDENT_NAV_ITEMS,
  formatDate,
  getAttendanceMeta,
} from "@/lib/portal";
import { theme } from "@/styles/design-system";
import { useMemo, useState } from "react";

export default function StudentAttendance() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const snapshot = snapshots[0];

  const filteredRecords = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.attendance.records.filter((record: any) => {
      const month = new Date(record.attendanceDate).getMonth() + 1;
      return month === selectedMonth;
    });
  }, [selectedMonth, snapshot]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout
        title="출결 현황"
        subtitle="내 출결 기록"
        navItems={STUDENT_NAV_ITEMS}
      >
        <Card variant="elevated" padding="lg">
          <EmptyState title="출결 데이터를 불러올 수 없습니다" />
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title="출결 현황"
      subtitle="내 출결 기록"
      navItems={STUDENT_NAV_ITEMS}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="출석률" value={`${snapshot.attendance.summary.rate}%`} color="success" />
          <StatCard label="출석" value={snapshot.attendance.summary.present} color="success" />
          <StatCard label="지각" value={snapshot.attendance.summary.late} color="warning" />
          <StatCard label="결석" value={snapshot.attendance.summary.absent} color="error" />
        </div>

        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              월별 출결 기록
            </h2>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredRecords.map((record: any) => {
              const meta = getAttendanceMeta(record.status);
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <div>
                    <p style={{ color: theme.colors.text.primary }}>
                      {record.className || "반 미지정"}
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {formatDate(record.attendanceDate)}
                      {record.notes ? ` · ${record.notes}` : ""}
                    </p>
                  </div>
                  <Badge size="sm" style={{ backgroundColor: meta.color, color: "#fff" }}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })}

            {filteredRecords.length === 0 && (
              <p style={{ color: theme.colors.text.tertiary }}>
                선택한 월의 출결 기록이 없습니다.
              </p>
            )}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
