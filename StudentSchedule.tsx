import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { useState } from "react";
import { theme } from "@/styles/design-system";

const DAYS = ["월", "화", "수", "목", "금", "토"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

// 샘플 시간표 데이터
const SCHEDULE_DATA = {
  월: [
    { time: "09:00", class: "수학 기초반", teacher: "김선생님", room: "101호" },
    { time: "14:00", class: "영어 회화반", teacher: "이선생님", room: "102호" },
  ],
  화: [
    { time: "10:00", class: "과학 심화반", teacher: "박선생님", room: "103호" },
  ],
  수: [
    { time: "09:00", class: "수학 기초반", teacher: "김선생님", room: "101호" },
    { time: "15:00", class: "국어 독해반", teacher: "최선생님", room: "104호" },
  ],
  목: [
    { time: "10:00", class: "과학 심화반", teacher: "박선생님", room: "103호" },
  ],
  금: [
    { time: "09:00", class: "수학 기초반", teacher: "김선생님", room: "101호" },
    { time: "14:00", class: "영어 회화반", teacher: "이선생님", room: "102호" },
  ],
  토: [
    { time: "10:00", class: "종합반", teacher: "여러 선생님", room: "다목적실" },
  ],
};

const CLASSES = [
  {
    name: "수학 기초반",
    teacher: "김선생님",
    time: "월, 수, 금 09:00",
    room: "101호",
    color: "#3B82F6",
  },
  {
    name: "영어 회화반",
    teacher: "이선생님",
    time: "월, 금 14:00",
    room: "102호",
    color: "#10B981",
  },
  {
    name: "과학 심화반",
    teacher: "박선생님",
    time: "화, 목 10:00",
    room: "103호",
    color: "#F59E0B",
  },
];

export default function StudentSchedule() {
  const { user, isAuthenticated } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(0);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const getScheduleForDay = (day: string) => {
    return (SCHEDULE_DATA as any)[day] || [];
  };

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
            📅 시간표
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: theme.colors.text.tertiary }}
          >
            내 수강 시간표
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 주 선택 */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            ← 이전
          </Button>
          <h2
            className="text-lg font-semibold"
            style={{ color: theme.colors.text.primary }}
          >
            {new Date().toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })}{" "}
            주
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            다음 →
          </Button>
        </div>

        {/* 시간표 그리드 */}
        <Card variant="elevated" padding="md" className="overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottomColor: theme.colors.border.primary,
                    borderBottomWidth: "1px",
                  }}
                >
                  <th
                    className="py-3 px-4 text-left font-medium w-20"
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    시간
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="py-3 px-4 text-center font-medium min-w-32"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr
                    key={time}
                    style={{
                      borderBottomColor: theme.colors.border.primary,
                      borderBottomWidth: "1px",
                    }}
                  >
                    <td
                      className="py-3 px-4 font-medium"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {time}
                    </td>
                    {DAYS.map((day) => {
                      const classInfo = getScheduleForDay(day).find(
                        (c: any) => c.time === time
                      );
                      return (
                        <td key={`${day}-${time}`} className="py-3 px-4 text-center">
                          {classInfo ? (
                            <div
                              className="rounded-lg p-2 text-left"
                              style={{
                                backgroundColor: theme.colors.background.secondary,
                                borderLeftWidth: "3px",
                                borderLeftColor: CLASSES.find(
                                  (c) => c.name === classInfo.class
                                )?.color,
                              }}
                            >
                              <p
                                className="font-semibold text-xs"
                                style={{ color: theme.colors.text.primary }}
                              >
                                {classInfo.class}
                              </p>
                              <p
                                className="text-xs mt-1"
                                style={{ color: theme.colors.text.tertiary }}
                              >
                                {classInfo.teacher}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: theme.colors.text.tertiary }}
                              >
                                {classInfo.room}
                              </p>
                            </div>
                          ) : (
                            <p
                              className="text-xs"
                              style={{ color: theme.colors.text.tertiary }}
                            >
                              -
                            </p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 수강 중인 반 목록 */}
        <div>
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: theme.colors.text.primary }}
          >
            수강 중인 반
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CLASSES.map((cls, idx) => (
              <Card
                key={idx}
                variant="elevated"
                padding="md"
                className="hover:shadow-lg transition-shadow"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: cls.color,
                }}
              >
                <div>
                  <p
                    className="font-semibold mb-3"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {cls.name}
                  </p>

                  <div className="space-y-2">
                    {/* 강사 */}
                    <div
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        강사
                      </p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {cls.teacher}
                      </p>
                    </div>

                    {/* 시간 */}
                    <div
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        시간
                      </p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {cls.time}
                      </p>
                    </div>

                    {/* 장소 */}
                    <div
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        장소
                      </p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {cls.room}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
