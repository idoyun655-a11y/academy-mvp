import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useMemo, useState } from "react";

type MockExamForm = {
  korean: string;
  english: string;
  math: string;
  science: string;
  social: string;
};

const INITIAL_MOCK_EXAM_FORM: MockExamForm = {
  korean: "",
  english: "",
  math: "",
  science: "",
  social: "",
};

export default function AdminGrades() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [searchName, setSearchName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"mockExam" | "schoolGrade">("mockExam");
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [schoolGrade, setSchoolGrade] = useState("");
  const [schoolGradeType, setSchoolGradeType] = useState<"5" | "9">("9");
  const [mockExamForm, setMockExamForm] = useState<MockExamForm>(INITIAL_MOCK_EXAM_FORM);

  const { data: studentsData } = trpc.students.list.useQuery(
    { limit: 200, offset: 0, search: searchName || undefined },
    LIVE_QUERY_OPTIONS
  );

  const { data: gradeStats } = trpc.grades.getStats.useQuery(
    { studentId: selectedStudentId || 0 },
    {
      ...LIVE_QUERY_OPTIONS,
      enabled: Boolean(selectedStudentId),
    }
  );

  const saveGradeMutation = trpc.grades.save.useMutation({
    onSuccess: async () => {
      setMockExamForm(INITIAL_MOCK_EXAM_FORM);
      setSchoolGrade("");
      await Promise.all([
        utils.grades.getStats.invalidate(),
        utils.portal.linkedStudents.invalidate(),
      ]);
    },
  });

  const students = studentsData?.data ?? [];
  const filteredStudents = useMemo(() => students, [students]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-4xl font-bold mb-1"
            style={{ color: theme.colors.text.primary }}
          >
            성적 관리
          </h1>
          <p
            className="text-base"
            style={{ color: theme.colors.text.tertiary }}
          >
            학생 선택 후 저장하면 학생 / 학부모 포털 성적 화면이 자동 갱신됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="elevated" padding="lg">
            <SearchBar
              placeholder="학생 검색"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <div className="mt-4 space-y-2 max-h-[32rem] overflow-y-auto">
              {filteredStudents.map((student: any) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className="w-full text-left p-3 rounded-lg"
                  style={{
                    backgroundColor:
                      selectedStudentId === student.id
                        ? theme.colors.accent.primary
                        : theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                  }}
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs mt-1 opacity-80">{student.email || "-"}</p>
                </button>
              ))}
              {filteredStudents.length === 0 && <EmptyState title="학생이 없습니다" />}
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {!selectedStudentId ? (
              <Card variant="elevated" padding="lg">
                <EmptyState title="학생을 먼저 선택해 주세요" />
              </Card>
            ) : (
              <>
                <div
                  className="flex gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <button
                    onClick={() => setActiveTab("mockExam")}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor:
                        activeTab === "mockExam"
                          ? theme.colors.accent.primary
                          : "transparent",
                      color: theme.colors.text.primary,
                    }}
                  >
                    모의고사
                  </button>
                  <button
                    onClick={() => setActiveTab("schoolGrade")}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor:
                        activeTab === "schoolGrade"
                          ? theme.colors.accent.primary
                          : "transparent",
                      color: theme.colors.text.primary,
                    }}
                  >
                    내신
                  </button>
                </div>

                {activeTab === "mockExam" && (
                  <Card variant="elevated" padding="lg">
                    <div className="space-y-4">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-3 py-3 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      >
                        {["3", "6", "9", "10"].map((month) => (
                          <option key={month} value={month}>
                            {month}월 모의고사
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(mockExamForm).map((subject) => (
                          <input
                            key={subject}
                            type="number"
                            min="1"
                            max="9"
                            value={mockExamForm[subject as keyof MockExamForm]}
                            onChange={(e) =>
                              setMockExamForm({
                                ...mockExamForm,
                                [subject]: e.target.value,
                              })
                            }
                            placeholder={`${subject} 등급`}
                            className="px-3 py-3 rounded-lg"
                            style={{
                              backgroundColor: theme.colors.background.secondary,
                              color: theme.colors.text.primary,
                              border: `1px solid ${theme.colors.border.primary}`,
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          saveGradeMutation.mutate({
                            studentId: selectedStudentId,
                            mockExamMonth: selectedMonth as any,
                            korean: mockExamForm.korean ? Number(mockExamForm.korean) : undefined,
                            english: mockExamForm.english ? Number(mockExamForm.english) : undefined,
                            math: mockExamForm.math ? Number(mockExamForm.math) : undefined,
                            science: mockExamForm.science ? Number(mockExamForm.science) : undefined,
                            social: mockExamForm.social ? Number(mockExamForm.social) : undefined,
                          })
                        }
                        className="px-4 py-3 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: theme.colors.accent.primary,
                          color: "#fff",
                        }}
                      >
                        모의고사 저장
                      </button>
                    </div>
                  </Card>
                )}

                {activeTab === "schoolGrade" && (
                  <Card variant="elevated" padding="lg">
                    <div className="space-y-4">
                      <input
                        type="number"
                        min="1"
                        max="9"
                        value={schoolGrade}
                        onChange={(e) => setSchoolGrade(e.target.value)}
                        placeholder="내신 등급"
                        className="w-full px-3 py-3 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      />
                      <select
                        value={schoolGradeType}
                        onChange={(e) => setSchoolGradeType(e.target.value as "5" | "9")}
                        className="w-full px-3 py-3 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      >
                        <option value="5">5등급제</option>
                        <option value="9">9등급제</option>
                      </select>
                      <button
                        onClick={() =>
                          saveGradeMutation.mutate({
                            studentId: selectedStudentId,
                            schoolGrade: schoolGrade ? Number(schoolGrade) : undefined,
                            schoolGradeType,
                          })
                        }
                        className="px-4 py-3 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: theme.colors.accent.primary,
                          color: "#fff",
                        }}
                      >
                        내신 저장
                      </button>
                    </div>
                  </Card>
                )}

                <Card variant="elevated" padding="lg">
                  <h2
                    className="text-lg font-semibold mb-4"
                    style={{ color: theme.colors.text.primary }}
                  >
                    저장된 성적
                  </h2>
                  <div className="space-y-3">
                    {(gradeStats?.mockExams ?? []).map((exam: any) => (
                      <div
                        key={exam.id}
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: theme.colors.background.secondary }}
                      >
                        <p style={{ color: theme.colors.text.primary }}>
                          {exam.mockExamMonth}월 모의고사
                        </p>
                        <p
                          className="text-sm mt-1"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          국어 {exam.korean ?? "-"} / 영어 {exam.english ?? "-"} / 수학 {exam.math ?? "-"} / 과학 {exam.science ?? "-"} / 사회 {exam.social ?? "-"}
                        </p>
                      </div>
                    ))}
                    {gradeStats?.schoolGrades?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: theme.colors.background.secondary }}
                      >
                        <p style={{ color: theme.colors.text.primary }}>
                          내신 {item.schoolGrade ?? "-"}등급
                        </p>
                        <p
                          className="text-sm mt-1"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {item.schoolGradeType || "-"}등급제
                        </p>
                      </div>
                    ))}
                    {(!gradeStats ||
                      ((gradeStats.mockExams?.length ?? 0) === 0 &&
                        (gradeStats.schoolGrades?.length ?? 0) === 0)) && (
                      <EmptyState title="저장된 성적이 없습니다" />
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
