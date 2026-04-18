import DashboardLayout from "@/components/DashboardLayout";
import { Card, SearchBar, Badge, Input } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminGrades() {
  const { user, isAuthenticated } = useAuth();
  const [searchName, setSearchName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"mockExam" | "schoolGrade">("mockExam");
  const [selectedMonth, setSelectedMonth] = useState("3");

  const { data: studentsData } = trpc.students.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const [grades, setGrades] = useState({
    korean: "",
    english: "",
    math: "",
    science: "",
    social: "",
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const students = studentsData?.data || [];
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const subjects = ["korean", "english", "math", "science", "social"] as const;
  const subjectLabels = {
    korean: "국어",
    english: "영어",
    math: "수학",
    science: "과학",
    social: "사회",
  };

  const handleSaveGrades = () => {
    if (!selectedStudent) {
      alert("학생을 선택해주세요");
      return;
    }
    // API 호출 로직 추가
    alert("성적이 저장되었습니다");
    setGrades({
      korean: "",
      english: "",
      math: "",
      science: "",
      social: "",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
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
            학생의 모의고사 및 내신 성적을 관리합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 학생 선택 */}
          <Card variant="elevated" padding="lg">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              학생 선택
            </h2>
            <SearchBar
              placeholder="학생 이름 검색..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p
                  className="text-center py-4"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  학생이 없습니다
                </p>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className="w-full p-3 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor:
                        selectedStudent === student.id
                          ? theme.colors.accent.primary
                          : theme.colors.background.secondary,
                      color:
                        selectedStudent === student.id
                          ? "#fff"
                          : theme.colors.text.primary,
                    }}
                  >
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-xs" style={{ color: selectedStudent === student.id ? "rgba(255,255,255,0.7)" : theme.colors.text.tertiary }}>
                      {student.email}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* 성적 입력 */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStudent ? (
              <>
                {/* 탭 네비게이션 */}
                <div
                  className="flex gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <button
                    onClick={() => setActiveTab("mockExam")}
                    className="flex-1 px-4 py-2 rounded transition-colors font-medium"
                    style={{
                      backgroundColor:
                        activeTab === "mockExam"
                          ? theme.colors.accent.primary
                          : "transparent",
                      color:
                        activeTab === "mockExam"
                          ? "#fff"
                          : theme.colors.text.tertiary,
                    }}
                  >
                    모의고사
                  </button>
                  <button
                    onClick={() => setActiveTab("schoolGrade")}
                    className="flex-1 px-4 py-2 rounded transition-colors font-medium"
                    style={{
                      backgroundColor:
                        activeTab === "schoolGrade"
                          ? theme.colors.accent.primary
                          : "transparent",
                      color:
                        activeTab === "schoolGrade"
                          ? "#fff"
                          : theme.colors.text.tertiary,
                    }}
                  >
                    내신
                  </button>
                </div>

                {/* 모의고사 성적 입력 */}
                {activeTab === "mockExam" && (
                  <Card variant="elevated" padding="lg">
                    <h3
                      className="text-lg font-semibold mb-4"
                      style={{ color: theme.colors.text.primary }}
                    >
                      📊 모의고사 성적 입력
                    </h3>

                    {/* 월 선택 */}
                    <div className="mb-6">
                      <label
                        className="text-sm font-medium mb-2 block"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        시험 월
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["3", "6", "9", "10"].map((month) => (
                          <button
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className="py-2 rounded font-medium transition-colors"
                            style={{
                              backgroundColor:
                                selectedMonth === month
                                  ? theme.colors.accent.primary
                                  : theme.colors.background.secondary,
                              color:
                                selectedMonth === month
                                  ? "#fff"
                                  : theme.colors.text.primary,
                            }}
                          >
                            {month}월
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 과목별 성적 입력 */}
                    <div className="space-y-4">
                      {subjects.map((subject) => (
                        <div key={subject}>
                          <label
                            className="text-sm font-medium mb-2 block"
                            style={{ color: theme.colors.text.tertiary }}
                          >
                            {subjectLabels[subject]} (1-9등급)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="9"
                            value={grades[subject]}
                            onChange={(e) =>
                              setGrades({
                                ...grades,
                                [subject]: e.target.value,
                              })
                            }
                            placeholder="등급 입력"
                          />
                        </div>
                      ))}
                    </div>

                    {/* 저장 버튼 */}
                    <Button
                      variant="primary"
                      className="w-full mt-6"
                      onClick={handleSaveGrades}
                    >
                      저장
                    </Button>
                  </Card>
                )}

                {/* 내신 성적 입력 */}
                {activeTab === "schoolGrade" && (
                  <Card variant="elevated" padding="lg">
                    <h3
                      className="text-lg font-semibold mb-4"
                      style={{ color: theme.colors.text.primary }}
                    >
                      📈 내신 성적 입력
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label
                          className="text-sm font-medium mb-2 block"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          내신 등급 (1-5 또는 1-9)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="9"
                          placeholder="등급 입력"
                        />
                        <p
                          className="text-xs mt-2"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          💡 학생의 나이에 따라 자동으로 등급제가 적용됩니다.
                        </p>
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <Button
                      variant="primary"
                      className="w-full mt-6"
                      onClick={handleSaveGrades}
                    >
                      저장
                    </Button>
                  </Card>
                )}
              </>
            ) : (
              <Card variant="elevated" padding="lg">
                <div
                  className="text-center py-8"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  <p className="text-lg">좌측에서 학생을 선택해주세요</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
