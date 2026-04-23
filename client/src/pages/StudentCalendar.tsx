import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import Button from "@/components/common/Button";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import { DAY_LABELS, LIVE_QUERY_OPTIONS, STUDENT_NAV_ITEMS } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { uiThemeVars } from "@/styles/runtime-theme";
import {
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RequestStatus = "pending" | "approved" | "rejected";

type StudentRequest = {
  id: number;
  title: string;
  examDate: string | Date;
  examEndDate?: string | Date | null;
  subject?: string | null;
  description?: string | null;
  status: RequestStatus;
  linkedExamScheduleId?: number | null;
  createdAt?: string | Date | null;
};

type CalendarDisplayItem = {
  key: string;
  title: string;
  date: string;
  endDate?: string | null;
  description?: string | null;
  subject?: string | null;
  source: "request" | "exam" | "event";
  tone: "pending" | "approved" | "rejected" | "event";
};

const INITIAL_FORM = {
  title: "",
  examDate: "",
  examEndDate: "",
  subject: "",
  description: "",
};

function toDayKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDayKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function expandDayKeys(start: string, end?: string | null) {
  const results: string[] = [];
  const cursor = fromDayKey(start);
  const last = end ? fromDayKey(end) : fromDayKey(start);
  let guard = 0;

  while (cursor <= last && guard < 120) {
    results.push(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return results;
}

function getMonthMatrix(currentMonth: Date) {
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function formatFullDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatRange(start?: string | Date | null, end?: string | Date | null) {
  if (!start) return "-";
  const startLabel = formatFullDate(start);
  if (!end) return startLabel;
  return `${startLabel} ~ ${formatFullDate(end)}`;
}

function formatDday(value?: string | Date | null) {
  if (!value) return "-";
  const target = startOfDay(new Date(value));
  const today = startOfDay();
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "종료";
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
}

function getStatusMeta(status: RequestStatus) {
  if (status === "approved") {
    return {
      label: "승인 완료",
      variant: "success" as const,
      tone: "approved" as const,
      accent: uiThemeVars.success,
    };
  }
  if (status === "rejected") {
    return {
      label: "반려",
      variant: "error" as const,
      tone: "rejected" as const,
      accent: uiThemeVars.error,
    };
  }
  return {
    label: "승인 대기",
    variant: "warning" as const,
    tone: "pending" as const,
    accent: uiThemeVars.warning,
  };
}

function getCalendarTone(tone: CalendarDisplayItem["tone"]) {
  if (tone === "approved") {
    return {
      backgroundColor: "rgba(34, 197, 94, 0.14)",
      color: uiThemeVars.success,
    };
  }
  if (tone === "rejected") {
    return {
      backgroundColor: "rgba(239, 68, 68, 0.14)",
      color: uiThemeVars.error,
    };
  }
  if (tone === "pending") {
    return {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      color: uiThemeVars.warning,
    };
  }
  return {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    color: uiThemeVars.accentPrimary,
  };
}

export default function StudentCalendar() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const snapshot = snapshots[0];
  const utils = trpc.useUtils();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDayKey(new Date()));
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    examDate: toDayKey(new Date()),
  }));

  const requestQuery = trpc.calendar.listStudentRequests.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const examsQuery = trpc.calendar.listExams.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const eventsQuery = trpc.calendar.listEvents.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const createRequest = trpc.calendar.createStudentRequest.useMutation();
  const updateRequest = trpc.calendar.updateStudentRequest.useMutation();
  const deleteRequest = trpc.calendar.deleteStudentRequest.useMutation();

  const requestItems = (requestQuery.data ?? []) as StudentRequest[];

  const nextOwnExam = useMemo(() => {
    const today = startOfDay().getTime();
    return [...requestItems]
      .filter((item) => item.status !== "rejected")
      .filter((item) => startOfDay(new Date(item.examDate)).getTime() >= today)
      .sort(
        (left, right) =>
          new Date(left.examDate).getTime() - new Date(right.examDate).getTime(),
      )[0];
  }, [requestItems]);

  const calendarItems = useMemo<CalendarDisplayItem[]>(() => {
    const pendingOrRejectedRequests = requestItems
      .filter((item) => !(item.status === "approved" && item.linkedExamScheduleId))
      .map((item) => ({
        key: `request-${item.id}`,
        title: item.title,
        date: toDayKey(item.examDate),
        endDate: item.examEndDate ? toDayKey(item.examEndDate) : null,
        description: item.description ?? null,
        subject: item.subject ?? null,
        source: "request" as const,
        tone: getStatusMeta(item.status).tone,
      }));

    const exams =
      examsQuery.data?.map((item: any) => ({
        key: `exam-${item.id}`,
        title: item.examName,
        date: toDayKey(item.examDate),
        endDate: item.examEndDate ? toDayKey(item.examEndDate) : null,
        description: item.description ?? null,
        subject: item.subject ?? null,
        source: "exam" as const,
        tone: "approved" as const,
      })) ?? [];

    const events =
      eventsQuery.data?.map((item: any) => ({
        key: `event-${item.id}`,
        title: item.eventName,
        date: toDayKey(item.eventDate),
        endDate: item.eventEndDate ? toDayKey(item.eventEndDate) : null,
        description: item.description ?? null,
        subject: null,
        source: "event" as const,
        tone: "event" as const,
      })) ?? [];

    return [...pendingOrRejectedRequests, ...exams, ...events].sort(
      (left, right) => fromDayKey(left.date).getTime() - fromDayKey(right.date).getTime(),
    );
  }, [eventsQuery.data, examsQuery.data, requestItems]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarDisplayItem[]>();
    calendarItems.forEach((item) => {
      expandDayKeys(item.date, item.endDate).forEach((dayKey) => {
        const entries = map.get(dayKey) ?? [];
        entries.push(item);
        map.set(dayKey, entries);
      });
    });
    return map;
  }, [calendarItems]);

  const selectedItems = itemsByDay.get(selectedDate) ?? [];
  const monthDays = getMonthMatrix(currentMonth);

  const requestSummary = useMemo(
    () => ({
      pending: requestItems.filter((item) => item.status === "pending").length,
      approved: requestItems.filter((item) => item.status === "approved").length,
      rejected: requestItems.filter((item) => item.status === "rejected").length,
    }),
    [requestItems],
  );

  const refreshCalendar = async () => {
    await Promise.all([
      utils.calendar.listStudentRequests.invalidate(),
      utils.calendar.listExams.invalidate(),
      utils.calendar.listEvents.invalidate(),
    ]);
  };

  const resetForm = () => {
    setEditingRequestId(null);
    setForm({
      ...INITIAL_FORM,
      examDate: selectedDate,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.examDate) {
      toast.error("시험명과 시험일을 입력해 주세요.");
      return;
    }

    try {
      if (editingRequestId) {
        await updateRequest.mutateAsync({
          id: editingRequestId,
          title: form.title.trim(),
          examDate: form.examDate,
          examEndDate: form.examEndDate || undefined,
          subject: form.subject || undefined,
          description: form.description || undefined,
        });
        toast.success("시험 일정 요청을 수정했습니다.");
      } else {
        await createRequest.mutateAsync({
          title: form.title.trim(),
          examDate: form.examDate,
          examEndDate: form.examEndDate || undefined,
          subject: form.subject || undefined,
          description: form.description || undefined,
        });
        toast.success("시험 일정 요청을 등록했습니다.");
      }

      await refreshCalendar();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "시험 일정 저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (item: StudentRequest) => {
    setEditingRequestId(item.id);
    setSelectedDate(toDayKey(item.examDate));
    setForm({
      title: item.title,
      examDate: toDayKey(item.examDate),
      examEndDate: item.examEndDate ? toDayKey(item.examEndDate) : "",
      subject: item.subject ?? "",
      description: item.description ?? "",
    });
  };

  const handleDelete = async (requestId: number) => {
    try {
      await deleteRequest.mutateAsync({ id: requestId });
      toast.success("시험 일정 요청을 삭제했습니다.");
      await refreshCalendar();
      if (editingRequestId === requestId) {
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.message || "시험 일정 삭제 중 오류가 발생했습니다.");
    }
  };

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout
        title="학생 캘린더"
        subtitle="시험과 학원 일정을 한 화면에서 확인하세요."
        navItems={STUDENT_NAV_ITEMS}
        variant="portal-light"
      >
        <Card variant="elevated" padding="lg">
          <EmptyState
            title="연결된 학생 정보가 없습니다."
            description="학생 계정과 학생 정보가 연결되어야 캘린더를 사용할 수 있습니다."
          />
        </Card>
      </PortalLayout>
    );
  }

  const nextOwnExamMeta = nextOwnExam ? getStatusMeta(nextOwnExam.status) : null;

  return (
    <PortalLayout
      title={`${snapshot.student.name} 학생 캘린더`}
      subtitle="내 시험 요청을 등록하고 승인 상태를 바로 확인하세요."
      navItems={STUDENT_NAV_ITEMS}
      variant="portal-light"
    >
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <Card
          variant="elevated"
          padding="lg"
          className="overflow-hidden rounded-[28px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.96) 0%, rgba(99, 102, 241, 0.92) 48%, rgba(45, 212, 191, 0.90) 100%)",
            borderColor: "rgba(255,255,255,0.26)",
          }}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_260px]">
            <div className="space-y-3">
              <Badge
                variant="info"
                className="border-white/30 bg-white/15 text-white"
                size="sm"
              >
                <CalendarDays className="mr-1 h-3.5 w-3.5" />
                학생 시험 캘린더
              </Badge>
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  {nextOwnExam ? nextOwnExam.title : "다음 시험을 등록해 주세요."}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/85 sm:text-base">
                  {nextOwnExam
                    ? `${formatRange(nextOwnExam.examDate, nextOwnExam.examEndDate)} · ${nextOwnExam.subject || "시험 과목 미입력"}`
                    : "학생이 등록한 시험은 승인 전까지 내 캘린더에서 상태와 함께 표시됩니다."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                  승인 대기 {requestSummary.pending}건
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                  승인 완료 {requestSummary.approved}건
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                  반려 {requestSummary.rejected}건
                </span>
              </div>
            </div>

            <div className="rounded-[24px] bg-white/12 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                NEXT D-DAY
              </p>
              <p className="mt-3 text-4xl font-black">{formatDday(nextOwnExam?.examDate)}</p>
              <p className="mt-2 text-sm text-white/78">
                {nextOwnExamMeta?.label || "등록된 시험 없음"}
              </p>
              <p className="mt-4 text-xs text-white/70">
                학교: {snapshot.student.schoolName || "미입력"}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <Card variant="elevated" padding="lg" className="rounded-[28px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: uiThemeVars.textTertiary }}>
                  월간 캘린더
                </p>
                <h3 className="mt-1 text-2xl font-bold" style={{ color: uiThemeVars.textPrimary }}>
                  {currentMonth.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                  })}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                    )
                  }
                  className="rounded-2xl border p-2"
                  style={{
                    borderColor: uiThemeVars.borderPrimary,
                    backgroundColor: uiThemeVars.surfaceAlt,
                    color: uiThemeVars.textPrimary,
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                    )
                  }
                  className="rounded-2xl border p-2"
                  style={{
                    borderColor: uiThemeVars.borderPrimary,
                    backgroundColor: uiThemeVars.surfaceAlt,
                    color: uiThemeVars.textPrimary,
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2">
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center text-xs font-semibold"
                  style={{ color: uiThemeVars.textTertiary }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
                const dayKey = toDayKey(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected = dayKey === selectedDate;
                const dayItems = itemsByDay.get(dayKey) ?? [];

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dayKey);
                      if (!editingRequestId) {
                        setForm((current) => ({ ...current, examDate: dayKey }));
                      }
                    }}
                    className="min-h-[104px] rounded-[22px] border p-2 text-left align-top transition-colors"
                    style={{
                      backgroundColor: isSelected ? "rgba(37, 99, 235, 0.10)" : uiThemeVars.surfaceAlt,
                      borderColor: isSelected ? uiThemeVars.accentPrimary : uiThemeVars.borderPrimary,
                      opacity: isCurrentMonth ? 1 : 0.45,
                    }}
                  >
                    <div className="mb-2 text-sm font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 2).map((item) => {
                        const tone = getCalendarTone(item.tone);
                        return (
                          <div
                            key={item.key}
                            className="truncate rounded-full px-2 py-1 text-[11px] font-semibold"
                            style={tone}
                          >
                            {item.title}
                          </div>
                        );
                      })}
                      {dayItems.length > 2 ? (
                        <div className="text-[11px]" style={{ color: uiThemeVars.textTertiary }}>
                          +{dayItems.length - 2}건 더보기
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="space-y-4">
            <Card variant="elevated" padding="lg" className="rounded-[28px]">
              <div className="mb-3 flex items-center gap-2">
                <CalendarPlus2 className="h-5 w-5" style={{ color: uiThemeVars.accentPrimary }} />
                <div>
                  <h3 className="text-lg font-bold" style={{ color: uiThemeVars.textPrimary }}>
                    시험 등록
                  </h3>
                  <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                    등록 후 관리자 승인 전까지는 승인 대기 상태로 표시됩니다.
                  </p>
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="시험명"
                  className="w-full rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor: uiThemeVars.surfaceAlt,
                    borderColor: uiThemeVars.borderPrimary,
                    color: uiThemeVars.textPrimary,
                  }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.examDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setForm((current) => ({ ...current, examDate: event.target.value }));
                    }}
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: uiThemeVars.surfaceAlt,
                      borderColor: uiThemeVars.borderPrimary,
                      color: uiThemeVars.textPrimary,
                    }}
                  />
                  <input
                    type="date"
                    value={form.examEndDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, examEndDate: event.target.value }))
                    }
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: uiThemeVars.surfaceAlt,
                      borderColor: uiThemeVars.borderPrimary,
                      color: uiThemeVars.textPrimary,
                    }}
                  />
                </div>
                <input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="과목"
                  className="w-full rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor: uiThemeVars.surfaceAlt,
                    borderColor: uiThemeVars.borderPrimary,
                    color: uiThemeVars.textPrimary,
                  }}
                />
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="시험 범위 또는 메모"
                  className="min-h-28 w-full rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor: uiThemeVars.surfaceAlt,
                    borderColor: uiThemeVars.borderPrimary,
                    color: uiThemeVars.textPrimary,
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={createRequest.isPending || updateRequest.isPending}
                  >
                    {editingRequestId ? "수정 저장" : "시험 등록"}
                  </Button>
                  {editingRequestId ? (
                    <Button type="button" variant="secondary" onClick={resetForm}>
                      취소
                    </Button>
                  ) : null}
                </div>
              </form>
            </Card>

            <Card variant="elevated" padding="lg" className="rounded-[28px]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: uiThemeVars.textPrimary }}>
                    {formatFullDate(selectedDate)}
                  </h3>
                  <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                    선택한 날짜의 전체 일정 {selectedItems.length}건
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedItems.length === 0 ? (
                  <EmptyState
                    title="선택한 날짜 일정이 없습니다."
                    description="새 시험을 등록하거나 다른 날짜를 선택해 보세요."
                  />
                ) : (
                  selectedItems.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-[22px] border px-4 py-4"
                      style={{
                        backgroundColor: uiThemeVars.surfaceAlt,
                        borderColor: uiThemeVars.borderPrimary,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: uiThemeVars.textTertiary }}>
                            {item.subject || item.description || "설명 없음"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.tone === "approved"
                              ? "success"
                              : item.tone === "rejected"
                                ? "error"
                                : item.tone === "pending"
                                  ? "warning"
                                  : "info"
                          }
                          size="sm"
                        >
                          {item.source === "request"
                            ? item.tone === "pending"
                              ? "승인대기"
                              : item.tone === "rejected"
                                ? "반려"
                                : "승인완료"
                            : item.source === "exam"
                              ? "관리자 시험"
                              : "학원 일정"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <Card variant="elevated" padding="lg" className="rounded-[28px]">
          <div className="mb-4 flex items-center gap-3">
            <Clock3 className="h-5 w-5" style={{ color: uiThemeVars.accentPrimary }} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: uiThemeVars.textPrimary }}>
                내 시험 등록 목록
              </h3>
              <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                승인 대기 상태에서는 수정과 삭제가 가능합니다.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {requestItems.length === 0 ? (
              <EmptyState
                title="아직 등록한 시험이 없습니다."
                description="시험 일정을 입력하면 관리자 승인 후 관리자 캘린더에도 반영됩니다."
              />
            ) : (
              requestItems.map((item) => {
                const statusMeta = getStatusMeta(item.status);
                return (
                  <div
                    key={item.id}
                    className="rounded-[24px] border px-4 py-4"
                    style={{
                      backgroundColor: uiThemeVars.surfaceAlt,
                      borderColor: uiThemeVars.borderPrimary,
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                            {item.title}
                          </p>
                          <Badge variant={statusMeta.variant} size="sm">
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                          {formatRange(item.examDate, item.examEndDate)}
                        </p>
                        <p className="mt-1 text-sm" style={{ color: uiThemeVars.textPrimary }}>
                          {item.subject || "과목 미입력"}
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: uiThemeVars.textTertiary }}>
                          {item.description || "메모 없음"}
                        </p>
                      </div>

                      {item.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-2xl border p-2"
                            style={{
                              borderColor: uiThemeVars.borderPrimary,
                              backgroundColor: uiThemeVars.surface,
                              color: uiThemeVars.textPrimary,
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-2xl border p-2"
                            style={{
                              borderColor: "rgba(239, 68, 68, 0.25)",
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                              color: uiThemeVars.error,
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : item.status === "approved" ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          관리자 캘린더 반영 완료
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
                          <XCircle className="h-4 w-4" />
                          재등록 필요
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
