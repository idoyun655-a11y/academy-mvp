import DashboardLayout from "@/components/DashboardLayout";
import { Card, SearchBar } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminClasses() {
  const { user, isAuthenticated } = useAuth();
  const dayOptions = [
    { value: 1, label: "월요일" },
    { value: 2, label: "화요일" },
    { value: 3, label: "수요일" },
    { value: 4, label: "목요일" },
    { value: 5, label: "금요일" },
    { value: 6, label: "토요일" },
    { value: 0, label: "일요일" },
  ];
  const [searchName, setSearchName] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    teacher: "",
    capacity: "20",
    room: "",
  });
  const [schedules, setSchedules] = useState([
    { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
  ]);

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
        room: "",
      });
      setSchedules([{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]);
      alert("반이 등록되었습니다.");
    },
    onError: (error) => {
      alert("등록 실패: " + error.message);
    },
  });

  const deleteClassMutation = trpc.classes.delete.useMutation({
    onSuccess: () => {
      refetch();
      alert("반이 삭제되었습니다.");
    },
    onError: (error) => {
      alert("삭제 실패: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const classes = classesData?.data || [];
  const total = classesData?.total || 0;

  const getDayLabelByNumber = (dayOfWeek: number) => {
    const day = dayOptions.find((item) => item.value === dayOfWeek);
    return day?.label ?? "요일 미설정";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject) {
      alert("반명과 과목은 필수입니다.");
      return;
    }
    if (schedules.length === 0) {
      alert("최소 1개 이상의 시간표를 추가해주세요.");
      return;
    }
    createClassMutation.mutate({
      name: formData.name,
      subject: formData.subject,
      teacherId: 1, // 현재 사용자 ID
      capacity: parseInt(formData.capacity) || 20,
      room: formData.room || undefined,
      schedules,
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
                        시간표:
                      </span>
                      {cls.schedules && cls.schedules.length > 0 ? (
                        <div
                          className="mt-1 space-y-1"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          {cls.schedules.map((schedule: any) => (
                            <p key={schedule.id}>
                              {getDayLabelByNumber(schedule.dayOfWeek)} {schedule.startTime} ~ {schedule.endTime}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p
                          style={{ color: theme.colors.text.secondary }}
                        >
                          미설정
                        </p>
                      )}
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
                  <Button
                    variant="ghost"
                    className="w-full !text-red-500 hover:!bg-red-50"
                    onClick={() => {
                      const shouldDelete = confirm(`'${cls.name}' 반을 삭제하시겠습니까?`);
                      if (!shouldDelete) return;
                      deleteClassMutation.mutate({ id: cls.id });
                    }}
                    disabled={deleteClassMutation.isPending}
                  >
                    반 삭제
                  </Button>
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

              {/* 시간표 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-sm font-medium"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    요일별 시간표 *
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setSchedules([
                        ...schedules,
                        { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
                      ])
                    }
                  >
                    시간대 추가
                  </Button>
                </div>

                <div className="space-y-2">
                  {schedules.map((schedule, index) => (
                    <div key={`${schedule.dayOfWeek}-${index}`} className="grid grid-cols-12 gap-2">
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].dayOfWeek = Number(e.target.value);
                          setSchedules(newSchedules);
                        }}
                        className="col-span-4 px-3 py-2 rounded border"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          borderColor: theme.colors.border.primary,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {dayOptions.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].startTime = e.target.value;
                          setSchedules(newSchedules);
                        }}
                        className="col-span-3 px-3 py-2 rounded border"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          borderColor: theme.colors.border.primary,
                          color: theme.colors.text.primary,
                        }}
                      />

                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index].endTime = e.target.value;
                          setSchedules(newSchedules);
                        }}
                        className="col-span-3 px-3 py-2 rounded border"
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          borderColor: theme.colors.border.primary,
                          color: theme.colors.text.primary,
                        }}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        className="col-span-2 !text-red-500"
                        onClick={() =>
                          setSchedules(schedules.filter((_, scheduleIndex) => scheduleIndex !== index))
                        }
                        disabled={schedules.length === 1}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
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
