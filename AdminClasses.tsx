import DashboardLayout from "@/components/DashboardLayout";
import { Card, SearchBar } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminClasses() {
  const { user, isAuthenticated } = useAuth();
  const [searchName, setSearchName] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    teacher: "",
    capacity: "20",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    room: "",
  });

  const { data: classesData, isLoading, refetch } = trpc.classes.list.useQuery({
    limit: 20,
    offset: page * 20,
  });

  const createClassMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setFormData({
        name: "",
        subject: "",
        teacher: "",
        capacity: "20",
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        room: "",
      });
      alert("반이 등록되었습니다.");
    },
    onError: (error) => {
      alert("등록 실패: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const classes = classesData?.data || [];
  const total = classesData?.total || 0;

  const getDayOfWeekKorean = (day: string) => {
    const dayMap: Record<string, string> = {
      Monday: "월",
      Tuesday: "화",
      Wednesday: "수",
      Thursday: "목",
      Friday: "금",
      Saturday: "토",
      Sunday: "일",
    };
    return dayMap[day] || day;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject) {
      alert("반명과 과목은 필수입니다.");
      return;
    }
    createClassMutation.mutate({
      name: formData.name,
      subject: formData.subject,
      teacherId: 1, // 현재 사용자 ID
      capacity: parseInt(formData.capacity) || 20,
      room: formData.room || undefined,
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
              반 관리
            </h1>
            <p
              className="text-base"
              style={{ color: theme.colors.text.tertiary }}
            >
              총 {total}개의 반을 운영 중입니다
            </p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            className="gap-2"
            onClick={() => setShowModal(true)}
          >
            <span className="text-lg">+</span>
            반 등록
          </Button>
        </div>

        {/* 검색 바 */}
        <SearchBar
          placeholder="반명, 과목으로 검색..."
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setPage(0);
          }}
        />

        {/* 반 목록 */}
        {isLoading ? (
          <Card variant="elevated" padding="lg">
            <div
              className="text-center py-12"
              style={{ color: theme.colors.text.tertiary }}
            >
              로딩 중...
            </div>
          </Card>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls: any) => (
              <Card
                key={cls.id}
                variant="elevated"
                padding="md"
                className="hover:shadow-lg transition-shadow"
              >
                <div className="space-y-3">
                  <div>
                    <p
                      className="font-semibold text-lg"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {cls.name}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      📚 {cls.subject}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        강사:
                      </span>
                      <p
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {cls.teacher || "-"}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        시간:
                      </span>
                      <p
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {getDayOfWeekKorean(cls.dayOfWeek)} {cls.startTime} ~ {cls.endTime}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        정원:
                      </span>
                      <p
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {cls.capacity}명
                      </p>
                    </div>
                  </div>
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
              등록된 반이 없습니다.
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

      {/* 반 등록 모달 */}
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
              반 등록
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 반명 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  반명 *
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
                  placeholder="예: 수학 기초반"
                  required
                />
              </div>

              {/* 과목 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  과목 *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="예: 수학"
                  required
                />
              </div>

              {/* 강사 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  강사
                </label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="강사명"
                />
              </div>

              {/* 요일 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  요일
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfWeek: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                >
                  <option value="Monday">월요일</option>
                  <option value="Tuesday">화요일</option>
                  <option value="Wednesday">수요일</option>
                  <option value="Thursday">목요일</option>
                  <option value="Friday">금요일</option>
                  <option value="Saturday">토요일</option>
                  <option value="Sunday">일요일</option>
                </select>
              </div>

              {/* 시간 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    시작시간
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    종료시간
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border.primary,
                      color: theme.colors.text.primary,
                    }}
                  />
                </div>
              </div>

              {/* 정원 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  정원
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="20"
                  min="1"
                />
              </div>

              {/* 호실 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  호실
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({ ...formData, room: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="예: 101호"
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
                  disabled={createClassMutation.isPending}
                >
                  {createClassMutation.isPending ? "등록 중..." : "등록"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
