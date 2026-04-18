import { Card, Badge, Input } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { useState, useMemo } from "react";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StudentProfile() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "grades">("profile");

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  // 샘플 데이터
  const [studentData, setStudentData] = useState({
    name: "김철수",
    email: "student1@academy.com",
    phone: "010-3333-3333",
    parentPhone: "010-9999-9999",
    parentName: "김철수 부모",
    dateOfBirth: "2010-05-15",
    address: "서울시 강남구",
    enrolledClasses: [
      { id: 1, name: "수학 기초반", teacher: "박강사", status: "active" },
      { id: 3, name: "영어 회화반", teacher: "이강사", status: "active" },
    ],
    paymentStatus: [
      { month: "2월", amount: 250000, status: "paid", dueDate: "2024-02-01", paidDate: "2024-02-01" },
      { month: "1월", amount: 250000, status: "paid", dueDate: "2024-01-01", paidDate: "2024-01-01" },
    ],
  });

  const [editData, setEditData] = useState(studentData);

  // 나이 기반 등급제 결정 로직
  const calculateGradeType = (dateOfBirth: string): "5" | "9" => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date(2026, 3, 12); // 2026년 기준
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    // 2026년 기준 고2(18세) 이하는 5등급제, 초과는 9등급제
    return age <= 18 ? "5" : "9";
  };

  const gradeType = useMemo(() => calculateGradeType(studentData.dateOfBirth), []);

  // 성적 데이터 (읽기 전용)
  const grades = {
    mockExams: [
      { month: "3", korean: 3, english: 2, math: 4, science: 3, social: 2 },
      { month: "6", korean: 2, english: 2, math: 3, science: 2, social: 1 },
    ],
    schoolGrade: 3,
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "paid":
        return { bg: theme.colors.status.success, text: "#fff" };
      case "pending":
        return { bg: "#F59E0B", text: "#fff" };
      case "overdue":
        return { bg: theme.colors.status.error, text: "#fff" };
      default:
        return { bg: theme.colors.background.secondary, text: theme.colors.text.tertiary };
    }
  };

  const getPaymentLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "납부완료";
      case "pending":
        return "대기중";
      case "overdue":
        return "미납";
      default:
        return "미정";
    }
  };

  const handleSave = () => {
    setStudentData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(studentData);
    setIsEditing(false);
  };

  const subjects = ["korean", "english", "math", "science", "social"] as const;
  const subjectLabels = {
    korean: "국어",
    english: "영어",
    math: "수학",
    science: "과학",
    social: "사회",
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      {/* 헤더 */}
      <header
        className="border-b"
        style={{
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            👤 내 정보
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: theme.colors.text.tertiary }}
          >
            개인정보 및 수강 정보 관리
          </p>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div
        className="border-b sticky top-0 z-10"
        style={{ backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.primary }}
      >
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
          <button
            onClick={() => setActiveTab("profile")}
            className="px-4 py-3 font-medium transition-colors border-b-2"
            style={{
              color: activeTab === "profile" ? theme.colors.accent.primary : theme.colors.text.tertiary,
              borderColor: activeTab === "profile" ? theme.colors.accent.primary : "transparent",
            }}
          >
            개인정보
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className="px-4 py-3 font-medium transition-colors border-b-2"
            style={{
              color: activeTab === "grades" ? theme.colors.accent.primary : theme.colors.text.tertiary,
              borderColor: activeTab === "grades" ? theme.colors.accent.primary : "transparent",
            }}
          >
            성적 조회
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* 개인정보 */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  개인정보
                </h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                      >
                        저장
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCancel}
                      >
                        취소
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      수정
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    이름
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="이름"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    이메일
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="이메일"
                      type="email"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    전화번호
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="전화번호"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    생년월일
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.dateOfBirth}
                      onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                      placeholder="생년월일"
                      type="date"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.dateOfBirth}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    주소
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      placeholder="주소"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.address}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* 보호자정보 */}
            <Card variant="elevated" padding="lg">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                보호자정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    보호자명
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.parentName}
                      onChange={(e) => setEditData({ ...editData, parentName: e.target.value })}
                      placeholder="보호자명"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.parentName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                    연락처
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.parentPhone}
                      onChange={(e) => setEditData({ ...editData, parentPhone: e.target.value })}
                      placeholder="연락처"
                    />
                  ) : (
                    <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                      {studentData.parentPhone}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* 수강정보 */}
            <Card variant="elevated" padding="lg">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                수강정보
              </h2>
              <div className="space-y-3">
                {studentData.enrolledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: theme.colors.text.primary }}>
                          {cls.name}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                          강사: {cls.teacher}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">
                        수강중
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 수강료정보 */}
            <Card variant="elevated" padding="lg">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                수강료정보
              </h2>
              <div className="space-y-3">
                {studentData.paymentStatus.map((payment, idx) => {
                  const colors = getPaymentColor(payment.status);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: theme.colors.background.secondary }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: theme.colors.text.primary }}>
                          {payment.month}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                          {payment.amount.toLocaleString()}원
                        </p>
                      </div>
                      <Badge variant={payment.status === "paid" ? "success" : "warning"} size="sm">
                        {getPaymentLabel(payment.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "grades" && (
          <div className="space-y-6">
            {/* 등급제 정보 */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    등급제 정보
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.colors.text.tertiary }}>
                    2026년 기준 고2(18세) 이하는 5등급제, 초과는 9등급제 적용
                  </p>
                </div>
                <Badge variant={gradeType === "5" ? "info" : "warning"} size="sm">
                  {gradeType}등급제
                </Badge>
              </div>
            </Card>

            {/* 모의고사 성적 */}
            <Card variant="elevated" padding="lg">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                📊 모의고사 성적
              </h2>
              <div className="space-y-4">
                {grades.mockExams.map((exam) => (
                  <div
                    key={exam.month}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <h3
                      className="font-semibold mb-3"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {exam.month}월 모의고사
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {subjects.map((subject) => (
                        <div key={subject} className="text-center">
                          <p className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                            {subjectLabels[subject]}
                          </p>
                          <p
                            className="text-2xl font-bold mt-1"
                            style={{ color: theme.colors.accent.primary }}
                          >
                            {exam[subject]}
                          </p>
                          <p className="text-xs mt-1" style={{ color: theme.colors.text.tertiary }}>
                            등급
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 내신 성적 */}
            <Card variant="elevated" padding="lg">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                📈 내신 성적
              </h2>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: theme.colors.background.secondary }}>
                <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                  내신 등급
                </p>
                <p
                  className="text-4xl font-bold mt-2"
                  style={{ color: theme.colors.accent.primary }}
                >
                  {grades.schoolGrade}
                </p>
                <p className="text-sm mt-2" style={{ color: theme.colors.text.tertiary }}>
                  ({gradeType}등급제)
                </p>
              </div>
            </Card>

            {/* 성적 통계 그래프 */}
            <Card variant="elevated" padding="lg">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                📉 성적 추이
              </h2>
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const values = grades.mockExams.map((exam) => exam[subject]);
                  const avgGrade = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
                  return (
                    <div key={subject}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: theme.colors.text.primary }}>
                          {subjectLabels[subject]}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: theme.colors.accent.primary }}
                        >
                          평균 {avgGrade}등급
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {values.map((grade, idx) => (
                          <div
                            key={idx}
                            className="flex-1 rounded text-center py-2"
                            style={{
                              backgroundColor: theme.colors.accent.primary,
                              opacity: 1 - (grade - 1) / 8,
                            }}
                          >
                            <span className="text-xs font-semibold" style={{ color: "#fff" }}>
                              {grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 성적 입력 안내 */}
            <Card variant="elevated" padding="lg">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: theme.colors.background.secondary }}
              >
                <p style={{ color: theme.colors.text.tertiary }}>
                  💡 성적은 관리자 또는 강사만 입력할 수 있습니다.
                </p>
                <p className="text-sm mt-2" style={{ color: theme.colors.text.tertiary }}>
                  성적 입력이 필요하신 경우 관리자에게 문의해주세요.
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
