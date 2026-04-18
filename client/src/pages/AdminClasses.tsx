import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_FORM = {
  name: "",
  subject: "",
  capacity: "20",
  room: "",
  selectedDays: [1],
  startTime: "16:00",
  endTime: "18:00",
};

type FormState = typeof DEFAULT_FORM;
type ModalMode = "create" | "edit" | null;

type ClassItem = {
  id: number;
  name: string;
  subject: string;
  capacity: number;
  room?: string | null;
};

type ClassScheduleItem = {
  id: number;
  classId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const daySortMap = new Map(DAY_OPTIONS.map((day, index) => [day.value, index]));

function sortDayValues(values: number[]) {
  return [...values].sort((left, right) => {
    const leftOrder = daySortMap.get(left) ?? 99;
    const rightOrder = daySortMap.get(right) ?? 99;
    return leftOrder - rightOrder;
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
    () => sortDayValues((data ?? []).map((schedule: ClassScheduleItem) => schedule.dayOfWeek))
      .map((dayOfWeek) => (data ?? []).find((schedule: ClassScheduleItem) => schedule.dayOfWeek === dayOfWeek))
      .filter(Boolean) as ClassScheduleItem[],
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
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);

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
  const replaceSchedulesMutation = trpc.classSchedules.replaceForClass.useMutation();

  const classes = useMemo(() => {
    const items = (data?.data ?? []) as ClassItem[];
    const query = searchName.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
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
    const primarySchedule = schedules[0];
    const selectedDays = sortDayValues(schedules.map((schedule) => schedule.dayOfWeek));

    setFormData((current) => ({
      ...current,
      selectedDays: selectedDays.length > 0 ? selectedDays : DEFAULT_FORM.selectedDays,
      startTime: primarySchedule?.startTime ?? DEFAULT_FORM.startTime,
      endTime: primarySchedule?.endTime ?? DEFAULT_FORM.endTime,
    }));
  }, [modalMode, selectedClass, selectedSchedules]);

  const isSaving =
    createClassMutation.isPending ||
    updateClassMutation.isPending ||
    replaceSchedulesMutation.isPending;

  const resetModal = () => {
    setModalMode(null);
    setSelectedClass(null);
    setFormData(DEFAULT_FORM);
  };

  const openCreateModal = () => {
    setSelectedClass(null);
    setFormData(DEFAULT_FORM);
    setModalMode("create");
  };

  const openEditModal = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name ?? "",
      subject: classItem.subject ?? "",
      capacity: String(classItem.capacity ?? 20),
      room: classItem.room ?? "",
      selectedDays: DEFAULT_FORM.selectedDays,
      startTime: DEFAULT_FORM.startTime,
      endTime: DEFAULT_FORM.endTime,
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

  const toggleDay = (dayOfWeek: number) => {
    setFormData((current) => {
      const exists = current.selectedDays.includes(dayOfWeek);
      const nextDays = exists
        ? current.selectedDays.filter((value) => value !== dayOfWeek)
        : [...current.selectedDays, dayOfWeek];

      return {
        ...current,
        selectedDays: sortDayValues(nextDays),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedRoom = formData.room.trim();
    const capacity = Math.max(1, Number(formData.capacity) || 20);

    if (!trimmedName || !trimmedSubject) {
      toast.error("반 이름과 과목을 입력해주세요.");
      return;
    }

    if (formData.selectedDays.length === 0) {
      toast.error("수업 요일을 하나 이상 선택해주세요.");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error("시작 시간과 종료 시간을 입력해주세요.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
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

    const schedulePayload = sortDayValues(formData.selectedDays).map((dayOfWeek) => ({
      dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
    }));

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

        toast.success("반과 복수 요일 시간표를 등록했습니다.");
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-4xl font-bold mb-1"
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
            className="px-4 py-3 rounded-lg text-sm font-medium"
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
              description="반을 만들고 월·수·금처럼 주간 시간표를 먼저 붙여두면 운영이 훨씬 쉬워집니다."
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
          <Card variant="elevated" padding="lg" className="w-full max-w-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.text.primary }}
                >
                  {modalMode === "create" ? "반 생성" : "반 수정"}
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.colors.text.tertiary }}>
                  선택한 요일 전체에 같은 시간대를 적용합니다.
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

            <form onSubmit={handleSubmit} className="space-y-5">
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
                      주간 시간표
                    </h3>
                    <p className="text-sm mt-1" style={{ color: theme.colors.text.tertiary }}>
                      월~일까지 여러 요일을 선택할 수 있습니다.
                    </p>
                  </div>
                  {modalMode === "edit" && isSelectedSchedulesLoading ? (
                    <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                      불러오는 중...
                    </p>
                  ) : null}
                </div>

                <div className="mb-4">
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    수업 요일
                  </p>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const isSelected = formData.selectedDays.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className="rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
                          style={{
                            backgroundColor: isSelected
                              ? theme.colors.accent.primary
                              : theme.colors.background.tertiary,
                            color: isSelected ? "#fff" : theme.colors.text.primary,
                            border: `1px solid ${
                              isSelected
                                ? theme.colors.accent.primary
                                : theme.colors.border.primary
                            }`,
                          }}
                        >
                          {day.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.colors.text.primary }}
                    >
                      시작 시간
                    </label>
                    <input
                      value={formData.startTime}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                      type="time"
                      className="w-full px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.tertiary,
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
                      종료 시간
                    </label>
                    <input
                      value={formData.endTime}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                      type="time"
                      className="w-full px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.tertiary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                  </div>
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
