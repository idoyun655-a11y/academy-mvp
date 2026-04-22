import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import { STUDENT_NAV_ITEMS, formatDate } from "@/lib/portal";
import { uiThemeVars } from "@/styles/runtime-theme";
import { useMemo, useState } from "react";

export default function StudentNotices() {
  const { isAuthenticated } = useAuth();
  const { snapshots, isLoading } = useLinkedPortalData();
  const [searchQuery, setSearchQuery] = useState("");
  const snapshot = snapshots[0];

  const notices = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.notices.filter((notice: any) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return notice.title.toLowerCase().includes(query) || notice.content.toLowerCase().includes(query);
    });
  }, [searchQuery, snapshot]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout title="공지사항" subtitle="학원 공지" navItems={STUDENT_NAV_ITEMS} variant="portal-light">
        <Card variant="elevated" padding="lg">
          <EmptyState title="공지 데이터를 불러올 수 없습니다" />
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="공지사항" subtitle="학원 공지를 빠르게 확인하세요." navItems={STUDENT_NAV_ITEMS} variant="portal-light">
      <div className="space-y-6">
        <SearchBar
          placeholder="공지 제목 또는 내용 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="space-y-3">
          {notices.map((notice: any) => (
            <Card key={notice.id} variant="elevated" padding="lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                    {notice.title}
                  </h2>
                  <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: uiThemeVars.textTertiary }}>
                    {notice.content}
                  </p>
                </div>
                <p className="text-xs" style={{ color: uiThemeVars.textTertiary }}>
                  {formatDate(notice.createdAt)}
                </p>
              </div>
            </Card>
          ))}

          {notices.length === 0 ? (
            <Card variant="elevated" padding="lg">
              <EmptyState
                title="검색 결과가 없습니다"
                description="다른 검색어로 다시 확인해 주세요."
              />
            </Card>
          ) : null}
        </div>
      </div>
    </PortalLayout>
  );
}
