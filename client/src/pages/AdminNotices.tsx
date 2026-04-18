import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge, Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS, formatDate } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useMemo, useState } from "react";

const TARGET_ROLE_OPTIONS = {
  both: ["student", "parent"],
  student: ["student"],
  parent: ["parent"],
  all: ["student", "parent", "admin"],
};

export default function AdminNotices() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetRoles: "both" as keyof typeof TARGET_ROLE_OPTIONS,
  });

  const { data, isLoading } = trpc.notices.list.useQuery(
    { limit: 20, offset: page * 20 },
    LIVE_QUERY_OPTIONS
  );

  const createNoticeMutation = trpc.notices.create.useMutation({
    onSuccess: async () => {
      setShowModal(false);
      setFormData({ title: "", content: "", targetRoles: "both" });
      await Promise.all([
        utils.notices.list.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.portal.adminSummary.invalidate(),
      ]);
    },
  });

  const updateNoticeMutation = trpc.notices.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.notices.list.invalidate(),
        utils.portal.linkedStudents.invalidate(),
      ]);
    },
  });

  const deleteNoticeMutation = trpc.notices.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.notices.list.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.portal.adminSummary.invalidate(),
      ]);
    },
  });

  const notices = useMemo(() => {
    const items = data?.data ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((notice: any) => {
      return (
        notice.title.toLowerCase().includes(query) ||
        notice.content.toLowerCase().includes(query)
      );
    });
  }, [data?.data, searchQuery]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const total = data?.total ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
              학생 / 학부모 페이지와 실시간으로 연결되는 공지를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: theme.colors.accent.primary,
              color: "#fff",
            }}
          >
            공지 작성
          </button>
        </div>

        <SearchBar
          placeholder="공지 검색"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
        />

        <Card variant="elevated" padding="lg">
          {isLoading ? (
            <p style={{ color: theme.colors.text.tertiary }}>데이터를 불러오는 중입니다.</p>
          ) : notices.length === 0 ? (
            <EmptyState title="등록된 공지가 없습니다" />
          ) : (
            <div className="space-y-3">
              {notices.map((notice: any) => {
                const targetRoles = Array.isArray(notice.targetRoles)
                  ? notice.targetRoles
                  : [];
                return (
                  <div
                    key={notice.id}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="text-lg font-semibold"
                            style={{ color: theme.colors.text.primary }}
                          >
                            {notice.title}
                          </p>
                          <Badge variant={notice.isPublished ? "success" : "warning"} size="sm">
                            {notice.isPublished ? "게시됨" : "임시 저장"}
                          </Badge>
                        </div>
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {notice.content}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          대상: {targetRoles.join(", ") || "미지정"} · 생성일 {formatDate(notice.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateNoticeMutation.mutate({
                              id: notice.id,
                              isPublished: !notice.isPublished,
                            })
                          }
                          className="px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: theme.colors.background.primary,
                            color: theme.colors.text.primary,
                            border: `1px solid ${theme.colors.border.primary}`,
                          }}
                        >
                          {notice.isPublished ? "게시 해제" : "게시"}
                        </button>
                        <button
                          onClick={() => deleteNoticeMutation.mutate({ id: notice.id })}
                          className="px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: theme.colors.status.error,
                            color: "#fff",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {total > 20 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              이전
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * 20 >= total}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" padding="lg" className="w-full max-w-2xl">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              공지 작성
            </h2>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                createNoticeMutation.mutate({
                  title: formData.title,
                  content: formData.content,
                  targetRoles: TARGET_ROLE_OPTIONS[formData.targetRoles],
                  isPublished: true,
                });
              }}
              className="space-y-4"
            >
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="공지 제목"
                className="w-full px-3 py-3 rounded-lg"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              />
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="공지 내용"
                className="w-full min-h-40 px-3 py-3 rounded-lg"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              />
              <select
                value={formData.targetRoles}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetRoles: e.target.value as keyof typeof TARGET_ROLE_OPTIONS,
                  })
                }
                className="w-full px-3 py-3 rounded-lg"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              >
                <option value="both">학생 + 학부모</option>
                <option value="student">학생만</option>
                <option value="parent">학부모만</option>
                <option value="all">전체</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  className="px-4 py-3 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: theme.colors.accent.primary,
                    color: "#fff",
                  }}
                >
                  게시
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
