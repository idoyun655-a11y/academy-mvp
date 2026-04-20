import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/common/Button";
import { Badge, Card, EmptyState } from "@/components/common/CommonComponents";
import {
  isKakaoShareConfigured,
  isKakaoShareReady,
  openKakaoNoticeShare,
  preloadKakaoShareSdk,
  type KakaoNoticeShareDraft,
} from "@/lib/kakaoShare";
import { LIVE_QUERY_OPTIONS, formatDateTime } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { BellRing, ExternalLink, Send, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SiteTargetRole = "both" | "student" | "parent";

const SITE_ROLE_OPTIONS: Array<{
  value: SiteTargetRole;
  label: string;
  roles: Array<"student" | "parent">;
}> = [
  { value: "both", label: "학생 + 보호자", roles: ["student", "parent"] },
  { value: "student", label: "학생만", roles: ["student"] },
  { value: "parent", label: "보호자만", roles: ["parent"] },
];

function fieldStyle() {
  return {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.primary}`,
  } as const;
}

function sectionTitleStyle() {
  return {
    color: theme.colors.text.primary,
  } as const;
}

function textMutedStyle() {
  return {
    color: theme.colors.text.tertiary,
  } as const;
}

export default function AdminNotificationSettings() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const [siteForm, setSiteForm] = useState({
    title: "",
    content: "",
    targetRole: "both" as SiteTargetRole,
    classId: "",
  });
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [lastKakaoDraft, setLastKakaoDraft] = useState<KakaoNoticeShareDraft | null>(null);

  const { data: classesData } = trpc.classes.list.useQuery(
    { limit: 300, offset: 0 },
    LIVE_QUERY_OPTIONS,
  );
  const { data: noticesData, isLoading: isNoticesLoading } = trpc.notices.list.useQuery(
    { limit: 8, offset: 0 },
    LIVE_QUERY_OPTIONS,
  );

  const kakaoConfigured = isKakaoShareConfigured();

  useEffect(() => {
    if (!kakaoConfigured) {
      setKakaoReady(false);
      return;
    }

    let isCancelled = false;
    setIsKakaoLoading(true);

    void preloadKakaoShareSdk()
      .then(() => {
        if (isCancelled) return;
        setKakaoReady(isKakaoShareReady());
      })
      .catch(() => {
        if (isCancelled) return;
        setKakaoReady(false);
      })
      .finally(() => {
        if (isCancelled) return;
        setIsKakaoLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [kakaoConfigured]);

  const createNoticeMutation = trpc.notices.create.useMutation({
    onSuccess: async () => {
      toast.success("사이트 알림을 게시했습니다.");
      setSiteForm({
        title: "",
        content: "",
        targetRole: "both",
        classId: "",
      });
      await Promise.all([
        utils.notices.list.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.portal.adminSummary.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "사이트 알림 게시에 실패했습니다.");
    },
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const classes = classesData?.data ?? [];
  const recentNotices = useMemo(() => noticesData?.data ?? [], [noticesData?.data]);
  const latestClassName = siteForm.classId
    ? classes.find((classItem: any) => String(classItem.id) === siteForm.classId)?.name ?? "선택한 반"
    : null;

  const buildNoticeDraft = (): KakaoNoticeShareDraft => ({
    title: siteForm.title.trim(),
    content: siteForm.content.trim(),
  });

  const openKakaoShareWindow = (draft: KakaoNoticeShareDraft) => {
    if (!kakaoConfigured) {
      toast.error("카카오 JavaScript 키가 없어 공유창을 열 수 없습니다.");
      return false;
    }

    setLastKakaoDraft(draft);

    try {
      openKakaoNoticeShare(draft);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "카카오 공유창을 자동으로 열지 못했습니다.";
      toast.warning(`${message} 아래의 '카카오 공유 다시 열기' 버튼으로 다시 시도해 주세요.`);
      return false;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold" style={sectionTitleStyle()}>
              메시지 센터
            </h1>
            <p className="text-base" style={textMutedStyle()}>
              문자 발송은 제거했고, 공지 게시와 카카오 공유를 각각 따로 실행하도록 정리했습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="info" size="sm">
              공지와 카카오 공유 분리
            </Badge>
            <Badge variant={kakaoConfigured ? (kakaoReady ? "success" : "warning") : "error"} size="sm">
              {kakaoConfigured
                ? kakaoReady
                  ? "카카오 공유 준비됨"
                  : isKakaoLoading
                    ? "카카오 SDK 로딩 중"
                    : "카카오 SDK 확인 필요"
                : "카카오 키 미설정"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <Card variant="elevated" padding="lg" className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${theme.colors.status.info}22` }}
                  >
                    <BellRing className="h-5 w-5" style={{ color: theme.colors.status.info }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold" style={sectionTitleStyle()}>
                      공지 작성
                    </h2>
                    <p className="text-sm" style={textMutedStyle()}>
                      같은 내용으로 사이트 공지를 올리거나, 카카오 공유창을 별도로 열 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={siteForm.title}
                onChange={(event) =>
                  setSiteForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="공지 제목"
                className="rounded-lg px-3 py-3 md:col-span-2"
                style={fieldStyle()}
              />

              <select
                value={siteForm.targetRole}
                onChange={(event) =>
                  setSiteForm((current) => ({
                    ...current,
                    targetRole: event.target.value as SiteTargetRole,
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                {SITE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={siteForm.classId}
                onChange={(event) =>
                  setSiteForm((current) => ({ ...current, classId: event.target.value }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                <option value="">전체 반</option>
                {classes.map((classItem: any) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>

              <textarea
                value={siteForm.content}
                onChange={(event) =>
                  setSiteForm((current) => ({ ...current, content: event.target.value }))
                }
                placeholder="공지 본문을 입력하세요."
                className="min-h-40 rounded-lg px-3 py-3 md:col-span-2"
                style={fieldStyle()}
              />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: theme.colors.background.secondary }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="sm">
                  사이트 공지
                </Badge>
                <Badge variant="warning" size="sm">
                  카카오 공유
                </Badge>
              </div>
              <p className="mt-3 text-sm" style={textMutedStyle()}>
                사이트 공지는 포털 안에 저장됩니다. 카카오 공유는 관리자 PC에서 공유창만 띄우고,
                받을 사람은 카카오 창에서 직접 선택합니다.
              </p>
              <p className="mt-3 text-sm" style={textMutedStyle()}>
                현재 공유될 내용: 제목 + 본문{latestClassName ? ` / 반: ${latestClassName}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {lastKakaoDraft ? (
                <Button
                  variant="secondary"
                  leftIcon={<Share2 className="h-4 w-4" />}
                  onClick={() => {
                    openKakaoShareWindow(lastKakaoDraft);
                  }}
                >
                  카카오 공유 다시 열기
                </Button>
              ) : null}

              <Button
                variant="secondary"
                leftIcon={<Share2 className="h-4 w-4" />}
                onClick={() => {
                  const noticeDraft = buildNoticeDraft();

                  if (!noticeDraft.title || !noticeDraft.content) {
                    toast.error("카카오로 보내려면 제목과 내용을 먼저 입력해 주세요.");
                    return;
                  }

                  const wasOpened = openKakaoShareWindow(noticeDraft);
                  if (wasOpened) {
                    toast.success(
                      "카카오 공유창을 열었습니다. 카카오 창에서 보낼 대상만 선택하면 됩니다.",
                    );
                  }
                }}
              >
                카카오 공유창 열기
              </Button>

              <Button
                variant="primary"
                leftIcon={<Send className="h-4 w-4" />}
                isLoading={createNoticeMutation.isPending}
                onClick={() => {
                  if (!siteForm.title.trim() || !siteForm.content.trim()) {
                    toast.error("제목과 내용을 먼저 입력해 주세요.");
                    return;
                  }

                  const roleConfig =
                    SITE_ROLE_OPTIONS.find((option) => option.value === siteForm.targetRole) ??
                    SITE_ROLE_OPTIONS[0];

                  createNoticeMutation.mutate({
                    title: siteForm.title.trim(),
                    content: siteForm.content.trim(),
                    targetRoles: roleConfig.roles,
                    targetClassIds: siteForm.classId ? [Number(siteForm.classId)] : undefined,
                    isPublished: true,
                  });
                }}
              >
                사이트 알림 게시
              </Button>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold" style={sectionTitleStyle()}>
                  최근 공지
                </h2>
                <p className="text-sm" style={textMutedStyle()}>
                  게시된 공지를 확인하고 공지사항 관리 화면으로 바로 이동할 수 있습니다.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink className="h-4 w-4" />}
                onClick={() => setLocation("/admin/notices")}
              >
                공지사항 관리
              </Button>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: theme.colors.background.secondary }}
            >
              <p className="text-sm font-semibold" style={sectionTitleStyle()}>
                사용 방법
              </p>
              <div className="mt-3 space-y-2 text-sm" style={textMutedStyle()}>
                <p>1. 제목과 본문을 입력합니다.</p>
                <p>2. 사이트에 올릴 때는 `사이트 알림 게시`를 누릅니다.</p>
                <p>3. 카카오로 보낼 때는 `카카오 공유창 열기`를 따로 누릅니다.</p>
                <p>4. 둘 다 보낼 경우 버튼을 각각 한 번씩 누르면 됩니다.</p>
              </div>
            </div>

            {isNoticesLoading ? (
              <p style={textMutedStyle()}>최근 공지를 불러오는 중입니다.</p>
            ) : recentNotices.length === 0 ? (
              <EmptyState title="아직 등록된 공지가 없습니다" />
            ) : (
              <div className="space-y-3">
                {recentNotices.map((notice: any) => (
                  <div
                    key={notice.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: theme.colors.background.secondary }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold" style={sectionTitleStyle()}>
                            {notice.title}
                          </p>
                          <Badge variant={notice.isPublished ? "success" : "warning"} size="sm">
                            {notice.isPublished ? "게시됨" : "임시 저장"}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap" style={textMutedStyle()}>
                          {notice.content}
                        </p>
                      </div>
                      <p className="text-sm whitespace-nowrap" style={textMutedStyle()}>
                        {formatDateTime(notice.updatedAt || notice.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
