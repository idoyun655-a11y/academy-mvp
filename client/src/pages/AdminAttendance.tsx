import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/common/Button";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS, getAttendanceMeta } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AttendanceStatus = "present" | "late" | "absent" | "early_leave";

type ClassRow = {
  id: number;
  name: string;
};

type StudentRow = {
  id: number;
  name: string;
  phone?: string | null;
  parentPhone?: string | null;
};

type AttendanceRow = {
  id: number;
  studentId: number;
  studentName?: string | null;
  attendanceDate: string | Date;
  status: AttendanceStatus;
  notes?: string | null;
  updatedAt?: string | Date | null;
};

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "present", label: "출석" },
  { value: "late", label: "지각" },
  { value: "absent", label: "결석" },
  { value: "early_leave", label: "조퇴" },
];

function fieldStyle() {
  return {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.primary}`,
  } as const;
}

function mutedStyle() {
  return {
    color: theme.colors.text.tertiary,
  } as const;
}

function primaryTextStyle() {
  return {
    color: theme.colors.text.primary,
  } as const;
}

export default function AdminAttendance() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("present");
  const [bulkNotes, setBulkNotes] = useState("");

  const { data: classesData } = trpc.classes.list.useQuery(
    { limit: 100, offset: 0 },
    LIVE_QUERY_OPTIONS,
  );
  const { data: studentsData } = trpc.students.list.useQuery(
    {
      limit: 500,
      offset: 0,
      classId: selectedClassId ? Number(selectedClassId) : undefined,
    },
    {
      ...LIVE_QUERY_OPTIONS,
      enabled: Boolean(selectedClassId),
    },
  );
  const { data: attendanceData, isLoading } = trpc.attendance.list.useQuery(
    {
      classId: selectedClassId ? Number(selectedClassId) : undefined,
      date: selectedDate,
      limit: 500,
      offset: 0,
    },
    {
      ...LIVE_QUERY_OPTIONS,
      enabled: Boolean(selectedClassId),
    },
  );

  const bulkRecordMutation = trpc.attendance.bulkRecord.useMutation({
    onSuccess: async (result) => {
      toast.success(`${result.updatedCount}명의 출결을 저장했습니다.`);
      setSelectedIds([]);
      setBulkNotes("");
      await Promise.all([
        utils.attendance.list.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.portal.adminSummary.invalidate(),
      ]);
    },
    onError: (error: any) => {
      toast.error(error.message || "출결 저장 중 오류가 발생했습니다.");
    },
  });

  const classes = (classesData?.data ?? []) as ClassRow[];
  const students = useMemo(
    () =>
      [ ...((studentsData?.data ?? []) as StudentRow[]) ].sort((left, right) =>
        left.name.localeCompare(right.name, "ko"),
      ),
    [studentsData?.data],
  );
  const records = (attendanceData?.data ?? []) as AttendanceRow[];

  const attendanceByStudent = useMemo(
    () => new Map(records.map((record) => [record.studentId, record])),
    [records],
  );

  const allStudentIds = students.map((student) => student.id);
  const allSelected =
    allStudentIds.length > 0 &&
    allStudentIds.every((studentId) => selectedIds.includes(studentId));

  useEffect(() => {
    setSelectedIds([]);
    setBulkNotes("");
    setBulkStatus("present");
  }, [selectedClassId, selectedDate]);

  const stats = useMemo(
    () => ({
      totalStudents: students.length,
      selected: selectedIds.length,
      recorded: students.filter((student) => attendanceByStudent.has(student.id)).length,
      missing: students.filter((student) => !attendanceByStudent.has(student.id)).length,
      present: records.filter((record) => record.status === "present").length,
      late: records.filter((record) => record.status === "late").length,
      absent: records.filter((record) => record.status === "absent").length,
      earlyLeave: records.filter((record) => record.status === "early_leave").length,
    }),
    [attendanceByStudent, records, selectedIds.length, students],
  );

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const selectedClass = classes.find((item) => item.id === Number(selectedClassId));

  const handleToggleStudent = (studentId: number) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId],
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(allStudentIds);
  };

  const handleSelectMissing = () => {
    setSelectedIds(
      students
        .filter((student) => !attendanceByStudent.has(student.id))
        .map((student) => student.id),
    );
  };

  const handleSaveBulkAttendance = async () => {
    if (!selectedClassId || selectedIds.length === 0) return;

    await bulkRecordMutation.mutateAsync({
      classId: Number(selectedClassId),
      studentIds: selectedIds,
      attendanceDate: selectedDate,
      status: bulkStatus,
      notes: bulkNotes || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="mb-1 text-4xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            출결 관리
          </h1>
          <p className="text-base" style={mutedStyle()}>
            반 학생 전체를 불러온 뒤 전체 선택 또는 일부 선택으로 한 번에 출결을 저장합니다.
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_220px_minmax(0,1fr)]">
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="rounded-lg px-3 py-3"
              style={fieldStyle()}
            >
              <option value="">반 선택</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg px-3 py-3"
              style={fieldStyle()}
            />

            <div
              className="rounded-lg px-4 py-3"
              style={{
                backgroundColor: theme.colors.background.secondary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              <p className="text-sm" style={mutedStyle()}>
                현재 작업 기준
              </p>
              <p className="mt-1 font-semibold" style={primaryTextStyle()}>
                {selectedClass ? `${selectedClass.name} · ${selectedDate}` : "반을 먼저 선택하세요"}
              </p>
            </div>
          </div>

          <div
            className="mt-4 rounded-lg border px-4 py-3"
            style={{
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border.primary,
            }}
          >
            <p className="text-sm" style={mutedStyle()}>
              권장 흐름
            </p>
            <p className="mt-1 text-sm" style={primaryTextStyle()}>
              1. 전체 선택 후 출석 저장 2. 지각/결석 학생만 다시 선택해서 덮어쓰기
            </p>
          </div>
        </Card>

        {selectedClassId ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>반 학생 수</p>
                <p className="text-2xl font-bold" style={primaryTextStyle()}>
                  {stats.totalStudents}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>선택 학생</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.accent.primary }}>
                  {stats.selected}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>기록 완료</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.status.success }}>
                  {stats.recorded}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>미기록</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.status.warning }}>
                  {stats.missing}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>출석</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.status.success }}>
                  {stats.present}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>지각</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.status.warning }}>
                  {stats.late}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>결석</p>
                <p className="text-2xl font-bold" style={{ color: theme.colors.status.error }}>
                  {stats.absent}
                </p>
              </Card>
              <Card variant="elevated" padding="md">
                <p style={mutedStyle()}>조퇴</p>
                <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                  {stats.earlyLeave}
                </p>
              </Card>
            </div>

            <Card variant="elevated" padding="lg">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      일괄 출결 저장
                    </h2>
                    <p className="mt-1 text-sm" style={mutedStyle()}>
                      선택된 학생 {selectedIds.length}명에게 같은 상태를 한 번에 적용합니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={handleSelectAll}>
                      {allSelected ? "전체 해제" : "전체 선택"}
                    </Button>
                    <Button variant="secondary" onClick={handleSelectMissing}>
                      미기록만 선택
                    </Button>
                    <Button variant="secondary" onClick={() => setSelectedIds([])}>
                      선택 해제
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_180px]">
                  <select
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value as AttendanceStatus)}
                    className="rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={bulkNotes}
                    onChange={(event) => setBulkNotes(event.target.value)}
                    placeholder="선택 학생 전체에 공통으로 들어갈 비고"
                    className="min-h-24 rounded-lg px-3 py-3"
                    style={fieldStyle()}
                  />

                  <Button
                    onClick={handleSaveBulkAttendance}
                    disabled={selectedIds.length === 0}
                    isLoading={bulkRecordMutation.isPending}
                    size="lg"
                  >
                    {bulkRecordMutation.isPending ? "저장 중..." : `${selectedIds.length || 0}명 저장`}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : null}

        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                반 학생 명단
              </h2>
              <p className="mt-1 text-sm" style={mutedStyle()}>
                {selectedClass ? `${selectedClass.name} 학생 ${students.length}명` : "반을 선택하면 학생 리스트가 나타납니다."}
              </p>
            </div>
            {selectedClassId ? (
              <Badge variant="info" size="sm">
                선택 {selectedIds.length}명
              </Badge>
            ) : null}
          </div>

          {!selectedClassId ? (
            <div className="mt-4">
              <EmptyState title="반을 먼저 선택해 주세요" />
            </div>
          ) : isLoading ? (
            <p className="mt-4" style={mutedStyle()}>
              학생과 출결 기록을 불러오는 중입니다.
            </p>
          ) : students.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="이 반에 등록된 학생이 없습니다." />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ color: theme.colors.text.tertiary }}>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-3 text-left">학생</th>
                    <th className="px-3 py-3 text-left">학생 연락처</th>
                    <th className="px-3 py-3 text-left">보호자 연락처</th>
                    <th className="px-3 py-3 text-left">현재 출결</th>
                    <th className="px-3 py-3 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const checked = selectedIds.includes(student.id);
                    const record = attendanceByStudent.get(student.id);
                    const meta = record ? getAttendanceMeta(record.status) : null;

                    return (
                      <tr
                        key={student.id}
                        className="border-t"
                        style={{
                          borderColor: theme.colors.border.secondary,
                          backgroundColor: checked
                            ? `${theme.colors.accent.primary}10`
                            : "transparent",
                        }}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleStudent(student.id)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <p className="font-semibold" style={primaryTextStyle()}>
                              {student.name}
                            </p>
                            <p className="text-xs" style={mutedStyle()}>
                              학생 ID {student.id}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3" style={primaryTextStyle()}>
                          {student.phone || "-"}
                        </td>
                        <td className="px-3 py-3" style={primaryTextStyle()}>
                          {student.parentPhone || "-"}
                        </td>
                        <td className="px-3 py-3">
                          {record && meta ? (
                            <Badge size="sm" style={{ backgroundColor: meta.color, color: "#fff" }}>
                              {meta.label}
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              미기록
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-3" style={mutedStyle()}>
                          {record?.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
