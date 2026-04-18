import DashboardLayout from "@/components/DashboardLayout";
import { Card, SearchBar, Badge } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminStudents() {
  const { user, isAuthenticated } = useAuth();
  const [searchName, setSearchName] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string | null;
    parentName: string | null;
    parentPhone: string | null;
    address: string | null;
  }>({
    name: "",
    email: "",
    phone: null,
    parentName: null,
    parentPhone: null,
    address: null,
  });

  const { data: studentsData, isLoading, refetch } = trpc.students.list.useQuery({
    limit: 20,
    offset: page * 20,
  });

  const createStudentMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        phone: null,
        parentName: null,
        parentPhone: null,
        address: null,
      });
      alert("학생이 등록되었습니다.");
    },
    onError: (error) => {
      alert("등록 실패: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const students = studentsData?.data || [];
  const total = studentsData?.total || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("이름과 이메일은 필수입니다.");
      return;
    }
    if (!user?.id) {
      alert("사용자 정보를 불러올 수 없습니다.");
      return;
    }
    createStudentMutation.mutate({
      userId: user.id,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      parentName: formData.parentName || undefined,
      parentPhone: formData.parentPhone || undefined,
      address: formData.address || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-4xl font-bold mb-1"
              style={{ color: theme.colors.text.primary }}
            >
              학생 관리
            </h1>
            <p
              className="text-base"
              style={{ color: theme.colors.text.tertiary }}
            >
              총 {total}명의 학생 정보를 관리합니다
            </p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            className="gap-2"
            onClick={() => setShowModal(true)}
          >
            <span className="text-lg">+</span>
            학생 등록
          </Button>
        </div>

        {/* 검색 바 */}
        <SearchBar
          placeholder="학생명, 이메일, 전화번호로 검색..."
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setPage(0);
          }}
        />

        {/* 학생 목록 */}
        {isLoading ? (
          <Card variant="elevated" padding="lg">
            <div
              className="text-center py-12"
              style={{ color: theme.colors.text.tertiary }}
            >
              로딩 중...
            </div>
          </Card>
        ) : students.length > 0 ? (
          <div className="space-y-3">
            {students.map((student: any) => (
              <Card
                key={student.id}
                variant="elevated"
                padding="md"
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* 학생 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.accent.primary,
                        }}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold truncate"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {student.name}
                        </p>
                        <p
                          className="text-sm truncate"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {student.email}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          전화:
                        </span>
                        <p
                          style={{ color: theme.colors.text.secondary }}
                        >
                          {student.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          보호자:
                        </span>
                        <p
                          style={{ color: theme.colors.text.secondary }}
                        >
                          {student.parentName || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 상태 배지 */}
                  <Badge
                    variant={student.isActive ? "success" : "error"}
                    size="md"
                  >
                    {student.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="elevated" padding="lg">
            <div
              className="text-center py-12"
              style={{ color: theme.colors.text.tertiary }}
            >
              등록된 학생이 없습니다.
            </div>
          </Card>
        )}

        {/* 페이지네이션 */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              이전
            </Button>
            <span
              className="px-4 py-2 flex items-center"
              style={{ color: theme.colors.text.secondary }}
            >
              {page + 1} / {Math.ceil(total / 20)}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * 20 >= total}
            >
              다음
            </Button>
          </div>
        )}
      </div>

      {/* 학생 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card
            variant="elevated"
            padding="lg"
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              학생 등록
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이름 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="학생 이름"
                  required
                />
              </div>

              {/* 이메일 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  이메일 *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="student@example.com"
                  required
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="010-1234-5678"
                />
              </div>

              {/* 보호자 이름 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  보호자 이름
                </label>
                <input
                  type="text"
                  value={formData.parentName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="보호자 이름"
                />
              </div>

              {/* 보호자 전화번호 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  보호자 전화번호
                </label>
                <input
                  type="tel"
                  value={formData.parentPhone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="010-9876-5432"
                />
              </div>

              {/* 주소 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="학생 주소"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                  type="button"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  type="submit"
                  disabled={createStudentMutation.isPending}
                >
                  {createStudentMutation.isPending ? "등록 중..." : "등록"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
