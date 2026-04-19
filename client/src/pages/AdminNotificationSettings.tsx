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
import { BellRing, MessageSquareText, Send, Share2, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SiteTargetRole = "both" | "student" | "parent";
type SmsScope = "selected_students" | "saved_view" | "class" | "all_active";
type SavedView =
  | "all"
  | "unclassified"
  | "elementary"
  | "middle"
  | "high"
  | "unassigned_class"
  | "overdue"
  | "attendance_risk"
  | "follow_up"
  | "on_hold"
  | "leaving";
type SmsRecipientKind = "student" | "parent";

const SITE_ROLE_OPTIONS: Array<{
  value: SiteTargetRole;
  label: string;
  roles: Array<"student" | "parent">;
}> = [
  { value: "both", label: "학생 + 보호자", roles: ["student", "parent"] },
  { value: "student", label: "학생만", roles: ["student"] },
  { value: "parent", label: "보호자만", roles: ["parent"] },
];

const SMS_SCOPE_OPTIONS: Array<{ value: SmsScope; label: string }> = [
  { value: "selected_students", label: "선택 학생" },
  { value: "saved_view", label: "운영 뷰" },
  { value: "class", label: "반 기준" },
  { value: "all_active", label: "전체 재원생" },
];

const SAVED_VIEW_OPTIONS: Array<{ value: SavedView; label: string; summaryKey?: string }> = [
  { value: "all", label: "전체", summaryKey: "all" },
  { value: "unclassified", label: "미분류", summaryKey: "unclassified" },
  { value: "elementary", label: "초등", summaryKey: "elementary" },
  { value: "middle", label: "중등", summaryKey: "middle" },
  { value: "high", label: "고등", summaryKey: "high" },
  { value: "unassigned_class", label: "반 미배정", summaryKey: "unassignedClass" },
  { value: "overdue", label: "미납", summaryKey: "overdue" },
  { value: "attendance_risk", label: "출결 위험", summaryKey: "attendanceRisk" },
  { value: "follow_up", label: "상담 필요", summaryKey: "followUp" },
  { value: "on_hold", label: "휴원", summaryKey: "onHold" },
  { value: "leaving", label: "퇴원예정", summaryKey: "leaving" },
];

function readSelectedStudentIds() {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("studentIds");
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

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

function statusBadgeVariant(status?: string | null) {
  if (status === "sent") return "success";
  if (status === "failed") return "error";
  if (status === "pending") return "warning";
  return "default";
}

function providerLabel(provider?: string | null) {
  if (provider === "sms") return "SMS";
  if (provider === "kakao_talk") return "알림톡";
  if (provider === "email") return "이메일";
  return provider || "-";
}

export default function AdminNotificationSettings() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const selectedStudentIds = useMemo(() => readSelectedStudentIds(), []);

  const [siteForm, setSiteForm] = useState({
    title: "",
    content: "",
    targetRole: "both" as SiteTargetRole,
    classId: "",
  });
  const [smsForm, setSmsForm] = useState({
    scope: (selectedStudentIds.length > 0 ? "selected_students" : "saved_view") as SmsScope,
    savedView: "all" as SavedView,
    classId: "",
    recipientKinds: ["parent"] as SmsRecipientKind[],
    title: "",
    message: "",
  });
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [lastKakaoDraft, setLastKakaoDraft] = useState<KakaoNoticeShareDraft | null>(null);

  const { data: classesData } = trpc.classes.list.useQuery(
    { limit: 300, offset: 0 },
    LIVE_QUERY_OPTIONS,
  );
  const { data: studentSummary } = trpc.studentOps.summary.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const { data: smsStatus } = trpc.notifications.smsStatus.useQuery(undefined, LIVE_QUERY_OPTIONS);
  const { data: logsData, isLoading: isLogsLoading } = trpc.notifications.logs.useQuery(
    { limit: 30, offset: 0 },
    LIVE_QUERY_OPTIONS,
  );

  const smsPreviewInput = useMemo(
    () => ({
      scope: smsForm.scope,
      studentIds: selectedStudentIds,
      savedView: smsForm.scope === "saved_view" ? smsForm.savedView : undefined,
      classId: smsForm.scope === "class" && smsForm.classId ? Number(smsForm.classId) : undefined,
      recipientKinds: smsForm.recipientKinds,
    }),
    [selectedStudentIds, smsForm.classId, smsForm.recipientKinds, smsForm.savedView, smsForm.scope],
  );

  const { data: previewData, isFetching: isPreviewFetching } =
    trpc.notifications.previewAudience.useQuery(smsPreviewInput, {
      ...LIVE_QUERY_OPTIONS,
      enabled: smsForm.recipientKinds.length > 0,
    });

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

  const sendBulkSmsMutation = trpc.notifications.sendBulkSms.useMutation({
    onSuccess: async (result) => {
      toast.success(`문자 ${result.sentCount}건 발송, 실패 ${result.failedCount}건`);
      setSmsForm((current) => ({
        ...current,
        title: "",
        message: "",
      }));
      await utils.notifications.logs.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "문자 발송에 실패했습니다.");
    },
  });

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const classes = classesData?.data ?? [];
  const logs = logsData?.data ?? [];
  const selectedCount = selectedStudentIds.length;
  const providerReady = Boolean(smsStatus?.configured);
  const latestClassName = siteForm.classId
    ? classes.find((classItem: any) => String(classItem.id) === siteForm.classId)?.name ?? "선택 반"
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
              사이트 알림과 문자/SMS를 한 화면에서 관리합니다. 사이트 알림은 포털 공지와
              브라우저 알림으로 이어지고, 문자/SMS는 반 또는 운영 뷰 기준으로 일괄 전송합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={providerReady ? "success" : "warning"} size="sm">
              SMS {providerReady ? "연결됨" : "미설정"}
            </Badge>
            <Badge variant={kakaoConfigured ? "success" : "warning"} size="sm">
              Kakao{" "}
              {kakaoConfigured
                ? kakaoReady
                  ? "준비됨"
                  : isKakaoLoading
                    ? "로딩 중"
                    : "준비 중"
                : "미설정"}
            </Badge>
            {selectedCount > 0 ? (
              <Badge variant="info" size="sm">
                학생 관리에서 {selectedCount}명 연동됨
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                      사이트 알림
                    </h2>
                    <p className="text-sm" style={textMutedStyle()}>
                      학생/부모 포털 공지로 게시되고, 브라우저 알림을 켠 사용자는 즉시 알림을
                      받습니다.
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
                placeholder="알림 제목"
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
                placeholder="포털 공지와 브라우저 알림에 들어갈 메시지를 입력하세요."
                className="min-h-40 rounded-lg px-3 py-3 md:col-span-2"
                style={fieldStyle()}
              />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: theme.colors.background.secondary }}
            >
              <p className="text-sm font-semibold" style={sectionTitleStyle()}>
                카카오 공유
              </p>
              <p className="mt-2 text-sm" style={textMutedStyle()}>
                제목과 본문을 카카오 공유창으로 바로 보냅니다. 이 관리자 PC에서 카카오 창이
                뜨고, 받을 사람은 카카오 창에서 직접 선택하면 됩니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant={kakaoConfigured ? (kakaoReady ? "success" : "warning") : "error"}
                  size="sm"
                >
                  {kakaoConfigured
                    ? kakaoReady
                      ? "카카오 공유 준비 완료"
                      : isKakaoLoading
                        ? "카카오 SDK 불러오는 중"
                        : "카카오 SDK 준비 필요"
                    : "VITE_KAKAO_JAVASCRIPT_KEY 필요"}
                </Badge>
              </div>
              <p className="mt-3 text-sm" style={textMutedStyle()}>
                공유되는 텍스트: 제목 + 본문
                {latestClassName ? ` / 반: ${latestClassName}` : ""}
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
                      "카카오 공유창을 열었습니다. 카카오 창에서 받을 사람을 선택해 주세요.",
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
                    toast.error("제목과 내용을 먼저 입력하세요.");
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
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${theme.colors.status.warning}22` }}
                  >
                    <Smartphone
                      className="h-5 w-5"
                      style={{ color: theme.colors.status.warning }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold" style={sectionTitleStyle()}>
                      문자 / SMS
                    </h2>
                    <p className="text-sm" style={textMutedStyle()}>
                      선택 학생, 저장된 운영 뷰, 반 기준으로 학생/보호자에게 한 번에 발송합니다.
                    </p>
                  </div>
                </div>
              </div>

              <Badge variant={providerReady ? "success" : "warning"} size="sm">
                {smsStatus?.label || "미설정"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={smsForm.scope}
                onChange={(event) =>
                  setSmsForm((current) => ({
                    ...current,
                    scope: event.target.value as SmsScope,
                  }))
                }
                className="rounded-lg px-3 py-3"
                style={fieldStyle()}
              >
                {SMS_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {smsForm.scope === "saved_view" ? (
                <select
                  value={smsForm.savedView}
                  onChange={(event) =>
                    setSmsForm((current) => ({
                      ...current,
                      savedView: event.target.value as SavedView,
                    }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  {SAVED_VIEW_OPTIONS.map((option) => {
                    const summaryMap = (studentSummary?.savedViews ?? {}) as Record<string, number>;
                    const count = option.summaryKey ? summaryMap[option.summaryKey] : undefined;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label}
                        {typeof count === "number" ? ` (${count}명)` : ""}
                      </option>
                    );
                  })}
                </select>
              ) : smsForm.scope === "class" ? (
                <select
                  value={smsForm.classId}
                  onChange={(event) =>
                    setSmsForm((current) => ({ ...current, classId: event.target.value }))
                  }
                  className="rounded-lg px-3 py-3"
                  style={fieldStyle()}
                >
                  <option value="">반 선택</option>
                  {classes.map((classItem: any) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="flex items-center rounded-lg px-3 py-3 text-sm"
                  style={fieldStyle()}
                >
                  {smsForm.scope === "selected_students"
                    ? `학생 관리에서 선택된 학생 ${selectedCount}명`
                    : "전체 재원생 대상"}
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-semibold" style={sectionTitleStyle()}>
                  수신 대상
                </p>
                <div className="flex flex-wrap gap-3">
                  {(["student", "parent"] as SmsRecipientKind[]).map((kind) => {
                    const checked = smsForm.recipientKinds.includes(kind);
                    return (
                      <label
                        key={kind}
                        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm"
                        style={fieldStyle()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setSmsForm((current) => ({
                              ...current,
                              recipientKinds: event.target.checked
                                ? [...current.recipientKinds, kind]
                                : current.recipientKinds.filter((item) => item !== kind),
                            }))
                          }
                        />
                        <span>{kind === "student" ? "학생 휴대폰" : "보호자 휴대폰"}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <input
                value={smsForm.title}
                onChange={(event) =>
                  setSmsForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="메시지 제목(로그용, 선택)"
                className="rounded-lg px-3 py-3 md:col-span-2"
                style={fieldStyle()}
              />

              <textarea
                value={smsForm.message}
                onChange={(event) =>
                  setSmsForm((current) => ({ ...current, message: event.target.value }))
                }
                placeholder="문자 내용을 입력하세요."
                className="min-h-40 rounded-lg px-3 py-3 md:col-span-2"
                style={fieldStyle()}
              />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: theme.colors.background.secondary }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={sectionTitleStyle()}>
                    전송 미리보기
                  </p>
                  <p className="mt-1 text-sm" style={textMutedStyle()}>
                    학생 {previewData?.totalStudents ?? 0}명, 수신처 {previewData?.totalRecipients ?? 0}
                    건
                  </p>
                </div>
                {isPreviewFetching ? (
                  <Badge variant="info" size="sm">
                    계산 중
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    학생 {previewData?.studentPhoneCount ?? 0} / 보호자{" "}
                    {previewData?.parentPhoneCount ?? 0}
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(previewData?.sampleRecipients ?? []).map((recipient) => (
                  <Badge key={`${recipient.kind}:${recipient.phone}`} variant="info" size="sm">
                    {recipient.kind === "student" ? "학생" : "보호자"}{" "}
                    {recipient.userName || recipient.studentName}
                  </Badge>
                ))}
                {!previewData?.sampleRecipients?.length ? (
                  <span className="text-sm" style={textMutedStyle()}>
                    현재 조건으로 잡힌 수신처가 없습니다.
                  </span>
                ) : null}
              </div>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: theme.colors.background.secondary }}
            >
              <p className="text-sm font-semibold" style={sectionTitleStyle()}>
                SMS 연결 상태
              </p>
              <p className="mt-2 text-sm" style={textMutedStyle()}>
                {providerReady
                  ? `현재 ${smsStatus?.label}로 실발송 가능합니다.`
                  : "현재는 SMS 공급사 설정이 없어 실발송이 비활성화되어 있습니다. Railway 변수에 SMS_WEBHOOK_URL 또는 Twilio 값을 넣으면 바로 연결됩니다."}
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                {selectedCount > 0 ? (
                  <Button
                    variant="secondary"
                    leftIcon={<MessageSquareText className="h-4 w-4" />}
                    onClick={() => setLocation("/admin/students")}
                  >
                    학생 관리로 돌아가기
                  </Button>
                ) : null}
              </div>

              <Button
                variant="primary"
                leftIcon={<Send className="h-4 w-4" />}
                isLoading={sendBulkSmsMutation.isPending}
                disabled={
                  !providerReady ||
                  smsForm.recipientKinds.length === 0 ||
                  !smsForm.message.trim() ||
                  (smsForm.scope === "selected_students" && selectedCount === 0) ||
                  (smsForm.scope === "class" && !smsForm.classId) ||
                  (previewData?.totalRecipients ?? 0) === 0
                }
                onClick={() => {
                  if (!smsForm.message.trim()) {
                    toast.error("문자 내용을 입력하세요.");
                    return;
                  }

                  if (smsForm.recipientKinds.length === 0) {
                    toast.error("수신 대상을 한 개 이상 선택하세요.");
                    return;
                  }

                  sendBulkSmsMutation.mutate({
                    scope: smsForm.scope,
                    studentIds: selectedStudentIds,
                    savedView:
                      smsForm.scope === "saved_view" ? smsForm.savedView : undefined,
                    classId:
                      smsForm.scope === "class" && smsForm.classId
                        ? Number(smsForm.classId)
                        : undefined,
                    recipientKinds: smsForm.recipientKinds,
                    title: smsForm.title.trim() || undefined,
                    message: smsForm.message.trim(),
                  });
                }}
              >
                문자 발송
              </Button>
            </div>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold" style={sectionTitleStyle()}>
                최근 발송 로그
              </h2>
              <p className="text-sm" style={textMutedStyle()}>
                문자/SMS 발송 결과를 최근 순서대로 확인합니다.
              </p>
            </div>
            <Badge variant="default" size="sm">
              최근 {logs.length}건
            </Badge>
          </div>

          {isLogsLoading ? (
            <p style={textMutedStyle()}>로그를 불러오는 중입니다.</p>
          ) : logs.length === 0 ? (
            <EmptyState title="아직 발송 로그가 없습니다" />
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: theme.colors.background.secondary }}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={sectionTitleStyle()}>
                          {log.recipientName || log.recipientPhone}
                        </p>
                        <Badge variant={statusBadgeVariant(log.status)} size="sm">
                          {log.status}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {providerLabel(log.provider)}
                        </Badge>
                      </div>
                      <p className="text-sm" style={textMutedStyle()}>
                        {log.recipientPhone}
                      </p>
                      <p className="text-sm whitespace-pre-wrap" style={sectionTitleStyle()}>
                        {log.content}
                      </p>
                      {log.errorMessage ? (
                        <p className="text-sm" style={{ color: theme.colors.status.error }}>
                          실패 사유: {log.errorMessage}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-sm text-right" style={textMutedStyle()}>
                      <p>{formatDateTime(log.sentAt || log.createdAt)}</p>
                      {log.externalId ? <p className="mt-1">ID: {log.externalId}</p> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
