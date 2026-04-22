import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

const DAY_OPTIONS = [
  { value: 1, shortLabel: "월", label: "월요일" },
  { value: 2, shortLabel: "화", label: "화요일" },
  { value: 3, shortLabel: "수", label: "수요일" },
  { value: 4, shortLabel: "목", label: "목요일" },
  { value: 5, shortLabel: "금", label: "금요일" },
  { value: 6, shortLabel: "토", label: "토요일" },
  { value: 0, shortLabel: "일", label: "일요일" },
] as const;

type ModalMode = "create" | "edit" | null;

type ClassItem = {
  id: number;
  name: string;
  subject: string;
  capacity: number;
  room?: string | null;
  isActive?: boolean | number | null;
};

type ScheduleDraft = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type ClassScheduleItem = ScheduleDraft & {
  id: number;
  classId: number;
};

type DayScheduleState = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type WeeklyScheduleState = Record<number, DayScheduleState>;

type FormState = {
  name: string;
  subject: string;
  capacity: string;
  room: string;
  weeklySchedule: WeeklyScheduleState;
};

const daySortMap = new Map<number, number>(DAY_OPTIONS.map((day, index) => [day.value, index]));

function sortDayValues(values: number[]) {
  return [...values].sort((left, right) => {
    const leftOrder = daySortMap.get(left) ?? 99;
    const rightOrder = daySortMap.get(right) ?? 99;
    return leftOrder - rightOrder;
  });
}

function sortSchedules<T extends ScheduleDraft>(schedules: T[]) {
  return [...schedules].sort((left, right) => {
    const leftOrder = daySortMap.get(left.dayOfWeek) ?? 99;
    const rightOrder = daySortMap.get(right.dayOfWeek) ?? 99;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.startTime.localeCompare(right.startTime);
  });
}

function getDayLabel(dayOfWeek: number) {
  return DAY_OPTIONS.find((day) => day.value === dayOfWeek)?.label ?? "-";
}

function createWeeklyScheduleState(
  enabledDays: number[] = [],
  schedules: ClassScheduleItem[] = [],
): WeeklyScheduleState {
  const base = Object.fromEntries(
    DAY_OPTIONS.map((day) => [
      day.value,
      {
        enabled: enabledDays.includes(day.value),
        startTime: "16:00",
        endTime: "18:00",
      },
    ]),
  ) as WeeklyScheduleState;

  schedules.forEach((schedule) => {
    base[schedule.dayOfWeek] = {
      enabled: true,
      startTime: schedule.startTime || "16:00",
      endTime: schedule.endTime || "18:00",
    };
  });

  return base;
}

function createDefaultForm(): FormState {
  return {
    name: "",
    subject: "",
    capacity: "20",
    room: "",
    weeklySchedule: createWeeklyScheduleState([1]),
  };
}

function getClassIdFromMutationResult(result: unknown) {
  const payload = result as
    | { id?: number; insertId?: number }
    | Array<{ id?: number; insertId?: number }>
    | undefined;

  const classId = Number(
    Array.isArray(payload)
      ? payload[0]?.id ?? payload[0]?.insertId ?? 0
      : payload?.id ?? payload?.insertId ?? 0,
  );

  return Number.isFinite(classId) && classId > 0 ? classId : 0;
}

function ClassSchedulePreview({ classId }: { classId: number }) {
  const { data } = trpc.classSchedules.list.useQuery({ classId }, LIVE_QUERY_OPTIONS);
  const schedules = useMemo(
    () => sortSchedules((data ?? []) as ClassScheduleItem[]),
    [data],
  );

  if (!schedules.length) {
    return (
      <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
        시간표 없음
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {schedules.map((schedule) => (
        <p key={schedule.id} className="text-sm" style={{ color: theme.colors.text.tertiary }}>
          {getDayLabel(schedule.dayOfWeek)} · {schedule.startTime} - {schedule.endTime}
        </p>
      ))}
    </div>
  );
}

export default function AdminClasses() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [searchName, setSearchName] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState<FormState>(() => createDefaultForm());

  const { data, isLoading } = trpc.classes.list.useQuery(
    { limit: 100, offset: 0 },
    LIVE_QUERY_OPTIONS,
  );

  const selectedClassId = selectedClass?.id ?? 0;
  const { data: selectedSchedules, isLoading: isSelectedSchedulesLoading } =
    trpc.classSchedules.list.useQuery(
      { classId: selectedClassId },
      { enabled: modalMode === "edit" && selectedClassId > 0 },
    );

  const createClassMutation = trpc.classes.create.useMutation();
  const updateClassMutation = trpc.classes.update.useMutation();
  const deleteClassMutation = trpc.classes.delete.useMutation();
  const replaceSchedulesMutation = trpc.classSchedules.replaceForClass.useMutation();

  const classes = useMemo(() => {
    const activeItems = ((data?.data ?? []) as ClassItem[]).filter(
      (item) => item.isActive !== false && item.isActive !== 0,
    );
    const query = searchName.trim().toLowerCase();

    if (!query) return activeItems;

    return activeItems.filter((item) => {
      const name = item.name?.toLowerCase?.() ?? "";
      const subject = item.subject?.toLowerCase?.() ?? "";
      const room = item.room?.toLowerCase?.() ?? "";
      return name.includes(query) || subject.includes(query) || room.includes(query);
    });
  }, [data?.data, searchName]);

  useEffect(() => {
    if (modalMode !== "edit" || !selectedClass) {
      return;
    }

    const schedules = (selectedSchedules ?? []) as ClassScheduleItem[];
    setFormData((current) => ({
      ...current,
      weeklySchedule: createWeeklyScheduleState([], schedules),
    }));
  }, [modalMode, selectedClass, selectedSchedules]);

  const isSaving =
    createClassMutation.isPending ||
    updateClassMutation.isPending ||
    replaceSchedulesMutation.isPending ||
    deleteClassMutation.isPending;

  const resetModal = () => {
    setModalMode(null);
    setSelectedClass(null);
    setFormData(createDefaultForm());
  };

  const openCreateModal = () => {
    setSelectedClass(null);
    setFormData(createDefaultForm());
    setModalMode("create");
  };

  const openEditModal = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name ?? "",
      subject: classItem.subject ?? "",
      capacity: String(classItem.capacity ?? 20),
      room: classItem.room ?? "",
      weeklySchedule: createWeeklyScheduleState(),
    });
    setModalMode("edit");
  };

  const refreshData = async () => {
    await Promise.all([
      utils.classes.list.invalidate(),
      utils.classSchedules.list.invalidate(),
      utils.portal.adminSummary.invalidate(),
    ]);
  };

  const updateScheduleDay = (dayOfWeek: number, patch: Partial<DayScheduleState>) => {
    setFormData((current) => ({
      ...current,
      weeklySchedule: {
        ...current.weeklySchedule,
        [dayOfWeek]: {
          ...current.weeklySchedule[dayOfWeek],
          ...patch,
        },
      },
    }));
  };

  const handleDelete = async (classItem: ClassItem) => {
    const confirmed = window.confirm(
      `'${classItem.name}' 반을 삭제할까요?\n삭제해도 과거 기록은 남고, 활성 목록에서만 제외됩니다.`,
    );

    if (!confirmed) return;

    try {
      await deleteClassMutation.mutateAsync({ id: classItem.id });
      toast.success("반을 삭제했습니다.");
      if (selectedClass?.id === classItem.id) {
        resetModal();
      }
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "반 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedRoom = formData.room.trim();
    const capacity = Math.max(1, Number(formData.capacity) || 20);

    if (!trimmedName || !trimmedSubject) {
      toast.error("반 이름과 과목을 입력해주세요.");
      return;
    }

    if (modalMode === "edit" && selectedClassId > 0 && isSelectedSchedulesLoading) {
      toast.error("기존 시간표를 불러오는 중입니다. 잠시 후 다시 저장해주세요.");
      return;
    }

    const schedulePayload = sortDayValues(
      DAY_OPTIONS.filter((day) => formData.weeklySchedule[day.value].enabled).map(
        (day) => day.value,
      ),
    ).map((dayOfWeek) => ({
      dayOfWeek,
      startTime: formData.weeklySchedule[dayOfWeek].startTime,
      endTime: formData.weeklySchedule[dayOfWeek].endTime,
    }));

    if (schedulePayload.length === 0) {
      toast.error("수업 요일을 최소 1개 이상 선택해주세요.");
      return;
    }

    for (const schedule of schedulePayload) {
      if (!schedule.startTime || !schedule.endTime) {
        toast.error(`${getDayLabel(schedule.dayOfWeek)}의 시작/종료 시간을 모두 입력해주세요.`);
        return;
      }

      if (schedule.startTime >= schedule.endTime) {
        toast.error(`${getDayLabel(schedule.dayOfWeek)}의 종료 시간은 시작 시간보다 늦어야 합니다.`);
        return;
      }
    }

    const classPayload = {
      name: trimmedName,
      subject: trimmedSubject,
      capacity,
      room: trimmedRoom,
    };

    try {
      if (modalMode === "create") {
        const result = await createClassMutation.mutateAsync({
          ...classPayload,
          teacherId: user?.id || 1,
        });

        const classId = getClassIdFromMutationResult(result);
        if (!classId) {
          throw new Error("반 생성 후 ID를 확인할 수 없습니다.");
        }

        await replaceSchedulesMutation.mutateAsync({
          classId,
          schedules: schedulePayload,
        });

        toast.success("반과 요일별 시간표를 등록했습니다.");
      }

      if (modalMode === "edit" && selectedClass) {
        await updateClassMutation.mutateAsync({
          id: selectedClass.id,
          ...classPayload,
        });

        await replaceSchedulesMutation.mutateAsync({
          classId: selectedClass.id,
          schedules: schedulePayload,
        });

        toast.success("반 정보와 시간표를 수정했습니다.");
      }

      resetModal();
      await refreshData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "반 저장 중 오류가 발생했습니다.");
    }
  };

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="mb-1 text-3xl font-bold md:text-4xl"
              style={{ color: theme.colors.text.primary }}
            >
              반 관리
            </h1>
            <p className="text-base" style={{ color: theme.colors.text.tertiary }}>
              반 정보와 주간 시간표를 한 화면에서 관리합니다.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="w-full rounded-lg px-4 py-3 text-sm font-medium md:w-auto"
            style={{
              backgroundColor: theme.colors.accent.primary,
              color: "#fff",
            }}
          >
            반 생성
          </button>
        </div>

        <SearchBar
          placeholder="반 이름, 과목, 강의실 검색"
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
        />

        <Card variant="elevated" padding="lg">
          {isLoading ? (
            <p style={{ color: theme.colors.text.tertiary }}>반 목록을 불러오는 중입니다.</p>
          ) : classes.length === 0 ? (
            <EmptyState
              title="등록된 반이 없습니다"
              description="반을 만들고 요일별 시간표를 먼저 붙여두면 운영이 훨씬 쉬워집니다."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                        {item.subject} · 정원 {item.capacity}명 · {item.room || "강의실 미지정"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-lg px-3 py-2 text-sm font-medium"
                        style={{
                          backgroundColor: theme.colors.background.tertiary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={deleteClassMutation.isPending}
                        className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
                        style={{
                          backgroundColor: `${theme.colors.status.error}18`,
                          color: theme.colors.status.error,
                          border: `1px solid ${theme.colors.status.error}55`,
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      주간 시간표
                    </p>
                    <ClassSchedulePreview classId={item.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {modalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card
            variant="elevated"
            padding="lg"
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
                  {modalMode === "create" ? "반 생성" : "반 수정"}
                </h2>
                <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                  월요일부터 일요일까지 필요한 요일만 켜고, 각 요일마다 다른 수업 시간을 설정하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              >
                닫기
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-96px)] space-y-5 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    반 이름
                  </label>
                  <input
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="예: 중2 심화반"
                    className="w-full rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    과목
                  </label>
                  <input
                    value={formData.subject}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, subject: event.target.value }))
                    }
                    placeholder="예: 영어"
                    className="w-full rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    정원
                  </label>
                  <input
                    value={formData.capacity}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, capacity: event.target.value }))
                    }
                    type="number"
                    min="1"
                    placeholder="20"
                    className="w-full rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    강의실
                  </label>
                  <input
                    value={formData.room}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, room: event.target.value }))
                    }
                    placeholder="예: 3강의실"
                    className="w-full rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border.primary,
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      주간 시간표
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                      요일을 켠 뒤 각 요일마다 다른 시작/종료 시간을 설정할 수 있습니다.
                    </p>
                  </div>
                  {modalMode === "edit" && isSelectedSchedulesLoading ? (
                    <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                      불러오는 중...
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {DAY_OPTIONS.map((day) => {
                    const schedule = formData.weeklySchedule[day.value];

                    return (
                      <div
                        key={day.value}
                        className="grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[180px_1fr_1fr]"
                        style={{
                          backgroundColor: schedule.enabled
                            ? theme.colors.background.tertiary
                            : theme.colors.background.secondary,
                          borderColor: schedule.enabled
                            ? `${theme.colors.accent.primary}55`
                            : theme.colors.border.primary,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateScheduleDay(day.value, { enabled: !schedule.enabled })}
                          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold"
                          style={{
                            backgroundColor: schedule.enabled
                              ? theme.colors.accent.primary
                              : theme.colors.background.secondary,
                            color: schedule.enabled ? "#fff" : theme.colors.text.primary,
                            border: `1px solid ${
                              schedule.enabled
                                ? theme.colors.accent.primary
                                : theme.colors.border.primary
                            }`,
                          }}
                        >
                          <span>{day.label}</span>
                          <span>{schedule.enabled ? "사용 중" : "사용 안 함"}</span>
                        </button>

                        <div>
                          <label className="mb-2 block text-sm" style={{ color: theme.colors.text.tertiary }}>
                            시작 시간
                          </label>
                          <input
                            value={schedule.startTime}
                            onChange={(event) =>
                              updateScheduleDay(day.value, { startTime: event.target.value })
                            }
                            type="time"
                            disabled={!schedule.enabled}
                            className="w-full rounded-lg px-3 py-3 disabled:opacity-50"
                            style={{
                              backgroundColor: theme.colors.background.secondary,
                              color: theme.colors.text.primary,
                              border: `1px solid ${theme.colors.border.primary}`,
                            }}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm" style={{ color: theme.colors.text.tertiary }}>
                            종료 시간
                          </label>
                          <input
                            value={schedule.endTime}
                            onChange={(event) =>
                              updateScheduleDay(day.value, { endTime: event.target.value })
                            }
                            type="time"
                            disabled={!schedule.enabled}
                            className="w-full rounded-lg px-3 py-3 disabled:opacity-50"
                            style={{
                              backgroundColor: theme.colors.background.secondary,
                              color: theme.colors.text.primary,
                              border: `1px solid ${theme.colors.border.primary}`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {modalMode === "edit" && selectedClass ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(selectedClass)}
                    className="rounded-lg px-4 py-3 text-sm font-medium"
                    style={{
                      backgroundColor: `${theme.colors.status.error}18`,
                      color: theme.colors.status.error,
                      border: `1px solid ${theme.colors.status.error}55`,
                    }}
                  >
                    반 삭제
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="rounded-lg px-4 py-3 text-sm font-medium"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || (modalMode === "edit" && isSelectedSchedulesLoading)}
                    className="rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-60"
                    style={{
                      backgroundColor: theme.colors.accent.primary,
                      color: "#fff",
                    }}
                  >
                    {isSaving ? "저장 중..." : modalMode === "create" ? "반 등록" : "수정 저장"}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
