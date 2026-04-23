import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import {
  DAY_LABELS,
  LIVE_QUERY_OPTIONS,
  STUDENT_NAV_ITEMS,
  formatDate,
  formatTime,
  getCommuteStatusMeta,
  getLatestMockExam,
} from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { uiThemeVars } from "@/styles/runtime-theme";
import { Bell, CalendarClock, ChevronRight, Clock3, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

type CalendarExam = {
  id: number;
  examName: string;
  examDate: string | Date;
  examEndDate?: string | Date | null;
  subject?: string | null;
  description?: string | null;
};

type CalendarEvent = {
  id: number;
  eventName: string;
  eventDate: string | Date;
  eventEndDate?: string | Date | null;
  eventType?: "holiday" | "event" | "notice" | "other" | null;
  description?: string | null;
};

type RegularScheduleEntry = {
  id: string;
  className: string;
  subject: string;
  room?: string | null;
  teacherName?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function startOfDay(value = new Date()) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDayOrderFromToday(dayOfWeek: number) {
  const today = new Date().getDay();
  return (dayOfWeek - today + 7) % 7;
}

function formatDayOfWeek(dayOfWeek: number) {
  return `${DAY_LABELS[dayOfWeek]}요일`;
}

function formatShortDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function formatDateRange(start?: string | Date | null, end?: string | Date | null) {
  if (!start) return "-";
  const startLabel = formatShortDate(start);
  if (!end) return startLabel;
  return `${startLabel} ~ ${formatShortDate(end)}`;
}

function formatDday(value?: string | Date | null) {
  if (!value) return "-";
  const target = startOfDay(new Date(value));
  const today = startOfDay(new Date());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return "종료";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}분`;
  }

  if (minutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${minutes}분`;
}

function getEventLabel(eventType?: CalendarEvent["eventType"]) {
  if (eventType === "holiday") return "다가오는 휴원";
  if (eventType === "notice") return "다가오는 공지 일정";
  return "다가오는 일정";
}

function getEventTone(eventType?: CalendarEvent["eventType"]) {
  if (eventType === "holiday") {
    return {
      accent: "#ef4444",
      soft: "rgba(239, 68, 68, 0.14)",
    };
  }

  if (eventType === "notice") {
    return {
      accent: "#f59e0b",
      soft: "rgba(245, 158, 11, 0.16)",
    };
  }

  return {
    accent: "#06b6d4",
    soft: "rgba(6, 182, 212, 0.16)",
  };
}

export default function StudentHome() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const examsQuery = trpc.calendar.listExams.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const eventsQuery = trpc.calendar.listEvents.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const studentRequestsQuery = trpc.calendar.listStudentRequests.useQuery(
    undefined,
    LIVE_QUERY_OPTIONS,
  );
  const [, setLocation] = useLocation();
  const snapshot = snapshots[0];
  const latestMockExam = snapshot ? getLatestMockExam(snapshot.grades.mockExams) : null;

  const timelineHighlight = useMemo(() => {
    const today = startOfDay(new Date());
    const ownRequests = ((studentRequestsQuery.data ?? []) as any[])
      .filter((request) => request.status !== "rejected")
      .filter(
        (request) =>
          startOfDay(new Date(request.examDate)).getTime() >= today.getTime(),
      )
      .sort(
        (left, right) =>
          new Date(left.examDate).getTime() - new Date(right.examDate).getTime(),
      );

    if (ownRequests.length > 0) {
      const nextRequest = ownRequests[0];
      const statusLabel =
        nextRequest.status === "approved" ? "승인 완료" : "승인 대기";

      return {
        label: `내 시험 일정 · ${statusLabel}`,
        title: nextRequest.title,
        subtitle:
          nextRequest.subject ||
          nextRequest.description ||
          "학생이 직접 등록한 시험 일정이 관리자 확인을 기다리고 있습니다.",
        dday: formatDday(nextRequest.examDate),
        dateLabel: formatDateRange(nextRequest.examDate, nextRequest.examEndDate),
        accent: nextRequest.status === "approved" ? "#22c55e" : "#f97316",
        soft:
          nextRequest.status === "approved"
            ? "rgba(34, 197, 94, 0.14)"
            : "rgba(249, 115, 22, 0.14)",
      };
    }

    const exams = ((examsQuery.data ?? []) as CalendarExam[])
      .filter((exam) => startOfDay(new Date(exam.examDate)).getTime() >= today.getTime())
      .sort(
        (left, right) =>
          new Date(left.examDate).getTime() - new Date(right.examDate).getTime(),
      );

    if (exams.length > 0) {
      const nextExam = exams[0];
      return {
        label: "다가오는 시험",
        title: nextExam.examName,
        subtitle:
          nextExam.subject || nextExam.description || "가장 가까운 시험 일정을 준비하세요.",
        dday: formatDday(nextExam.examDate),
        dateLabel: formatDateRange(nextExam.examDate, nextExam.examEndDate),
        accent: "#f97316",
        soft: "rgba(249, 115, 22, 0.14)",
      };
    }

    const events = ((eventsQuery.data ?? []) as CalendarEvent[])
      .filter((event) => startOfDay(new Date(event.eventDate)).getTime() >= today.getTime())
      .sort(
        (left, right) =>
          new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
      );

    if (events.length > 0) {
      const nextEvent = events[0];
      const tone = getEventTone(nextEvent.eventType);
      return {
        label: getEventLabel(nextEvent.eventType),
        title: nextEvent.eventName,
        subtitle:
          nextEvent.description || "다가오는 학원 일정을 확인하세요.",
        dday: formatDday(nextEvent.eventDate),
        dateLabel: formatDateRange(nextEvent.eventDate, nextEvent.eventEndDate),
        accent: tone.accent,
        soft: tone.soft,
      };
    }

    return null;
  }, [eventsQuery.data, examsQuery.data, studentRequestsQuery.data]);

  const regularSchedules = useMemo<RegularScheduleEntry[]>(() => {
    if (!snapshot) return [];

    return snapshot.classes
      .flatMap((classItem: any) =>
        (classItem.schedules ?? []).map((schedule: any) => ({
          id: `${classItem.id}-${schedule.id}`,
          className: classItem.name,
          subject: classItem.subject,
          room: classItem.room,
          teacherName: classItem.teacherName,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })),
      )
      .sort((left, right) => {
        const dayOrderDiff = getDayOrderFromToday(left.dayOfWeek) - getDayOrderFromToday(right.dayOfWeek);
        if (dayOrderDiff !== 0) return dayOrderDiff;
        return left.startTime.localeCompare(right.startTime);
      });
  }, [snapshot]);

  const weeklyClassMinutes = useMemo(
    () =>
      regularSchedules.reduce(
        (total, item) =>
          total + Math.max(0, parseTimeToMinutes(item.endTime) - parseTimeToMinutes(item.startTime)),
        0,
      ),
    [regularSchedules],
  );

  const todayStatusMeta = snapshot ? getCommuteStatusMeta(snapshot.commute.todayStatus) : null;

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout
        title="학생 홈"
        subtitle="학습 현황"
        navItems={STUDENT_NAV_ITEMS}
        variant="portal-light"
      >
        <Card variant="elevated" padding="lg">
          <EmptyState
            title="연결된 학생 정보가 없습니다."
            description="학생 계정과 학생 레코드가 연결되어야 데이터를 확인할 수 있습니다."
          />
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      title={`${snapshot.student.name} 학생`}
      subtitle="D-day, 공지, 정규 수업시간을 가장 먼저 확인하세요."
      navItems={STUDENT_NAV_ITEMS}
      variant="portal-light"
    >
      <div className="mx-auto max-w-5xl space-y-3 sm:space-y-6">
        <Card
          variant="elevated"
          padding="md"
          className="overflow-hidden rounded-[28px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.96) 0%, rgba(56, 86, 247, 0.94) 52%, rgba(45, 212, 191, 0.92) 100%)",
            borderColor: "rgba(255, 255, 255, 0.24)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                  color: "#ffffff",
                }}
              >
                <Sparkles className="h-4 w-4" />
                {timelineHighlight?.label || "시험 일정"}
              </div>
              <h2 className="mt-3 break-keep text-xl font-bold leading-tight text-white sm:mt-4 sm:text-3xl">
                {timelineHighlight?.title || "다가오는 시험을 기다리는 중입니다."}
              </h2>
              <p className="mt-2 break-keep text-[13px] leading-5 text-white/88 sm:mt-3 sm:text-base sm:leading-6">
                {timelineHighlight?.subtitle ||
                  "관리자 페이지에서 시험이나 중요한 일정을 등록하면 여기에 가장 먼저 표시됩니다."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <span
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium sm:text-xs"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                  }}
                >
                  {timelineHighlight?.dateLabel || "아직 일정이 없습니다"}
                </span>
                {todayStatusMeta ? (
                  <span
                    className="rounded-full px-3 py-1.5 text-[11px] font-medium sm:text-xs"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.18)",
                      color: "#ffffff",
                    }}
                  >
                    오늘 상태 · {todayStatusMeta.label}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              className="shrink-0 rounded-[20px] px-3 py-3 text-center sm:rounded-[24px] sm:px-5 sm:py-4"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.14)",
                minWidth: 78,
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72 sm:text-[11px] sm:tracking-[0.22em]">
                D-Day
              </p>
              <p className="mt-1.5 text-xl font-black text-white sm:mt-2 sm:text-3xl">
                {timelineHighlight?.dday || "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" className="rounded-[28px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(37, 99, 235, 0.12)", color: uiThemeVars.accentPrimary }}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                  학원 공지사항
                </p>
                <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                  중요한 공지를 먼저 확인하세요.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLocation("/student/notices")}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold"
              style={{
                backgroundColor: uiThemeVars.accentSoft,
                color: uiThemeVars.accentPrimary,
              }}
            >
              전체 보기
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {snapshot.notices.slice(0, 3).map((notice: any, index: number) => (
              <div
                key={notice.id}
                className="rounded-3xl border px-4 py-4"
                style={{
                  backgroundColor: index === 0 ? "rgba(37, 99, 235, 0.06)" : uiThemeVars.surfaceAlt,
                  borderColor: index === 0 ? "rgba(37, 99, 235, 0.16)" : uiThemeVars.borderPrimary,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "info" : "default"} size="sm">
                        공지
                      </Badge>
                      <span className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 break-keep text-base font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                      {notice.title}
                    </p>
                    <p
                      className="mt-2 line-clamp-2 break-keep text-sm leading-6"
                      style={{ color: uiThemeVars.textSecondary }}
                    >
                      {notice.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {snapshot.notices.length === 0 ? (
              <div
                className="rounded-3xl px-4 py-10 text-center text-sm"
                style={{ backgroundColor: uiThemeVars.surfaceAlt, color: uiThemeVars.textTertiary }}
              >
                현재 게시된 공지가 없습니다.
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          variant="elevated"
          padding="lg"
          className="rounded-[28px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(247, 250, 255, 1) 100%)",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }}
              >
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                  나의 정규 수업시간
                </p>
                <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                  주간 {regularSchedules.length}회 · 총 {formatMinutes(weeklyClassMinutes)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLocation("/student/schedule")}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold"
              style={{
                backgroundColor: "rgba(14, 165, 233, 0.12)",
                color: "#0284c7",
              }}
            >
              시간표 보기
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {regularSchedules.slice(0, 6).map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-3xl border px-4 py-4"
                style={{
                  backgroundColor: uiThemeVars.surface,
                  borderColor: uiThemeVars.borderPrimary,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 rounded-2xl px-3 py-2 text-center"
                    style={{
                      backgroundColor: "rgba(37, 99, 235, 0.1)",
                      color: uiThemeVars.accentPrimary,
                      minWidth: 74,
                    }}
                  >
                    <p className="text-xs font-semibold">{formatDayOfWeek(schedule.dayOfWeek)}</p>
                    <p className="mt-1 text-sm font-bold">{schedule.startTime}</p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-keep text-base font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                      {schedule.className}
                    </p>
                    <p className="mt-1 text-sm font-medium" style={{ color: uiThemeVars.accentPrimary }}>
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                    <p className="mt-2 break-keep text-sm" style={{ color: uiThemeVars.textTertiary }}>
                      {schedule.subject}
                      {schedule.room ? ` · ${schedule.room}` : ""}
                      {schedule.teacherName ? ` · ${schedule.teacherName}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {regularSchedules.length === 0 ? (
              <div
                className="rounded-3xl px-4 py-10 text-center text-sm"
                style={{ backgroundColor: uiThemeVars.surfaceAlt, color: uiThemeVars.textTertiary }}
              >
                등록된 정규 수업시간이 없습니다.
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "오늘 상태",
              value: todayStatusMeta?.label ?? "-",
              accent: todayStatusMeta?.color ?? uiThemeVars.accentPrimary,
            },
            {
              label: "최근 등원",
              value: formatTime(snapshot.commute.latestCheckInAt),
              accent: uiThemeVars.success,
            },
            {
              label: "최근 하원",
              value: formatTime(snapshot.commute.latestCheckOutAt),
              accent: uiThemeVars.info,
            },
            {
              label: "최근 내신",
              value: snapshot.summary.latestSchoolGrade ? `${snapshot.summary.latestSchoolGrade}등급` : "-",
              accent: uiThemeVars.warning,
            },
          ].map((item) => (
            <Card key={item.label} variant="elevated" padding="md" className="rounded-[24px]">
              <p className="text-xs font-medium" style={{ color: uiThemeVars.textTertiary }}>
                {item.label}
              </p>
              <p
                className="mt-3 break-keep text-xl font-bold sm:text-2xl"
                style={{ color: item.accent }}
              >
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card variant="elevated" padding="lg" className="rounded-[28px]">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: uiThemeVars.success }}
              >
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                  최근 등하원 기록
                </p>
                <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                  최근 기록 3개를 바로 확인합니다.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {snapshot.commute.records.slice(0, 3).map((record: any) => {
                const meta = getCommuteStatusMeta(record.status);
                return (
                  <div
                    key={record.id}
                    className="rounded-3xl border px-4 py-4"
                    style={{
                      backgroundColor: uiThemeVars.surfaceAlt,
                      borderColor: uiThemeVars.borderPrimary,
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold" style={{ color: uiThemeVars.textPrimary }}>
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

              {snapshot.commute.records.length === 0 ? (
                <p style={{ color: uiThemeVars.textTertiary }}>아직 기록된 등하원 내역이 없습니다.</p>
              ) : null}
            </div>
          </Card>

          <div className="space-y-4">
            <Card
              variant="elevated"
              padding="lg"
              className="rounded-[28px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(37, 99, 235, 0.08) 58%, rgba(45, 212, 191, 0.12) 100%)",
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: uiThemeVars.accentPrimary }}>
                Recent Score
              </p>
              <h2 className="mt-2 text-xl font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                최근 성적
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
                    최근 내신: {snapshot.grades.latestSchoolGrade?.schoolGrade ?? "-"}등급
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6" style={{ color: uiThemeVars.textTertiary }}>
                  등록된 모의고사나 내신 데이터가 아직 없습니다.
                </p>
              )}
            </Card>

            <Card variant="elevated" padding="lg" className="rounded-[28px]">
              <p className="text-sm font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                빠른 이동
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { href: "/student/schedule", label: "시간표" },
                  { href: "/student/attendance", label: "출결" },
                  { href: "/student/notices", label: "공지" },
                  { href: "/student/profile", label: "프로필" },
                ].map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setLocation(item.href)}
                    className="rounded-2xl px-4 py-4 text-sm font-semibold"
                    style={{
                      backgroundColor: uiThemeVars.surfaceAlt,
                      color: uiThemeVars.textPrimary,
                      border: `1px solid ${uiThemeVars.borderPrimary}`,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
