import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { formatDate } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SchoolLevel = "elementary" | "middle" | "high" | "other";
type LifecycleStatus = "active" | "on_hold" | "leaving" | "ended";
type FollowUpStatus = "none" | "needs_contact" | "scheduled" | "done";
type SavedView =
  | "all"
  | "unclassified"
  | "elementary"
  | "middle"
  | "high"
  | "unassigned_class"
  | "overdue"
  | "pending_checkout"
  | "follow_up"
  | "on_hold"
  | "leaving";

type SummaryCountKey =
  | "all"
  | "unclassified"
  | "elementary"
  | "middle"
  | "high"
  | "unassignedClass"
  | "overdue"
  | "pendingCheckout"
  | "followUp"
  | "onHold"
  | "leaving";

type CommuteStatus = "not_arrived" | "checked_in" | "checked_out";

type StudentRow = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  attendancePin?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  schoolLevel?: SchoolLevel | null;
  gradeLevel?: number | null;
  gradeLabel?: string | null;
  lifecycleStatus?: LifecycleStatus | null;
  followUpStatus?: FollowUpStatus | null;
  followUpDueDate?: string | Date | null;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  notes?: string | null;
  activeClassCount?: number;
  activeClassNames?: string[];
  hasOverduePayment?: boolean;
  followUpRequired?: boolean;
  commuteStatus?: CommuteStatus;
  lastCheckInAt?: string | Date | null;
  lastCheckOutAt?: string | Date | null;
  lastPaymentStatus?: string | null;
  updatedAt?: string | Date | null;
};

type ClassRow = {
  id: number;
  name: string;
};

type StudentForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  attendancePin: string;
  parentName: string;
  parentPhone: string;
  schoolLevel: SchoolLevel;
  gradeLevel: string;
  lifecycleStatus: LifecycleStatus;
  followUpStatus: FollowUpStatus;
  followUpDueDate: string;
  dateOfBirth: string;
  address: string;
  notes: string;
};

type BulkForm = {
  lifecycleStatus: "" | LifecycleStatus;
  schoolLevel: "" | SchoolLevel;
  gradeLevel: string;
  followUpStatus: "" | FollowUpStatus;
  followUpDueDate: string;
  classSyncMode: "replace" | "add" | "remove";
  classIds: number[];
};

const PAGE_SIZE = 50;

const CONSOLE_QUERY_OPTIONS = {
  staleTime: 10_000,
  refetchOnWindowFocus: true,
} as const;

const SAVED_VIEW_ITEMS: Array<{
  id: SavedView;
  label: string;
  description: string;
  countKey: SummaryCountKey;
}> = [
  {
    id: "all",
    label: "전체",
    description: "현재 등록된 전체 학생",
    countKey: "all",
  },
  {
    id: "unclassified",
    label: "미분류",
    description: "학교급 또는 학년 미지정",
    countKey: "unclassified",
  },
  {
    id: "elementary",
    label: "초등",
    description: "초등 학생 보기",
    countKey: "elementary",
  },
  {
    id: "middle",
    label: "중등",
    description: "중등 학생 보기",
    countKey: "middle",
  },
  {
    id: "high",
    label: "고등",
    description: "고등 학생 보기",
    countKey: "high",
  },
  {
    id: "unassigned_class",
    label: "반 미배정",
    description: "활성 수강 반이 없는 학생",
    countKey: "unassignedClass",
  },
  {
    id: "overdue",
    label: "미납",
    description: "수납 확인이 필요한 학생",
    countKey: "overdue",
  },
  {
    id: "pending_checkout",
    label: "미하원",
    description: "오늘 등원했고 아직 하원하지 않은 학생",
    countKey: "pendingCheckout",
  },
  {
    id: "follow_up",
    label: "상담 필요",
    description: "연락 또는 상담 일정이 필요한 학생",
    countKey: "followUp",
  },
  {
    id: "on_hold",
    label: "휴원",
    description: "휴원 상태 학생",
    countKey: "onHold",
  },
  {
    id: "leaving",
    label: "퇴원예정",
    description: "퇴원 상담 진행 중인 학생",
    countKey: "leaving",
  },
];

const SCHOOL_LEVEL_OPTIONS: Array<{ value: SchoolLevel; label: string }> = [
  { value: "elementary", label: "초등" },
  { value: "middle", label: "중등" },
  { value: "high", label: "고등" },
  { value: "other", label: "미분류" },
];

const LIFECYCLE_OPTIONS: Array<{ value: LifecycleStatus; label: string }> = [
  { value: "active", label: "재원" },
  { value: "on_hold", label: "휴원" },
  { value: "leaving", label: "퇴원예정" },
  { value: "ended", label: "종료" },
];

const FOLLOW_UP_OPTIONS: Array<{ value: FollowUpStatus; label: string }> = [
  { value: "none", label: "없음" },
  { value: "needs_contact", label: "연락 필요" },
  { value: "scheduled", label: "상담 예정" },
  { value: "done", label: "완료" },
];

const INITIAL_FORM: StudentForm = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  phone: "",
  attendancePin: "",
  parentName: "",
  parentPhone: "",
  schoolLevel: "other",
  gradeLevel: "",
  lifecycleStatus: "active",
  followUpStatus: "none",
  followUpDueDate: "",
  dateOfBirth: "",
  address: "",
  notes: "",
};

const INITIAL_BULK_FORM: BulkForm = {
  lifecycleStatus: "",
  schoolLevel: "",
  gradeLevel: "",
  followUpStatus: "",
  followUpDueDate: "",
  classSyncMode: "replace",
  classIds: [],
};

function readInitialSavedView(): SavedView {
  if (typeof window === "undefined") return "all";
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  return (SAVED_VIEW_ITEMS.find((item) => item.id === view)?.id ??
    "all") as SavedView;
}

function updateSavedViewUrl(view: SavedView) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (view === "all") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", view);
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function toInputDate(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSchoolLevelLabel(value?: SchoolLevel | null) {
  return (
    SCHOOL_LEVEL_OPTIONS.find((option) => option.value === value)?.label ??
    "미분류"
  );
}

function getLifecycleLabel(value?: LifecycleStatus | null) {
  return (
    LIFECYCLE_OPTIONS.find((option) => option.value === value)?.label ?? "재원"
  );
}

function getFollowUpLabel(value?: FollowUpStatus | null) {
  return (
    FOLLOW_UP_OPTIONS.find((option) => option.value === value)?.label ?? "없음"
  );
}

function getPaymentLabel(status?: string | null) {
  if (status === "paid") return "완납";
  if (status === "pending") return "대기";
  if (status === "overdue") return "미납";
  return "없음";
}

function getGradeLabel(student: StudentRow) {
  if (student.gradeLabel) return student.gradeLabel;
  if (!student.gradeLevel) return "미분류";
  if (student.schoolLevel === "elementary") return `초${student.gradeLevel}`;
  if (student.schoolLevel === "middle") return `중${student.gradeLevel}`;
  if (student.schoolLevel === "high") return `고${student.gradeLevel}`;
  return `${student.gradeLevel}학년`;
}

function getLifecycleBadgeVariant(status?: LifecycleStatus | null) {
  if (status === "active") return "success";
  if (status === "leaving") return "warning";
  if (status === "on_hold") return "default";
  return "default";
}

function getFollowUpBadgeVariant(status?: FollowUpStatus | null) {
  if (status === "scheduled") return "info";
  if (status === "needs_contact") return "warning";
  if (status === "done") return "success";
  return "default";
}

function getPaymentBadgeVariant(status?: string | null) {
  if (status === "paid") return "success";
  if (status === "pending") return "warning";
  if (status === "overdue") return "error";
  return "default";
}

function getCommuteBadge(status?: CommuteStatus | null) {
  if (status === "checked_in")
    return { label: "원내", variant: "warning" as const };
  if (status === "checked_out")
    return { label: "하원", variant: "info" as const };
  return { label: "미등원", variant: "default" as const };
}

function fieldStyle() {
  return {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.primary}`,
  } as const;
}

function sectionTitleStyle() {
  return {
    color: theme.colors.text.primary,
  } as const;
}

function textMutedStyle() {
  return {
    color: theme.colors.text.tertiary,
  } as const;
}

function toStudentForm(student: StudentRow): StudentForm {
  return {
    name: student.name ?? "",
    email: student.email ?? "",
    password: "",
    passwordConfirm: "",
    phone: student.phone ?? "",
    attendancePin: student.attendancePin ?? "",
    parentName: student.parentName ?? "",
    parentPhone: student.parentPhone ?? "",
    schoolLevel: student.schoolLevel ?? "other",
    gradeLevel: student.gradeLevel ? String(student.gradeLevel) : "",
    lifecycleStatus: student.lifecycleStatus ?? "active",
    followUpStatus: student.followUpStatus ?? "none",
    followUpDueDate: toInputDate(student.followUpDueDate),
    dateOfBirth: toInputDate(student.dateOfBirth),
    address: student.address ?? "",
    notes: student.notes ?? "",
  };
}

export default function AdminStudents() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [savedView, setSavedView] = useState<SavedView>(() =>
    readInitialSavedView(),
  );
  const [search, setSearch] = useState("");
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<"" | SchoolLevel>(
    "",
  );
  const [gradeLevelFilter, setGradeLevelFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<"" | LifecycleStatus>(
    "",
  );
  const [page, setPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailForm, setDetailForm] = useState<StudentForm>(INITIAL_FORM);
  const [createForm, setCreateForm] = useState<StudentForm>(INITIAL_FORM);
  const [detailClassIds, setDetailClassIds] = useState<number[]>([]);
  const [bulkForm, setBulkForm] = useState<BulkForm>(INITIAL_BULK_FORM);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const listInput = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: search.trim() || undefined,
      savedView,
      schoolLevel: schoolLevelFilter || undefined,
      gradeLevel: parseOptionalNumber(gradeLevelFilter),
      classId: classFilter ? Number(classFilter) : undefined,
      lifecycleStatus: lifecycleFilter || undefined,
      sortBy: "default" as const,
      sortOrder: "asc" as const,
    }),
    [
      classFilter,
      gradeLevelFilter,
      lifecycleFilter,
      page,
      savedView,
      schoolLevelFilter,
      search,
    ],
  );

  const { data: summaryData } = trpc.studentOps.summary.useQuery(
    undefined,
    CONSOLE_QUERY_OPTIONS,
  );
  const { data: studentListData, isLoading } = trpc.studentOps.list.useQuery(
    listInput,
    CONSOLE_QUERY_OPTIONS,
  );
  const { data: classListData } = trpc.classes.list.useQuery(
    { limit: 300, offset: 0 },
    CONSOLE_QUERY_OPTIONS,
  );
  const { data: detailEnrollmentIds } =
    trpc.classEnrollments.listByStudent.useQuery(
      { studentId: selectedStudentId ?? 0 },
      {
        ...CONSOLE_QUERY_OPTIONS,
        enabled: Boolean(selectedStudentId),
      },
    );

  const refreshStudentData = async () => {
    await Promise.all([
      utils.studentOps.list.invalidate(),
      utils.studentOps.summary.invalidate(),
      utils.students.list.invalidate(),
      utils.classEnrollments.listByStudent.invalidate(),
      utils.portal.adminSummary.invalidate(),
      utils.portal.linkedStudents.invalidate(),
    ]);
  };

  const createStudentMutation = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      toast.success("학생 계정을 생성했습니다.");
      setShowCreateModal(false);
      setCreateForm(INITIAL_FORM);
      await refreshStudentData();
    },
    onError: (error) => {
      toast.error(error.message || "학생 계정 생성 중 오류가 발생했습니다.");
    },
  });

  const updateStudentMutation = trpc.students.update.useMutation({
    onSuccess: refreshStudentData,
  });

  const syncEnrollmentsMutation = trpc.classEnrollments.sync.useMutation({
    onSuccess: refreshStudentData,
  });

  const bulkUpdateMutation = trpc.studentOps.bulkUpdate.useMutation({
    onSuccess: async () => {
      setSelectedIds([]);
      setBulkForm(INITIAL_BULK_FORM);
      await refreshStudentData();
    },
  });

  const deleteStudentMutation = trpc.students.delete.useMutation({
    onSuccess: async () => {
      setSelectedStudentId(null);
      await refreshStudentData();
    },
  });

  const students = (studentListData?.data ?? []) as StudentRow[];
  const classes = (classListData?.data ?? []) as ClassRow[];
  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? null;
  const total = studentListData?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allVisibleIds = students.map((student) => student.id);
  const allVisibleSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((studentId) => selectedIds.includes(studentId));

  useEffect(() => {
    setPage(0);
    setSelectedIds([]);
  }, [
    savedView,
    schoolLevelFilter,
    gradeLevelFilter,
    classFilter,
    lifecycleFilter,
    search,
  ]);

  useEffect(() => {
    updateSavedViewUrl(savedView);
  }, [savedView]);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }

    const hasSelectedStudent = students.some(
      (student) => student.id === selectedStudentId,
    );
    if (!hasSelectedStudent) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  useEffect(() => {
    if (!selectedStudent) {
      setDetailForm(INITIAL_FORM);
      return;
    }
    setDetailForm(toStudentForm(selectedStudent));
  }, [selectedStudent]);

  useEffect(() => {
    if (!selectedStudentId) {
      setDetailClassIds([]);
      return;
    }
    setDetailClassIds(detailEnrollmentIds ?? []);
  }, [detailEnrollmentIds, selectedStudentId]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const handleToggleVisibleSelection = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((studentId) => !allVisibleIds.includes(studentId)),
      );
      return;
    }
    setSelectedIds((current) =>
      Array.from(new Set([...current, ...allVisibleIds])),
    );
  };

  const handleToggleStudentSelection = (studentId: number) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId],
    );
  };

  const handleCreateStudent = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createStudentMutation.mutateAsync({
        email: createForm.email,
        password: createForm.password,
        passwordConfirm: createForm.passwordConfirm,
        name: createForm.name,
        phone: createForm.phone || undefined,
        role: "student",
        attendancePin: createForm.attendancePin,
        parentName: createForm.parentName || undefined,
        parentPhone: createForm.parentPhone || undefined,
        schoolLevel: createForm.schoolLevel,
        gradeLevel: parseOptionalNumber(createForm.gradeLevel),
        lifecycleStatus: createForm.lifecycleStatus,
        followUpStatus: createForm.followUpStatus,
        followUpDueDate: createForm.followUpDueDate || undefined,
        dateOfBirth: createForm.dateOfBirth || undefined,
        address: createForm.address || undefined,
        notes: createForm.notes || undefined,
      });
    } catch {
      // Mutation-level toast handles the visible error message.
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedStudentId) return;

    await Promise.all([
      updateStudentMutation.mutateAsync({
        id: selectedStudentId,
        name: detailForm.name,
        phone: detailForm.phone || undefined,
        attendancePin: detailForm.attendancePin || null,
        parentName: detailForm.parentName || undefined,
        parentPhone: detailForm.parentPhone || undefined,
        schoolLevel: detailForm.schoolLevel,
        gradeLevel: parseNullableNumber(detailForm.gradeLevel),
        lifecycleStatus: detailForm.lifecycleStatus,
        followUpStatus: detailForm.followUpStatus,
        followUpDueDate: detailForm.followUpDueDate || null,
        dateOfBirth: detailForm.dateOfBirth || undefined,
        address: detailForm.address || undefined,
        notes: detailForm.notes || undefined,
      }),
      syncEnrollmentsMutation.mutateAsync({
        studentId: selectedStudentId,
        classIds: detailClassIds,
      }),
    ]);
  };

  const handleApplyBulk = async () => {
    if (selectedIds.length === 0) return;

    const payload: {
      studentIds: number[];
      lifecycleStatus?: LifecycleStatus;
      schoolLevel?: SchoolLevel;
      gradeLevel?: number | null;
      followUpStatus?: FollowUpStatus;
      followUpDueDate?: string;
      classIds?: number[];
      classSyncMode: "replace" | "add" | "remove";
    } = {
      studentIds: selectedIds,
      classSyncMode: bulkForm.classSyncMode,
    };

    if (bulkForm.lifecycleStatus)
      payload.lifecycleStatus = bulkForm.lifecycleStatus;
    if (bulkForm.schoolLevel) payload.schoolLevel = bulkForm.schoolLevel;
    if (bulkForm.gradeLevel.trim()) {
      const gradeLevel = parseNullableNumber(bulkForm.gradeLevel);
      if (gradeLevel !== null) payload.gradeLevel = gradeLevel;
    }
    if (bulkForm.followUpStatus)
      payload.followUpStatus = bulkForm.followUpStatus;
    if (bulkForm.followUpDueDate)
      payload.followUpDueDate = bulkForm.followUpDueDate;
    if (bulkForm.classIds.length > 0) payload.classIds = bulkForm.classIds;

    await bulkUpdateMutation.mutateAsync(payload);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`${selectedStudent.name} 학생을 삭제할까요?`)) return;
    await deleteStudentMutation.mutateAsync({ id: selectedStudent.id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold" style={sectionTitleStyle()}>
              학생 운영 콘솔
            </h1>
            <p className="text-base" style={textMutedStyle()}>
              학년, 반, 미납, 미하원, 상담 필요 상태를 기준으로 학생을 빠르게
              분류하고 처리합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" size="sm">
              전체 {summaryData?.savedViews?.all ?? 0}명
            </Badge>
            <Badge variant="warning" size="sm">
              미하원 {summaryData?.savedViews?.pendingCheckout ?? 0}명
            </Badge>
            <Badge variant="error" size="sm">
              미납 {summaryData?.savedViews?.overdue ?? 0}명
            </Badge>
            <Button
              size="lg"
              onClick={() => {
                setCreateForm(INITIAL_FORM);
                setShowCreateModal(true);
              }}
            >
              학생 계정 생성
            </Button>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
              <select
                value={bulkForm.lifecycleStatus}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    lifecycleStatus: event.target.value as "" | LifecycleStatus,
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                <option value="">학생 상태 일괄 변경</option>
                {LIFECYCLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={bulkForm.schoolLevel}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    schoolLevel: event.target.value as "" | SchoolLevel,
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                <option value="">학교급 일괄 지정</option>
                {SCHOOL_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleApplyBulk}
                isLoading={bulkUpdateMutation.isPending}
              >
                {selectedIds.length}명 적용
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={bulkForm.gradeLevel}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    gradeLevel: event.target.value,
                  }))
                }
                type="number"
                min="1"
                max="12"
                placeholder="학년 일괄 지정"
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              />
              <select
                value={bulkForm.followUpStatus}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    followUpStatus: event.target.value as "" | FollowUpStatus,
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                <option value="">상담 상태 일괄 지정</option>
                {FOLLOW_UP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={bulkForm.followUpDueDate}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    followUpDueDate: event.target.value,
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              />
              <select
                value={bulkForm.classSyncMode}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    classSyncMode: event.target
                      .value as BulkForm["classSyncMode"],
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                <option value="replace">반 완전 교체</option>
                <option value="add">반 추가</option>
                <option value="remove">반 제거</option>
              </select>
            </div>

            <div
              className="mt-4 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded-lg p-3 md:grid-cols-2 xl:grid-cols-3"
              style={fieldStyle()}
            >
              {classes.map((classItem) => (
                <label
                  key={classItem.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={bulkForm.classIds.includes(classItem.id)}
                    onChange={(event) =>
                      setBulkForm((current) => ({
                        ...current,
                        classIds: event.target.checked
                          ? [...current.classIds, classItem.id]
                          : current.classIds.filter(
                              (item) => item !== classItem.id,
                            ),
                      }))
                    }
                  />
                  <span style={sectionTitleStyle()}>{classItem.name}</span>
                </label>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <Card variant="elevated" padding="lg" className="space-y-3">
            <h2 className="text-lg font-semibold" style={sectionTitleStyle()}>
              저장 보기
            </h2>
            {SAVED_VIEW_ITEMS.map((item) => {
              const count = Number(
                (
                  summaryData?.savedViews as Record<string, number> | undefined
                )?.[item.countKey] ?? 0,
              );
              const active = savedView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSavedView(item.id)}
                  className="w-full rounded-2xl border p-4 text-left transition-colors"
                  style={{
                    borderColor: active
                      ? theme.colors.accent.primary
                      : theme.colors.border.primary,
                    backgroundColor: active
                      ? `${theme.colors.accent.primary}14`
                      : theme.colors.background.secondary,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={sectionTitleStyle()}>
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm" style={textMutedStyle()}>
                        {item.description}
                      </p>
                    </div>
                    <Badge variant={active ? "info" : "default"} size="sm">
                      {count}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </Card>

          <Card variant="elevated" padding="lg">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="이름, 전화번호, 출석번호 검색"
                  className="rounded-lg px-3 py-3 xl:col-span-2"
                  style={fieldStyle()}
                />
                <select
                  value={schoolLevelFilter}
                  onChange={(event) =>
                    setSchoolLevelFilter(event.target.value as "" | SchoolLevel)
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  <option value="">학교급 전체</option>
                  {SCHOOL_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={gradeLevelFilter}
                  onChange={(event) => setGradeLevelFilter(event.target.value)}
                  type="number"
                  min="1"
                  max="12"
                  placeholder="학년"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <select
                  value={classFilter}
                  onChange={(event) => setClassFilter(event.target.value)}
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  <option value="">반 전체</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <select
                  value={lifecycleFilter}
                  onChange={(event) =>
                    setLifecycleFilter(
                      event.target.value as "" | LifecycleStatus,
                    )
                  }
                  className="rounded-lg px-3 py-3 md:w-64"
                  style={fieldStyle()}
                >
                  <option value="">학생 상태 전체</option>
                  {LIFECYCLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleToggleVisibleSelection}
                  >
                    {allVisibleSelected
                      ? "현재 페이지 선택 해제"
                      : "현재 페이지 전체 선택"}
                  </Button>
                  <Badge variant="info" size="sm">
                    선택 {selectedIds.length}명
                  </Badge>
                </div>
              </div>

              {isLoading ? (
                <p style={textMutedStyle()}>학생 목록을 불러오는 중입니다.</p>
              ) : students.length === 0 ? (
                <EmptyState title="조건에 맞는 학생이 없습니다." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={textMutedStyle()}>
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={handleToggleVisibleSelection}
                          />
                        </th>
                        <th className="px-3 py-3 text-left">이름</th>
                        <th className="px-3 py-3 text-left">학년</th>
                        <th className="px-3 py-3 text-left">반</th>
                        <th className="px-3 py-3 text-left">학생 상태</th>
                        <th className="px-3 py-3 text-left">수납</th>
                        <th className="px-3 py-3 text-left">등하원</th>
                        <th className="px-3 py-3 text-left">상담</th>
                        <th className="px-3 py-3 text-left">보호자 연락처</th>
                        <th className="px-3 py-3 text-left">최근 수정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const commute = getCommuteBadge(student.commuteStatus);
                        return (
                          <tr
                            key={student.id}
                            className="cursor-pointer border-t"
                            onClick={() => setSelectedStudentId(student.id)}
                            style={{
                              borderColor: theme.colors.border.secondary,
                              backgroundColor:
                                selectedStudentId === student.id
                                  ? `${theme.colors.accent.primary}12`
                                  : "transparent",
                            }}
                          >
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(student.id)}
                                onChange={(event) => {
                                  event.stopPropagation();
                                  handleToggleStudentSelection(student.id);
                                }}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div>
                                <p
                                  className="font-semibold"
                                  style={sectionTitleStyle()}
                                >
                                  {student.name}
                                </p>
                                <p className="text-xs" style={textMutedStyle()}>
                                  {student.attendancePin
                                    ? `출석번호 ${student.attendancePin}`
                                    : student.email || student.phone || "-"}
                                </p>
                              </div>
                            </td>
                            <td
                              className="px-3 py-3"
                              style={sectionTitleStyle()}
                            >
                              {getGradeLabel(student)}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={sectionTitleStyle()}
                            >
                              <div className="space-y-1">
                                <p>{student.activeClassCount ?? 0}개 반</p>
                                <p className="text-xs" style={textMutedStyle()}>
                                  {student.activeClassNames?.join(", ") ||
                                    "반 미배정"}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                variant={getLifecycleBadgeVariant(
                                  student.lifecycleStatus,
                                )}
                                size="sm"
                              >
                                {getLifecycleLabel(student.lifecycleStatus)}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                variant={getPaymentBadgeVariant(
                                  student.lastPaymentStatus,
                                )}
                                size="sm"
                              >
                                {student.hasOverduePayment
                                  ? "미납"
                                  : getPaymentLabel(student.lastPaymentStatus)}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Badge variant={commute.variant} size="sm">
                                {commute.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                variant={getFollowUpBadgeVariant(
                                  student.followUpStatus,
                                )}
                                size="sm"
                              >
                                {getFollowUpLabel(student.followUpStatus)}
                              </Badge>
                            </td>
                            <td
                              className="px-3 py-3"
                              style={sectionTitleStyle()}
                            >
                              {student.parentPhone || "-"}
                            </td>
                            <td className="px-3 py-3" style={textMutedStyle()}>
                              {formatDate(student.updatedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {total > PAGE_SIZE ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={textMutedStyle()}>
                    페이지 {page + 1} / {pageCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={page === 0}
                      onClick={() =>
                        setPage((current) => Math.max(0, current - 1))
                      }
                    >
                      이전
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={page >= pageCount - 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(pageCount - 1, current + 1),
                        )
                      }
                    >
                      다음
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            {!selectedStudent ? (
              <EmptyState
                title="학생을 선택하세요."
                description="기본 정보 수정과 반 배정을 오른쪽 패널에서 처리합니다."
              />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <h2
                      className="text-2xl font-bold"
                      style={sectionTitleStyle()}
                    >
                      {selectedStudent.name}
                    </h2>
                    <p className="text-sm" style={textMutedStyle()}>
                      {selectedStudent.email || "이메일 없음"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={getLifecycleBadgeVariant(
                        selectedStudent.lifecycleStatus,
                      )}
                      size="sm"
                    >
                      {getLifecycleLabel(selectedStudent.lifecycleStatus)}
                    </Badge>
                    <Badge
                      variant={
                        getCommuteBadge(selectedStudent.commuteStatus).variant
                      }
                      size="sm"
                    >
                      {getCommuteBadge(selectedStudent.commuteStatus).label}
                    </Badge>
                    <Badge
                      variant={getPaymentBadgeVariant(
                        selectedStudent.lastPaymentStatus,
                      )}
                      size="sm"
                    >
                      수납{" "}
                      {selectedStudent.hasOverduePayment
                        ? "미납"
                        : getPaymentLabel(selectedStudent.lastPaymentStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={detailForm.name}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="학생 이름"
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <input
                    value={detailForm.phone}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="학생 연락처"
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <input
                    value={detailForm.attendancePin}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        attendancePin: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4),
                      }))
                    }
                    inputMode="numeric"
                    placeholder="출석번호 4자리"
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <input
                    value={detailForm.parentName}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        parentName: event.target.value,
                      }))
                    }
                    placeholder="보호자 이름"
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <input
                    value={detailForm.parentPhone}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        parentPhone: event.target.value,
                      }))
                    }
                    placeholder="보호자 연락처"
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <select
                    value={detailForm.schoolLevel}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        schoolLevel: event.target.value as SchoolLevel,
                      }))
                    }
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  >
                    {SCHOOL_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={detailForm.gradeLevel}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        gradeLevel: event.target.value,
                      }))
                    }
                    type="number"
                    min="1"
                    max="12"
                    placeholder="학년"
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <select
                    value={detailForm.lifecycleStatus}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        lifecycleStatus: event.target.value as LifecycleStatus,
                      }))
                    }
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  >
                    {LIFECYCLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={detailForm.followUpStatus}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        followUpStatus: event.target.value as FollowUpStatus,
                      }))
                    }
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  >
                    {FOLLOW_UP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={detailForm.followUpDueDate}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        followUpDueDate: event.target.value,
                      }))
                    }
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <input
                    type="date"
                    value={detailForm.dateOfBirth}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        dateOfBirth: event.target.value,
                      }))
                    }
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />
                  <input
                    value={detailForm.address}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="주소"
                    className="rounded-lg px-3 py-3 md:col-span-2"
                    style={fieldStyle()}
                  />
                  <textarea
                    value={detailForm.notes}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="메모"
                    className="min-h-32 rounded-lg px-3 py-3 md:col-span-2"
                    style={fieldStyle()}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-sm font-semibold"
                      style={sectionTitleStyle()}
                    >
                      반 배정
                    </p>
                    <p className="text-xs" style={textMutedStyle()}>
                      현재 {detailClassIds.length}개 반
                    </p>
                  </div>
                  <div
                    className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto rounded-lg p-3 md:grid-cols-2"
                    style={fieldStyle()}
                  >
                    {classes.map((classItem) => {
                      const checked = detailClassIds.includes(classItem.id);
                      return (
                        <label
                          key={classItem.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setDetailClassIds((current) =>
                                event.target.checked
                                  ? [...current, classItem.id]
                                  : current.filter(
                                      (item) => item !== classItem.id,
                                    ),
                              )
                            }
                          />
                          <span style={sectionTitleStyle()}>
                            {classItem.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 gap-3 rounded-lg p-4"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <div>
                    <p className="text-xs" style={textMutedStyle()}>
                      최근 등원
                    </p>
                    <p
                      className="mt-1 font-semibold"
                      style={sectionTitleStyle()}
                    >
                      {formatDate(selectedStudent.lastCheckInAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={textMutedStyle()}>
                      최근 하원
                    </p>
                    <p
                      className="mt-1 font-semibold"
                      style={sectionTitleStyle()}
                    >
                      {formatDate(selectedStudent.lastCheckOutAt)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <Button
                    variant="danger"
                    onClick={handleDeleteStudent}
                    isLoading={deleteStudentMutation.isPending}
                  >
                    학생 삭제
                  </Button>
                  <Button
                    onClick={handleSaveDetail}
                    isLoading={
                      updateStudentMutation.isPending ||
                      syncEnrollmentsMutation.isPending
                    }
                  >
                    상세 저장
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card variant="elevated" padding="lg" className="w-full max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold" style={sectionTitleStyle()}>
                  학생 계정 생성
                </h2>
                <p className="text-sm" style={textMutedStyle()}>
                  새 학생 계정을 만들고 기본 분류와 출석번호를 바로 설정합니다.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                닫기
              </Button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="학생 이름"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  type="email"
                  placeholder="학생 이메일"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  type="password"
                  placeholder="비밀번호"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.passwordConfirm}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      passwordConfirm: event.target.value,
                    }))
                  }
                  type="password"
                  placeholder="비밀번호 확인"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.phone}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="학생 연락처"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.attendancePin}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      attendancePin: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="출석번호 4자리"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.parentName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      parentName: event.target.value,
                    }))
                  }
                  placeholder="보호자 이름"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.parentPhone}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      parentPhone: event.target.value,
                    }))
                  }
                  placeholder="보호자 연락처"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <select
                  value={createForm.schoolLevel}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      schoolLevel: event.target.value as SchoolLevel,
                    }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  {SCHOOL_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={createForm.gradeLevel}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      gradeLevel: event.target.value,
                    }))
                  }
                  type="number"
                  min="1"
                  max="12"
                  placeholder="학년"
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <select
                  value={createForm.lifecycleStatus}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      lifecycleStatus: event.target.value as LifecycleStatus,
                    }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  {LIFECYCLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={createForm.followUpStatus}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      followUpStatus: event.target.value as FollowUpStatus,
                    }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  {FOLLOW_UP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={createForm.followUpDueDate}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      followUpDueDate: event.target.value,
                    }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      dateOfBirth: event.target.value,
                    }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                />
                <input
                  value={createForm.address}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  placeholder="주소"
                  className="rounded-lg px-3 py-3 md:col-span-2"
                  style={fieldStyle()}
                />
                <textarea
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="메모"
                  className="min-h-28 rounded-lg px-3 py-3 md:col-span-2"
                  style={fieldStyle()}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  isLoading={createStudentMutation.isPending}
                >
                  생성
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
