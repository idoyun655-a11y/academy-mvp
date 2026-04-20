import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge, Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS, formatDate } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const TARGET_ROLE_OPTIONS = {
  both: ["student", "parent"],
  student: ["student"],
  parent: ["parent"],
  all: ["student", "parent", "admin"],
};

export default function AdminNotices() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
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
    LIVE_QUERY_OPTIONS,
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="mb-1 text-4xl font-bold" style={{ color: theme.colors.text.primary }}>
              공지사항 관리
            </h1>
            <p className="text-base" style={{ color: theme.colors.text.tertiary }}>
              학생과 보호자 포털에 노출되는 공지를 관리합니다.
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.colors.text.tertiary }}>
              카카오 공유는 메시지 센터에서 공지와 별도로 실행할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setLocation("/admin/notifications")}
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              메시지 센터
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: theme.colors.accent.primary,
                color: "#fff",
              }}
            >
              공지 작성
            </button>
          </div>
        </div>

        <SearchBar
          placeholder="공지 검색"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
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
                const targetRoles = Array.isArray(notice.targetRoles) ? notice.targetRoles : [];
                return (
                  <div
                    key={notice.id}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
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
                          className="whitespace-pre-wrap text-sm"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {notice.content}
                        </p>
                        <p className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                          대상 {targetRoles.join(", ") || "미지정"} · 생성일 {formatDate(notice.createdAt)}
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
                          className="rounded-lg px-3 py-2 text-sm"
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
                          className="rounded-lg px-3 py-2 text-sm"
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

        {total > 20 ? (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg px-4 py-2 text-sm"
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
              className="rounded-lg px-4 py-2 text-sm"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              다음
            </button>
          </div>
        ) : null}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card variant="elevated" padding="lg" className="w-full max-w-2xl">
            <h2 className="mb-4 text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
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
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                placeholder="공지 제목"
                className="w-full rounded-lg px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              />

              <textarea
                value={formData.content}
                onChange={(event) => setFormData({ ...formData, content: event.target.value })}
                placeholder="공지 내용"
                className="min-h-40 w-full rounded-lg px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              />

              <select
                value={formData.targetRoles}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    targetRoles: event.target.value as keyof typeof TARGET_ROLE_OPTIONS,
                  })
                }
                className="w-full rounded-lg px-3 py-3"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                }}
              >
                <option value="both">학생 + 보호자</option>
                <option value="student">학생만</option>
                <option value="parent">보호자만</option>
                <option value="all">전체</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium"
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
                  className="rounded-lg px-4 py-3 text-sm font-medium"
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
      ) : null}
    </DashboardLayout>
  );
}
