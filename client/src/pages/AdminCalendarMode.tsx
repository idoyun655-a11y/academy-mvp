import { useAuth } from "@/_core/hooks/useAuth";
import Button from "@/components/common/Button";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type CalendarItem = {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  type: "exam" | "event" | "holiday" | "notice" | "other";
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toDayKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDayKey(dayKey: string) {
  return new Date(`${dayKey}T00:00:00`);
}

function getMonthMatrix(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function formatClock(value: Date) {
  return value.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateHeader(value: string | Date) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatCompactDate(value: string | Date) {
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function getTypeLabel(type: CalendarItem["type"]) {
  if (type === "exam") return "시험";
  if (type === "holiday") return "휴일";
  if (type === "notice") return "공지";
  if (type === "other") return "기타";
  return "행사";
}

function getTypeBadgeVariant(type: CalendarItem["type"]) {
  if (type === "exam") return "error";
  if (type === "holiday") return "info";
  if (type === "notice") return "warning";
  return "success";
}

function getRangeLabel(item: CalendarItem) {
  if (!item.endDate || item.endDate === item.date) {
    return formatCompactDate(item.date);
  }

  return `${formatCompactDate(item.date)} - ${formatCompactDate(item.endDate)}`;
}

function expandDayKeys(start: string, end?: string | null) {
  const keys: string[] = [];
  const current = fromDayKey(start);
  const last = end ? fromDayKey(end) : fromDayKey(start);
  let guard = 0;

  while (current <= last && guard < 120) {
    keys.push(toDayKey(current));
    current.setDate(current.getDate() + 1);
    guard += 1;
  }

  return keys;
}

function sortByDate(items: CalendarItem[]) {
  return [...items].sort((left, right) => {
    const leftStart = fromDayKey(left.date).getTime();
    const rightStart = fromDayKey(right.date).getTime();
    if (leftStart !== rightStart) return leftStart - rightStart;
    return left.title.localeCompare(right.title, "ko");
  });
}

export default function AdminCalendarMode() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDayKey(new Date()));
  const [now, setNow] = useState(() => new Date());
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false,
  );

  const examsQuery = trpc.calendar.listExams.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const eventsQuery = trpc.calendar.listEvents.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const studentRequestsQuery = trpc.calendar.listStudentRequests.useQuery(
    { status: "pending" },
    LIVE_QUERY_OPTIONS,
  );
  const reviewStudentRequest = trpc.calendar.reviewStudentRequest.useMutation();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const items = useMemo<CalendarItem[]>(() => {
    const exams =
      examsQuery.data?.map((exam: any) => ({
        id: exam.id,
        title: exam.examName,
        description: exam.subject || exam.description || null,
        date: toDayKey(exam.examDate),
        endDate: exam.examEndDate ? toDayKey(exam.examEndDate) : null,
        type: "exam" as const,
      })) ?? [];

    const events =
      eventsQuery.data?.map((event: any) => ({
        id: event.id,
        title: event.eventName,
        description: event.description || null,
        date: toDayKey(event.eventDate),
        endDate: event.eventEndDate ? toDayKey(event.eventEndDate) : null,
        type: (event.eventType || "event") as CalendarItem["type"],
      })) ?? [];

    return sortByDate([...exams, ...events]);
  }, [eventsQuery.data, examsQuery.data]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();

    items.forEach((item) => {
      expandDayKeys(item.date, item.endDate).forEach((dayKey) => {
        const existing = map.get(dayKey) ?? [];
        existing.push(item);
        map.set(dayKey, existing);
      });
    });

    return map;
  }, [items]);

  const selectedItems = itemsByDay.get(selectedDate) ?? [];
  const days = getMonthMatrix(currentMonth);
  const todayKey = toDayKey(now);
  const upcomingItems = useMemo(() => {
    const todayStart = fromDayKey(todayKey).getTime();
    return items
      .filter((item) => {
        const endKey = item.endDate || item.date;
        return fromDayKey(endKey).getTime() >= todayStart;
      })
      .slice(0, 8);
  }, [items, todayKey]);
  const pendingStudentRequests = (studentRequestsQuery.data ?? []) as Array<any>;

  const refreshData = async () => {
    await Promise.all([
      examsQuery.refetch(),
      eventsQuery.refetch(),
      studentRequestsQuery.refetch(),
    ]);
  };

  const handleReviewStudentRequest = async (
    requestId: number,
    status: "approved" | "rejected",
  ) => {
    try {
      await reviewStudentRequest.mutateAsync({ id: requestId, status });
      toast.success(
        status === "approved"
          ? "학생 시험 요청을 승인했습니다."
          : "학생 시험 요청을 반려했습니다.",
      );
      await refreshData();
    } catch (error: any) {
      toast.error(error?.message || "학생 시험 요청 처리 중 오류가 발생했습니다.");
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // 브라우저 정책으로 차단되면 수동 전체 화면(F11)을 사용한다.
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDayKey(today));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary }}>
        인증 상태를 확인하는 중입니다.
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen overflow-y-auto px-3 py-3 md:px-4 md:py-4 xl:h-[100dvh] xl:overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(0,132,255,0.22), transparent 28%), radial-gradient(circle at top right, rgba(48,176,192,0.18), transparent 24%), #02060d",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1800px] flex-col gap-4 xl:h-full xl:min-h-0">
        <header
          className="rounded-[28px] border px-4 py-4 md:px-5 md:py-4"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            borderColor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="sm">
                  상시 표시 모드
                </Badge>
                <Badge variant="default" size="sm">
                  5초 자동 갱신
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: theme.colors.text.primary }}>
                  학원 캘린더 모드
                </h1>
                <p className="mt-1.5 text-sm md:text-base" style={{ color: theme.colors.text.secondary }}>
                  벽면 화면이나 보조 모니터에 상시 띄워둘 수 있는 일정 전용 화면입니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="rounded-[22px] border px-4 py-2.5 text-right" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(2,6,13,0.55)" }}>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: theme.colors.text.tertiary }}>
                  Current Time
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums md:text-3xl" style={{ color: theme.colors.text.primary }}>
                  {formatClock(now)}
                </p>
                <p className="mt-1 text-xs md:text-sm" style={{ color: theme.colors.text.secondary }}>
                  {formatDateHeader(now)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Button variant="secondary" onClick={jumpToToday}>
                  오늘로 이동
                </Button>
                <Button variant="secondary" onClick={toggleFullscreen}>
                  {isFullscreen ? "전체 화면 해제" : "전체 화면"}
                </Button>
                <Button onClick={() => setLocation("/admin")}>관리 화면으로 돌아가기</Button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 xl:min-h-0 xl:grid-cols-[minmax(0,1.9fr)_360px] 2xl:grid-cols-[minmax(0,1.95fr)_390px]">
          <Card variant="elevated" padding="lg" className="overflow-hidden xl:min-h-0">
            <div className="flex h-full flex-col xl:min-h-0">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                <p className="text-sm uppercase tracking-[0.2em]" style={{ color: theme.colors.text.tertiary }}>
                  Monthly Board
                </p>
                <h2 className="mt-1.5 text-2xl font-semibold md:text-3xl" style={{ color: theme.colors.text.primary }}>
                  {currentMonth.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                  })}
                </h2>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                    )
                  }
                >
                  이전달
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                    )
                  }
                >
                  다음달
                </Button>
              </div>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1.5">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="rounded-xl py-2 text-center text-sm font-semibold"
                    style={{
                      color: theme.colors.text.tertiary,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div
                className="grid flex-1 grid-cols-7 gap-1.5 xl:min-h-0"
                style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
              >
                {days.map((date) => {
                  const dayKey = toDayKey(date);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = dayKey === todayKey;
                  const isSelected = dayKey === selectedDate;
                  const dayItems = itemsByDay.get(dayKey) ?? [];

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => setSelectedDate(dayKey)}
                      className="h-full min-h-0 rounded-[18px] border p-2 text-left transition-all md:p-2.5"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(0,132,255,0.16)"
                          : isToday
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(255,255,255,0.04)",
                        borderColor: isSelected
                          ? theme.colors.accent.primary
                          : isToday
                            ? "rgba(255,255,255,0.22)"
                            : "rgba(255,255,255,0.08)",
                        opacity: isCurrentMonth ? 1 : 0.38,
                        boxShadow: isSelected ? "0 0 0 1px rgba(0,132,255,0.3)" : "none",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-semibold md:text-xl" style={{ color: theme.colors.text.primary }}>
                            {date.getDate()}
                          </p>
                          {isToday ? (
                            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: theme.colors.accent.secondary }}>
                              Today
                            </p>
                          ) : null}
                        </div>
                        {dayItems.length > 0 ? (
                          <Badge variant="default" size="sm">
                            {dayItems.length}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-2 space-y-1">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={`${dayKey}-${item.type}-${item.id}`}
                            className="truncate rounded-lg px-2 py-1 text-[10px] font-medium md:text-[11px]"
                            style={{
                              backgroundColor:
                                item.type === "exam"
                                  ? "rgba(255,59,48,0.18)"
                                  : item.type === "holiday"
                                    ? "rgba(0,180,216,0.18)"
                                    : item.type === "notice"
                                      ? "rgba(255,149,0,0.18)"
                                      : "rgba(52,199,89,0.18)",
                              color:
                                item.type === "exam"
                                  ? theme.colors.status.error
                                  : item.type === "holiday"
                                    ? theme.colors.status.info
                                    : item.type === "notice"
                                      ? theme.colors.status.warning
                                      : theme.colors.status.success,
                            }}
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 2 ? (
                          <p className="text-[10px] md:text-[11px]" style={{ color: theme.colors.text.tertiary }}>
                            +{dayItems.length - 2}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:min-h-0 xl:grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card variant="elevated" padding="lg" className="xl:min-h-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: theme.colors.text.tertiary }}>
                    Selected Day
                  </p>
                  <h3 className="mt-1.5 text-xl font-semibold 2xl:text-2xl" style={{ color: theme.colors.text.primary }}>
                    {formatDateHeader(selectedDate)}
                  </h3>
                </div>
                <Badge variant="info" size="sm">
                  {selectedItems.length}건
                </Badge>
              </div>

              <div className="mt-4 space-y-3 xl:max-h-full xl:overflow-y-auto xl:pr-1">
                {selectedItems.length === 0 ? (
                  <div
                    className="flex min-h-[180px] items-center justify-center rounded-[20px] border px-5 py-6 text-center"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border.primary,
                    }}
                  >
                    <div>
                      <p className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                        선택한 날짜에 일정이 없습니다.
                      </p>
                      <p className="mt-2 text-sm" style={{ color: theme.colors.text.tertiary }}>
                        월간 캘린더에서 다른 날짜를 선택해 보세요.
                      </p>
                    </div>
                  </div>
                ) : (
                  selectedItems.map((item) => (
                    <div
                      key={`selected-${item.type}-${item.id}`}
                      className="rounded-[20px] border p-3.5"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        borderColor: theme.colors.border.primary,
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getTypeBadgeVariant(item.type)} size="sm">
                          {getTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                          {getRangeLabel(item)}
                        </span>
                      </div>
                      <p className="mt-2.5 text-base font-semibold 2xl:text-lg" style={{ color: theme.colors.text.primary }}>
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className="mt-1.5 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card variant="elevated" padding="lg" className="xl:min-h-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: theme.colors.text.tertiary }}>
                    Upcoming
                  </p>
                  <h3 className="mt-1.5 text-xl font-semibold 2xl:text-2xl" style={{ color: theme.colors.text.primary }}>
                    예정 일정
                  </h3>
                </div>
                <Badge variant="default" size="sm">
                  {upcomingItems.length}건
                </Badge>
              </div>

              <div className="mt-4 space-y-3 xl:max-h-full xl:overflow-y-auto xl:pr-1">
                {upcomingItems.length === 0 ? (
                  <EmptyState
                    title="다가오는 일정이 없습니다."
                    description="시험이나 행사가 등록되면 여기에 자동 표시됩니다."
                  />
                ) : (
                  upcomingItems.map((item, index) => (
                    <div
                      key={`upcoming-${item.type}-${item.id}`}
                      className="rounded-[20px] border p-3.5"
                      style={{
                        backgroundColor:
                          index === 0 ? "rgba(0,132,255,0.10)" : theme.colors.background.secondary,
                        borderColor:
                          index === 0 ? "rgba(0,132,255,0.35)" : theme.colors.border.primary,
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getTypeBadgeVariant(item.type)} size="sm">
                          {getTypeLabel(item.type)}
                        </Badge>
                        <span className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                          {getRangeLabel(item)}
                        </span>
                      </div>
                      <p className="mt-2.5 text-base font-semibold 2xl:text-lg" style={{ color: theme.colors.text.primary }}>
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className="mt-1.5 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card variant="elevated" padding="lg" className="xl:min-h-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: theme.colors.text.tertiary }}>
                    Pending Review
                  </p>
                  <h3 className="mt-1.5 text-xl font-semibold 2xl:text-2xl" style={{ color: theme.colors.text.primary }}>
                    학생 제출 시험
                  </h3>
                </div>
                <Badge variant="warning" size="sm">
                  {pendingStudentRequests.length}건
                </Badge>
              </div>

              <div className="mt-4 space-y-3 xl:max-h-full xl:overflow-y-auto xl:pr-1">
                {pendingStudentRequests.length === 0 ? (
                  <EmptyState
                    title="승인 대기 요청이 없습니다."
                    description="학생이 시험 일정을 등록하면 여기에 표시됩니다."
                  />
                ) : (
                  pendingStudentRequests.map((request) => (
                    <div
                      key={`request-${request.id}`}
                      className="rounded-[20px] border p-3.5"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        borderColor: theme.colors.border.primary,
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="warning" size="sm">
                          승인대기
                        </Badge>
                        <span className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                          {request.studentName} · {request.schoolNameSnapshot || "학교 미입력"}
                        </span>
                      </div>
                      <p className="mt-2.5 text-base font-semibold 2xl:text-lg" style={{ color: theme.colors.text.primary }}>
                        {request.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
                        {new Date(request.examDate).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                        {request.subject ? ` · ${request.subject}` : ""}
                      </p>
                      {request.description ? (
                        <p className="mt-1.5 text-sm leading-6" style={{ color: theme.colors.text.secondary }}>
                          {request.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="xs"
                          onClick={() => handleReviewStudentRequest(request.id, "approved")}
                          disabled={reviewStudentRequest.isPending}
                        >
                          승인
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() => handleReviewStudentRequest(request.id, "rejected")}
                          disabled={reviewStudentRequest.isPending}
                        >
                          반려
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
