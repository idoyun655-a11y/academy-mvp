import { useAuth } from "@/_core/hooks/useAuth";
import { Card, Badge } from "@/components/common/CommonComponents";
import { useState } from "react";
import { theme } from "@/styles/design-system";

export default function StudentAttendance() {
  const { user, isAuthenticated } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  // 샘플 데이터
  const attendanceData = [
    { date: "2024-02-01", class: "수학 기초반", status: "present", time: "09:00" },
    { date: "2024-02-03", class: "수학 기초반", status: "present", time: "09:00" },
    { date: "2024-02-05", class: "수학 기초반", status: "late", time: "09:15" },
    { date: "2024-02-08", class: "영어 회화반", status: "present", time: "14:00" },
    { date: "2024-02-10", class: "수학 기초반", status: "present", time: "09:00" },
    { date: "2024-02-12", class: "영어 회화반", status: "absent", time: "-" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return { bg: theme.colors.status.success, text: "#fff", label: "출석" };
      case "late":
        return { bg: "#F59E0B", text: "#fff", label: "지각" };
      case "absent":
        return { bg: theme.colors.status.error, text: "#fff", label: "결석" };
      case "early_leave":
        return { bg: "#EF4444", text: "#fff", label: "조퇴" };
      default:
        return { bg: theme.colors.background.secondary, text: theme.colors.text.tertiary, label: "미기록" };
    }
  };

  const stats = {
    present: attendanceData.filter((a) => a.status === "present").length,
    late: attendanceData.filter((a) => a.status === "late").length,
    absent: attendanceData.filter((a) => a.status === "absent").length,
    total: attendanceData.length,
  };

  const attendanceRate = Math.round(
    ((stats.present + stats.late) / stats.total) * 100
  );

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
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            ✅ 출석 현황
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: theme.colors.text.tertiary }}
          >
            나의 출석 기록 및 통계
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 출석률 */}
          <Card variant="elevated" padding="md">
            <div className="text-center">
              <p
                className="text-xs font-medium mb-2"
                style={{ color: theme.colors.text.tertiary }}
              >
                출석률
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: theme.colors.accent.primary }}
              >
                {attendanceRate}%
              </p>
              <div
                className="w-full h-2 rounded-full mt-2"
                style={{ backgroundColor: theme.colors.background.secondary }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${attendanceRate}%`,
                    backgroundColor: theme.colors.status.success,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* 출석 */}
          <Card variant="elevated" padding="md">
            <div className="text-center">
              <p
                className="text-xs font-medium mb-2"
                style={{ color: theme.colors.text.tertiary }}
              >
                출석
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: theme.colors.status.success }}
              >
                {stats.present}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: theme.colors.text.tertiary }}
              >
                회
              </p>
            </div>
          </Card>

          {/* 지각 */}
          <Card variant="elevated" padding="md">
            <div className="text-center">
              <p
                className="text-xs font-medium mb-2"
                style={{ color: theme.colors.text.tertiary }}
              >
                지각
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: "#F59E0B" }}
              >
                {stats.late}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: theme.colors.text.tertiary }}
              >
                회
              </p>
            </div>
          </Card>

          {/* 결석 */}
          <Card variant="elevated" padding="md">
            <div className="text-center">
              <p
                className="text-xs font-medium mb-2"
                style={{ color: theme.colors.text.tertiary }}
              >
                결석
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: theme.colors.status.error }}
              >
                {stats.absent}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: theme.colors.text.tertiary }}
              >
                회
              </p>
            </div>
          </Card>
        </div>

        {/* 출석 기록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              출석 기록
            </h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="text-sm rounded-lg px-3 py-2 border"
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {attendanceData.map((record, idx) => {
              const statusInfo = getStatusColor(record.status);
              return (
                <Card
                  key={idx}
                  variant="elevated"
                  padding="md"
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="font-semibold truncate"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {record.class}
                        </p>
                        <p
                          className="text-xs flex-shrink-0"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {record.date}
                        </p>
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        🕐 {record.time}
                      </p>
                    </div>

                    <Badge
                      color="blue"
                      style={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.text,
                      }}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
