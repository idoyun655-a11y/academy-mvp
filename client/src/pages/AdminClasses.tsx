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
];

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

type FormState = {
  name: string;
  subject: string;
  capacity: string;
  room: string;
  schedules: ScheduleDraft[];
};

type ClassScheduleItem = ScheduleDraft & {
  id: number;
  classId: number;
};

const daySortMap = new Map(DAY_OPTIONS.map((day, index) => [day.value, index]));

function createDefaultForm(): FormState {
  return {
    name: "",
    subject: "",
    capacity: "20",
    room: "",
    schedules: [{ dayOfWeek: 1, startTime: "16:00", endTime: "18:00" }],
  };
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

function getClassIdFromMutationResult(result: any) {
  const classId = Number(
    result?.id ?? result?.insertId ?? result?.[0]?.id ?? result?.[0]?.insertId ?? 0,
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
        <p
          key={schedule.id}
          className="text-sm"
          style={{ color: theme.colors.text.tertiary }}
        >
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
      {
        enabled: modalMode === "edit" && selectedClassId > 0,
      },
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

    const schedules = sortSchedules((selectedSchedules ?? []) as ClassScheduleItem[]).map(
      (schedule) => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      }),
    );

    setFormData((current) => ({
      ...current,
      schedules: schedules.length > 0 ? schedules : createDefaultForm().schedules,
    }));
  }, [modalMode, selectedClass, selectedSchedules]);

  const isSaving =
    createClassMutation.isPending ||
    updateClassMutation.isPending ||
    replaceSchedulesMutation.isPending;

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
      schedules: createDefaultForm().schedules,
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

  const updateSchedule = (index: number, patch: Partial<ScheduleDraft>) => {
    setFormData((current) => ({
      ...current,
      schedules: current.schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, ...patch } : schedule,
      ),
    }));
  };

  const addSchedule = () => {
    setFormData((current) => {
      const usedDays = new Set(current.schedules.map((schedule) => schedule.dayOfWeek));
      const nextDay = DAY_OPTIONS.find((day) => !usedDays.has(day.value))?.value ?? 1;

      return {
        ...current,
        schedules: [
          ...current.schedules,
          { dayOfWeek: nextDay, startTime: "16:00", endTime: "18:00" },
        ],
      };
    });
  };

  const removeSchedule = (index: number) => {
    setFormData((current) => ({
      ...current,
      schedules: current.schedules.filter((_, scheduleIndex) => scheduleIndex !== index),
    }));
  };

  const handleDeleteClass = async (classItem: ClassItem) => {
    const confirmed = window.confirm(`'${classItem.name}' 반을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteClassMutation.mutateAsync({ id: classItem.id });
      toast.success("반을 삭제했습니다.");
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
    const schedulePayload = sortSchedules(formData.schedules).map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));

    if (!trimmedName || !trimmedSubject) {
      toast.error("반 이름과 과목을 입력해주세요.");
      return;
    }

    if (schedulePayload.length === 0) {
      toast.error("수업 요일과 시간을 하나 이상 추가해주세요.");
      return;
    }

    const daySet = new Set(schedulePayload.map((schedule) => schedule.dayOfWeek));
    if (daySet.size !== schedulePayload.length) {
      toast.error("같은 요일은 한 번만 등록할 수 있습니다.");
      return;
    }

    const invalidSchedule = schedulePayload.find(
      (schedule) =>
        !schedule.startTime ||
        !schedule.endTime ||
        schedule.startTime >= schedule.endTime,
    );
    if (invalidSchedule) {
      toast.error("각 요일의 종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    if (modalMode === "edit" && selectedClassId > 0 && isSelectedSchedulesLoading) {
      toast.error("기존 시간표를 불러오는 중입니다. 잠시 후 다시 저장해주세요.");
      return;
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

        toast.success("반 정보와 요일별 시간표를 수정했습니다.");
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
              반 정보와 요일별 시간표를 한 화면에서 관리합니다.
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
              description="반을 만들고 월·수·금처럼 요일별 시간표를 붙여두면 운영이 훨씬 쉬워집니다."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-lg font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        {item.subject} · 정원 {item.capacity}명 · {item.room || "강의실 미지정"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="px-3 py-2 rounded-lg text-sm font-medium"
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
                        onClick={() => handleDeleteClass(item)}
                        disabled={deleteClassMutation.isPending}
                        className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
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

      {modalMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card
            variant="elevated"
            padding="lg"
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.text.primary }}
                >
                  {modalMode === "create" ? "반 생성" : "반 수정"}
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.colors.text.tertiary }}>
                  요일마다 시작 시간과 종료 시간을 따로 설정합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="px-3 py-2 rounded-lg text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    반 이름
                  </label>
                  <input
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="예: 고2 심화반"
                    className="w-full px-3 py-3 rounded-lg"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    과목
                  </label>
                  <input
                    value={formData.subject}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, subject: event.target.value }))
                    }
                    placeholder="예: 영어"
                    className="w-full px-3 py-3 rounded-lg"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
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
                    className="w-full px-3 py-3 rounded-lg"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    강의실
                  </label>
                  <input
                    value={formData.room}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, room: event.target.value }))
                    }
                    placeholder="예: 3강의실"
                    className="w-full px-3 py-3 rounded-lg"
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
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      요일별 시간표
                    </h3>
                    <p className="text-sm mt-1" style={{ color: theme.colors.text.tertiary }}>
                      월~일 중 필요한 요일을 추가하고, 각 요일마다 시간을 따로 넣습니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSchedule}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: theme.colors.background.tertiary,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.primary}`,
                    }}
                  >
                    요일 추가
                  </button>
                </div>

                {modalMode === "edit" && isSelectedSchedulesLoading ? (
                  <p className="mb-3 text-sm" style={{ color: theme.colors.text.tertiary }}>
                    기존 시간표를 불러오는 중...
                  </p>
                ) : null}

                <div className="space-y-3">
                  {formData.schedules.map((schedule, index) => (
                    <div
                      key={`${schedule.dayOfWeek}-${index}`}
                      className="grid grid-cols-1 gap-2 rounded-lg border p-3 md:grid-cols-12"
                      style={{
                        backgroundColor: theme.colors.background.tertiary,
                        borderColor: theme.colors.border.primary,
                      }}
                    >
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(event) =>
                          updateSchedule(index, { dayOfWeek: Number(event.target.value) })
                        }
                        className="rounded-lg px-3 py-3 md:col-span-4"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      >
                        {DAY_OPTIONS.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>

                      <input
                        value={schedule.startTime}
                        onChange={(event) =>
                          updateSchedule(index, { startTime: event.target.value })
                        }
                        type="time"
                        className="rounded-lg px-3 py-3 md:col-span-3"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      />

                      <input
                        value={schedule.endTime}
                        onChange={(event) =>
                          updateSchedule(index, { endTime: event.target.value })
                        }
                        type="time"
                        className="rounded-lg px-3 py-3 md:col-span-3"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        disabled={formData.schedules.length === 1}
                        className="rounded-lg px-3 py-3 text-sm font-medium disabled:opacity-50 md:col-span-2"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-3 rounded-lg text-sm font-medium"
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
                  className="px-4 py-3 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{
                    backgroundColor: theme.colors.accent.primary,
                    color: "#fff",
                  }}
                >
                  {isSaving ? "저장 중..." : modalMode === "create" ? "반 등록" : "수정 저장"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
