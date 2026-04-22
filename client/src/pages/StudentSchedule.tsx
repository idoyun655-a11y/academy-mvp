import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Card, EmptyState } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import { DAY_LABELS, STUDENT_NAV_ITEMS } from "@/lib/portal";
import { uiThemeVars } from "@/styles/runtime-theme";
import { useMemo } from "react";

export default function StudentSchedule() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const snapshot = snapshots[0];

  const schedulesByDay = useMemo(() => {
    if (!snapshot) {
      return DAY_LABELS.map((label, index) => ({ label, day: index, items: [] as any[] }));
    }

    return DAY_LABELS.map((label, day) => ({
      label,
      day,
      items: snapshot.classes
        .flatMap((item: any) =>
          item.schedules.map((schedule: any) => ({
            id: `${item.id}-${schedule.id}`,
            className: item.name,
            subject: item.subject,
            room: item.room,
            teacherName: item.teacherName,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
        )
        .filter((schedule: any) => schedule.dayOfWeek === day)
        .sort((left: any, right: any) => left.startTime.localeCompare(right.startTime)),
    }));
  }, [snapshot]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout title="시간표" subtitle="주간 수업 일정" navItems={STUDENT_NAV_ITEMS} variant="portal-light">
        <Card variant="elevated" padding="lg">
          <EmptyState title="시간표 데이터를 불러올 수 없습니다" />
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="시간표" subtitle="요일별 수업 일정을 확인하세요." navItems={STUDENT_NAV_ITEMS} variant="portal-light">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {schedulesByDay.map((day) => (
            <Card key={day.day} variant="elevated" padding="lg">
              <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                {day.label}요일
              </h2>
              <div className="space-y-3">
                {day.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                  >
                    <p className="font-medium" style={{ color: uiThemeVars.textPrimary }}>
                      {item.className}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: uiThemeVars.accentPrimary }}>
                      {item.startTime} - {item.endTime}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                      {item.subject} · {item.teacherName || "강사 미지정"} · {item.room || "강의실 미지정"}
                    </p>
                  </div>
                ))}
                {day.items.length === 0 ? (
                  <p style={{ color: uiThemeVars.textTertiary }}>등록된 수업이 없습니다.</p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
