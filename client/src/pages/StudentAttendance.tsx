import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import {
  STUDENT_NAV_ITEMS,
  formatDate,
  formatTime,
  getCommuteStatusMeta,
} from "@/lib/portal";
import { uiThemeVars } from "@/styles/runtime-theme";
import { useMemo, useState } from "react";

export default function StudentAttendance() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const snapshot = snapshots[0];

  const filteredRecords = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.commute.records.filter((record: any) => {
      const month = new Date(record.commuteDate).getMonth() + 1;
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
      <PortalLayout title="출결" subtitle="등원/하원 기록" navItems={STUDENT_NAV_ITEMS} variant="portal-light">
        <Card variant="elevated" padding="lg">
          <EmptyState title="출결 데이터를 불러올 수 없습니다." />
        </Card>
      </PortalLayout>
    );
  }

  const todayStatusMeta = getCommuteStatusMeta(snapshot.commute.todayStatus);

  return (
    <PortalLayout title="출결" subtitle="등원과 하원 기록을 확인하세요." navItems={STUDENT_NAV_ITEMS} variant="portal-light">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="오늘 상태" value={todayStatusMeta.label} color="info" />
          <StatCard label="최근 등원" value={formatTime(snapshot.commute.latestCheckInAt)} color="success" />
          <StatCard label="최근 하원" value={formatTime(snapshot.commute.latestCheckOutAt)} color="warning" />
          <StatCard label="기록 수" value={snapshot.commute.summary.total} color="default" />
        </div>

        <Card variant="elevated" padding="lg">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
              월별 출결 기록
            </h2>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="rounded-lg px-3 py-2"
              style={{
                backgroundColor: uiThemeVars.surfaceAlt,
                color: uiThemeVars.textPrimary,
                border: `1px solid ${uiThemeVars.borderPrimary}`,
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
                      <div className="mt-2 space-y-1 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                        <p>등원 {formatTime(record.checkInAt)}</p>
                        <p>하원 {formatTime(record.checkOutAt)}</p>
                      </div>
                    </div>
                    <Badge size="sm" style={{ backgroundColor: meta.color, color: "#fff" }}>
                      {meta.label}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {filteredRecords.length === 0 ? (
              <p style={{ color: uiThemeVars.textTertiary }}>선택한 달에는 출결 기록이 없습니다.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
