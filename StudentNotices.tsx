import { useAuth } from "@/_core/hooks/useAuth";
import { Card, SearchBar, Badge } from "@/components/common/CommonComponents";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { theme } from "@/styles/design-system";

export default function StudentNotices() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: noticesData, isLoading } = trpc.notices.list.useQuery({
    limit: 50,
    offset: 0,
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const notices = noticesData?.data || [];
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
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
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
            📢 공지사항
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: theme.colors.text.tertiary }}
          >
            학원 소식 및 안내
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 검색 바 */}
        <SearchBar
          placeholder="공지사항 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 공지 내용 */}
                  <div className="flex-1 min-w-0">
                    {/* 제목 및 배지 */}
                    <div className="flex items-start gap-2 mb-2">
                      <p
                        className="font-semibold text-lg flex-1 truncate"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {notice.title}
                      </p>
                      <Badge color="blue">공지</Badge>
                    </div>

                    {/* 내용 미리보기 */}
                    <p
                      className="text-sm line-clamp-2 mb-3"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      {notice.content}
                    </p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="text-xs"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        📅 {getTimeAgo(notice.createdAt)}
                      </span>
                      {notice.attachmentUrls &&
                        JSON.parse(notice.attachmentUrls || "[]").length > 0 && (
                          <span
                            className="text-xs"
                            style={{ color: theme.colors.accent.primary }}
                          >
                            📎 첨부파일
                          </span>
                        )}
                    </div>
                  </div>

                  {/* 조회수 */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.text.tertiary }}
                    >
                      조회
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: theme.colors.accent.primary }}
                    >
                      0
                    </p>
                  </div>
                </div>
              </Card>
            ))}
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
                새로운 공지사항이 있으면 여기에 표시됩니다
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
