import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, Badge } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";

export default function AdminAttendance() {
  const { user, isAuthenticated } = useAuth();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0] || "");

  const { data: attendanceData, isLoading } = trpc.attendance.list.useQuery(
    {
      classId: selectedClass ? parseInt(selectedClass) : undefined,
      date: selectedDate,
    },
    {
      enabled: !!selectedClass,
    }
  );

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

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

  const records = attendanceData?.data || [];
  const stats = {
    present: records.filter((r: any) => r.status === "present").length,
    late: records.filter((r: any) => r.status === "late").length,
    absent: records.filter((r: any) => r.status === "absent").length,
    early_leave: records.filter((r: any) => r.status === "early_leave").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1
            className="text-4xl font-bold mb-1"
            style={{ color: theme.colors.text.primary }}
          >
            출결 관리
          </h1>
          <p
            className="text-base"
            style={{ color: theme.colors.text.tertiary }}
          >
            수업별 학생 출석 현황을 조회하고 관리합니다
          </p>
        </div>

        {/* 필터 */}
        <Card variant="elevated" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 반 선택 */}
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: theme.colors.text.primary }}
              >
                반 선택
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              >
                <option value="">반을 선택하세요</option>
                <option value="1">수학 기초반</option>
                <option value="2">영어 회화반</option>
              </select>
            </div>

            {/* 날짜 */}
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: theme.colors.text.primary }}
              >
                날짜
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            {/* 조회 버튼 */}
            <div className="flex items-end">
              <Button variant="primary" size="md" isFullWidth>
                조회
              </Button>
            </div>
          </div>
        </Card>

        {/* 통계 */}
        {selectedClass && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 출석 */}
            <Card variant="elevated" padding="md">
              <div className="text-center">
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: theme.colors.status.success }}
                >
                  {stats.present}
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  출석
                </p>
              </div>
            </Card>

            {/* 지각 */}
            <Card variant="elevated" padding="md">
              <div className="text-center">
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#F59E0B" }}
                >
                  {stats.late}
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  지각
                </p>
              </div>
            </Card>

            {/* 결석 */}
            <Card variant="elevated" padding="md">
              <div className="text-center">
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: theme.colors.status.error }}
                >
                  {stats.absent}
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  결석
                </p>
              </div>
            </Card>

            {/* 조퇴 */}
            <Card variant="elevated" padding="md">
              <div className="text-center">
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#EF4444" }}
                >
                  {stats.early_leave}
                </p>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  조퇴
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* 출결 현황 */}
        <Card variant="elevated" padding="lg">
          {!selectedClass ? (
            <div className="text-center py-12">
              <p
                className="text-2xl mb-2"
              >
                📋
              </p>
              <p
                className="font-medium mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                반을 선택하세요
              </p>
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                출결을 조회하려면 위에서 반을 선택해주세요
              </p>
            </div>
          ) : isLoading ? (
            <div
              className="text-center py-12"
              style={{ color: theme.colors.text.tertiary }}
            >
              로딩 중...
            </div>
          ) : records.length > 0 ? (
            <div className="space-y-2">
              {records.map((record: any) => {
                const statusInfo = getStatusColor(record.status);
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                    }}
                  >
                    <div className="flex-1">
                      <p
                        className="font-medium"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {record.studentName}
                      </p>
                      {record.notes && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {record.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        color="blue"
                        style={{
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.text,
                        }}
                      >
                        {statusInfo.label}
                      </Badge>
                      <Button variant="secondary" size="sm">
                        ✏️
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p
                className="text-2xl mb-2"
              >
                📭
              </p>
              <p
                className="font-medium mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                출결 기록이 없습니다
              </p>
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                선택한 날짜에 출결 정보가 없습니다
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
