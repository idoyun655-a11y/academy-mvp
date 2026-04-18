import DashboardLayout from "@/components/DashboardLayout";
import { Card, SearchBar, Badge } from "@/components/common/CommonComponents";
import Button from "@/components/common/Button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminNotices() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetRoles: "all",
  });

  const { data: noticesData, isLoading, refetch } = trpc.notices.list.useQuery({
    limit: 20,
    offset: page * 20,
  });

  const createNoticeMutation = trpc.notices.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setFormData({
        title: "",
        content: "",
        targetRoles: "all",
      });
      alert("공지가 등록되었습니다.");
    },
    onError: (error) => {
      alert("등록 실패: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const notices = noticesData?.data || [];
  const total = noticesData?.total || 0;
  const filteredNotices = notices.filter((notice: any) =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    return new Date(date).toLocaleDateString("ko-KR");
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
              공지사항 관리
            </h1>
            <p
              className="text-base"
              style={{ color: theme.colors.text.tertiary }}
            >
              총 {total}개의 공지사항을 관리합니다
            </p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            className="gap-2"
            onClick={() => setShowModal(true)}
          >
            <span className="text-lg">+</span>
            공지 작성
          </Button>
        </div>

        {/* 검색 바 */}
        <SearchBar
          placeholder="공지사항 제목으로 검색..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
        />

        {/* 공지사항 목록 */}
        {isLoading ? (
          <Card variant="elevated" padding="lg">
            <div
              className="text-center py-12"
              style={{ color: theme.colors.text.tertiary }}
            >
              로딩 중...
            </div>
          </Card>
        ) : filteredNotices.length > 0 ? (
          <div className="space-y-3">
            {filteredNotices.map((notice: any) => (
              <Card
                key={notice.id}
                variant="elevated"
                padding="md"
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 공지 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 제목 및 상태 */}
                    <div className="flex items-start gap-2 mb-2">
                      <p
                        className="font-semibold text-lg flex-1 truncate"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {notice.title}
                      </p>
                      <Badge
                        color={notice.isPublished ? "green" : "gray"}
                        style={{
                          backgroundColor: notice.isPublished
                            ? theme.colors.status.success
                            : theme.colors.background.secondary,
                          color: notice.isPublished
                            ? "#fff"
                            : theme.colors.text.tertiary,
                        }}
                      >
                        {notice.isPublished ? "게시됨" : "미게시"}
                      </Badge>
                    </div>

                    {/* 내용 미리보기 */}
                    <p
                      className="text-sm line-clamp-2 mb-3"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {notice.content}
                    </p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <span
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        📅 {getTimeAgo(notice.createdAt)}
                      </span>
                      <span
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        👥 대상: {notice.targetRoles
                          ? JSON.parse(notice.targetRoles).join(", ")
                          : "전체"}
                      </span>
                    </div>
                  </div>

                  {/* 작업 버튼 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="secondary" size="sm" title="게시 상태 변경">
                      {notice.isPublished ? "🔒" : "🔓"}
                    </Button>
                    <Button variant="secondary" size="sm" title="수정">
                      ✏️
                    </Button>
                    <Button variant="danger" size="sm" title="삭제">
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* 페이지네이션 */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                이전
              </Button>
              <span
                className="text-sm font-medium"
                style={{ color: theme.colors.text.primary }}
              >
                {page + 1} / {Math.ceil(total / 20)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(total / 20) - 1}
                onClick={() => setPage(page + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        ) : (
          <Card variant="elevated" padding="lg">
            <div className="text-center py-12">
              <p
                className="text-2xl mb-2"
              >
                📭
              </p>
              <p
                className="font-medium mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                공지사항이 없습니다
              </p>
              <p
                className="text-sm"
                style={{ color: theme.colors.text.tertiary }}
              >
                공지 작성 버튼을 클릭하여 새 공지를 추가하세요
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* 공지 작성 모달 */}
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
              공지 작성
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formData.title || !formData.content) {
                  alert("제목과 내용은 필수입니다.");
                  return;
                }
                createNoticeMutation.mutate({
                  title: formData.title,
                  content: formData.content,
                  targetRoles: formData.targetRoles === "all" ? undefined : [formData.targetRoles],
                  isPublished: true,
                });
              }}
              className="space-y-4"
            >
              {/* 제목 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="공지 제목"
                  required
                />
              </div>

              {/* 내용 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  내용 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="공지 내용"
                  rows={5}
                  required
                />
              </div>

              {/* 대상 */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text.secondary }}
                >
                  대상
                </label>
                <select
                  value={formData.targetRoles}
                  onChange={(e) =>
                    setFormData({ ...formData, targetRoles: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border.primary,
                    color: theme.colors.text.primary,
                  }}
                >
                  <option value="all">전체</option>
                  <option value="student">학생</option>
                  <option value="teacher">강사</option>
                  <option value="admin">관리자</option>
                </select>
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
                  disabled={createNoticeMutation.isPending}
                >
                  {createNoticeMutation.isPending ? "작성 중..." : "작성"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
