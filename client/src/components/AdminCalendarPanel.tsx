import { useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/common/Button";
import { Badge, Card } from "@/components/common/CommonComponents";
import { trpc } from "@/lib/trpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/portal";
import { theme } from "@/styles/design-system";

type CalendarMode = "exam" | "event";

type CalendarItem = {
  id: number;
  title: string;
  date: string;
  endDate?: string | null;
  description?: string | null;
  type: "exam" | "event" | "holiday" | "notice" | "other";
  mode: CalendarMode;
};

function toDayKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string | Date) {
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function getMonthMatrix(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function getTypeBadgeVariant(type: CalendarItem["type"]) {
  if (type === "exam") return "error";
  if (type === "holiday") return "info";
  if (type === "notice") return "warning";
  return "success";
}

function getTypeLabel(type: CalendarItem["type"]) {
  if (type === "exam") return "시험";
  if (type === "holiday") return "휴일";
  if (type === "notice") return "공지";
  if (type === "other") return "기타";
  return "행사";
}

const initialForm = {
  title: "",
  description: "",
  mode: "event" as CalendarMode,
  type: "event" as CalendarItem["type"],
  endDate: "",
};

export default function AdminCalendarPanel() {
  const utils = trpc.useUtils();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDayKey(new Date()));
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  const examsQuery = trpc.calendar.listExams.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const eventsQuery = trpc.calendar.listEvents.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const studentRequestsQuery = trpc.calendar.listStudentRequests.useQuery(
    { status: "pending" },
    LIVE_QUERY_OPTIONS,
  );
  const createExam = trpc.calendar.createExam.useMutation();
  const updateExam = trpc.calendar.updateExam.useMutation();
  const deleteExam = trpc.calendar.deleteExam.useMutation();
  const createEvent = trpc.calendar.createEvent.useMutation();
  const updateEvent = trpc.calendar.updateEvent.useMutation();
  const deleteEvent = trpc.calendar.deleteEvent.useMutation();
  const reviewStudentRequest = trpc.calendar.reviewStudentRequest.useMutation();

  const items = useMemo<CalendarItem[]>(() => {
    const exams =
      examsQuery.data?.map((exam: any) => ({
        id: exam.id,
        title: exam.examName,
        date: toDayKey(exam.examDate),
        endDate: exam.examEndDate ? toDayKey(exam.examEndDate) : null,
        description: exam.subject || exam.description || null,
        type: "exam" as const,
        mode: "exam" as const,
      })) ?? [];

    const events =
      eventsQuery.data?.map((event: any) => ({
        id: event.id,
        title: event.eventName,
        date: toDayKey(event.eventDate),
        endDate: event.eventEndDate ? toDayKey(event.eventEndDate) : null,
        description: event.description || null,
        type: (event.eventType || "event") as CalendarItem["type"],
        mode: "event" as const,
      })) ?? [];

    return [...exams, ...events].sort((left, right) => left.date.localeCompare(right.date));
  }, [eventsQuery.data, examsQuery.data]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const dayItems = map.get(item.date) ?? [];
      dayItems.push(item);
      map.set(item.date, dayItems);
    }
    return map;
  }, [items]);

  const selectedItems = itemsByDay.get(selectedDate) ?? [];
  const pendingStudentRequests = (studentRequestsQuery.data ?? []) as Array<any>;
  const days = getMonthMatrix(currentMonth);

  const refetchCalendar = async () => {
    await Promise.all([
      examsQuery.refetch(),
      eventsQuery.refetch(),
      studentRequestsQuery.refetch(),
      utils.calendar.listExams.invalidate(),
      utils.calendar.listEvents.invalidate(),
      utils.calendar.listStudentRequests.invalidate(),
    ]);
  };

  const resetForm = (nextMode: CalendarMode = "event") => {
    setEditingItemId(null);
    setForm({
      ...initialForm,
      mode: nextMode,
      type: nextMode === "exam" ? "exam" : "event",
    });
  };

  const handleCreateMode = (mode: CalendarMode) => {
    resetForm(mode);
  };

  const handleEdit = (item: CalendarItem) => {
    setEditingItemId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      mode: item.mode,
      type: item.type,
      endDate: item.endDate || "",
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("일정 제목을 입력해주세요.");
      return;
    }

    try {
      if (form.mode === "exam") {
        if (editingItemId) {
          await updateExam.mutateAsync({
            id: editingItemId,
            examName: form.title,
            examDate: selectedDate,
            examEndDate: form.endDate || undefined,
            subject: form.description || undefined,
            description: form.description || undefined,
          });
          toast.success("시험 일정이 수정되었습니다.");
        } else {
          await createExam.mutateAsync({
            examName: form.title,
            examDate: selectedDate,
            examEndDate: form.endDate || undefined,
            subject: form.description || undefined,
            description: form.description || undefined,
          });
          toast.success("시험 일정이 등록되었습니다.");
        }
      } else {
        if (editingItemId) {
          await updateEvent.mutateAsync({
            id: editingItemId,
            eventName: form.title,
            eventDate: selectedDate,
            eventEndDate: form.endDate || undefined,
            eventType: form.type === "exam" ? "event" : form.type,
            description: form.description || undefined,
          });
          toast.success("일정이 수정되었습니다.");
        } else {
          await createEvent.mutateAsync({
            eventName: form.title,
            eventDate: selectedDate,
            eventEndDate: form.endDate || undefined,
            eventType: form.type === "exam" ? "event" : form.type,
            description: form.description || undefined,
          });
          toast.success("일정이 등록되었습니다.");
        }
      }

      await refetchCalendar();
      resetForm(form.mode);
    } catch (error: any) {
      toast.error(error.message || "일정 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (item: CalendarItem) => {
    try {
      if (item.mode === "exam") {
        await deleteExam.mutateAsync({ id: item.id });
      } else {
        await deleteEvent.mutateAsync({ id: item.id });
      }

      toast.success("일정이 삭제되었습니다.");
      await refetchCalendar();
      if (editingItemId === item.id) {
        resetForm("event");
      }
    } catch (error: any) {
      toast.error(error.message || "일정 삭제 중 오류가 발생했습니다.");
    }
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
      await refetchCalendar();
    } catch (error: any) {
      toast.error(error.message || "학생 시험 요청 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_380px] gap-6">
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              학원 일정 캘린더
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: theme.colors.text.tertiary }}
            >
              시험, 휴일, 행사, 공지를 한 달 단위로 관리합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
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
              size="sm"
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

        <div className="mb-4 grid grid-cols-7 gap-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
            <div
              key={label}
              className="text-center text-sm font-semibold py-2"
              style={{ color: theme.colors.text.tertiary }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date) => {
            const dayKey = toDayKey(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isSelected = dayKey === selectedDate;
            const dayItems = itemsByDay.get(dayKey) ?? [];

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDate(dayKey)}
                className="min-h-[112px] rounded-xl border p-2 text-left transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? `${theme.colors.accent.primary}18`
                    : theme.colors.background.secondary,
                  borderColor: isSelected
                    ? theme.colors.accent.primary
                    : theme.colors.border.primary,
                  opacity: isCurrentMonth ? 1 : 0.45,
                }}
              >
                <div
                  className="text-sm font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <div
                      key={item.mode + item.id}
                      className="rounded-md px-2 py-1 text-[11px] truncate"
                      style={{
                        backgroundColor:
                          item.mode === "exam"
                            ? `${theme.colors.status.error}22`
                            : `${theme.colors.status.info}22`,
                        color:
                          item.mode === "exam"
                            ? theme.colors.status.error
                            : theme.colors.status.info,
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 ? (
                    <div
                      className="text-[11px]"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      +{dayItems.length - 3}개 더 보기
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                {formatDateLabel(selectedDate)}
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: theme.colors.text.tertiary }}
              >
                선택한 날짜의 일정 {selectedItems.length}건
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleCreateMode("event")}>
                행사 추가
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleCreateMode("exam")}>
                시험 추가
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {selectedItems.length === 0 ? (
              <div
                className="rounded-lg border p-4 text-sm"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.tertiary,
                }}
              >
                등록된 일정이 없습니다.
              </div>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={item.mode + item.id}
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getTypeBadgeVariant(item.type)} size="sm">
                          {getTypeLabel(item.type)}
                        </Badge>
                        {item.endDate ? (
                          <span
                            className="text-xs"
                            style={{ color: theme.colors.text.tertiary }}
                          >
                            ~ {formatDateLabel(item.endDate)}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className="font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {item.title}
                      </p>
                      {item.description ? (
                        <p
                          className="text-sm mt-2"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button size="xs" variant="secondary" onClick={() => handleEdit(item)}>
                        수정
                      </Button>
                      <Button size="xs" variant="danger" onClick={() => handleDelete(item)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                학생 제출 시험
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: theme.colors.text.tertiary }}
              >
                승인 대기 {pendingStudentRequests.length}건
              </p>
            </div>
            <Badge variant="warning" size="sm">
              승인 필요
            </Badge>
          </div>

          <div className="space-y-3">
            {pendingStudentRequests.length === 0 ? (
              <div
                className="rounded-lg border p-4 text-sm"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.tertiary,
                }}
              >
                현재 승인 대기 중인 학생 시험 등록이 없습니다.
              </div>
            ) : (
              pendingStudentRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className="font-semibold"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {request.title}
                        </p>
                        <Badge variant="warning" size="sm">
                          {request.studentName}
                        </Badge>
                      </div>
                      <p
                        className="mt-2 text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {new Date(request.examDate).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                        {request.subject ? ` · ${request.subject}` : ""}
                      </p>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        학교: {request.schoolNameSnapshot || "미입력"}
                      </p>
                      {request.description ? (
                        <p
                          className="mt-2 text-sm leading-6"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {request.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="xs"
                        onClick={() =>
                          handleReviewStudentRequest(request.id, "approved")
                        }
                        isLoading={reviewStudentRequest.isPending}
                      >
                        승인
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={() =>
                          handleReviewStudentRequest(request.id, "rejected")
                        }
                        isLoading={reviewStudentRequest.isPending}
                      >
                        반려
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            {editingItemId ? "일정 수정" : "일정 등록"}
          </h3>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                일정 유형
              </label>
              <select
                value={form.mode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mode: event.target.value as CalendarMode,
                    type: event.target.value === "exam" ? "exam" : "event",
                  }))
                }
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              >
                <option value="event">행사/휴일/공지</option>
                <option value="exam">시험</option>
              </select>
            </div>

            {form.mode === "event" ? (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  세부 분류
                </label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as CalendarItem["type"],
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-3"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                >
                  <option value="event">행사</option>
                  <option value="holiday">휴일</option>
                  <option value="notice">공지</option>
                  <option value="other">기타</option>
                </select>
              </div>
            ) : null}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                제목
              </label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                종료일
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                설명
              </label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.primary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary,
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave}>
                {editingItemId ? "수정 저장" : "일정 등록"}
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                onClick={() => resetForm("event")}
              >
                초기화
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
