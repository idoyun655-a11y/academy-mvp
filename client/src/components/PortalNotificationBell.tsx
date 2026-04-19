import { useAuth } from "@/_core/hooks/useAuth";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import { formatDateTime } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import {
  ensurePushSubscription,
  getExistingPushSubscription,
  isIosLikeDevice,
  isStandaloneDisplayMode,
  isWebPushSupported,
  removePushSubscription,
} from "@/lib/webPush";
import { theme } from "@/styles/design-system";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PortalNotice = {
  id: number;
  title: string;
  content: string;
  createdAt?: string | Date | null;
};

function readStoredNumberArray(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    return [];
  }
}

function writeStoredNumberArray(key: string, values: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(values))));
}

function readStoredBoolean(key: string, fallback = false) {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

function detectDeviceLabel() {
  if (typeof window === "undefined") return "portal";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("iphone")) return "iphone";
  if (userAgent.includes("ipad")) return "ipad";
  if (userAgent.includes("android")) return "android";
  return "desktop";
}

export default function PortalNotificationBell() {
  const { user } = useAuth();
  const { snapshots } = useLinkedPortalData();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [readNoticeIds, setReadNoticeIds] = useState<number[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);
  const announcedIdsRef = useRef<Set<number>>(new Set());

  const webPushStatus = trpc.webPush.status.useQuery(undefined, {
    enabled: user?.role === "student" || user?.role === "parent",
  });
  const subscribeMutation = trpc.webPush.subscribe.useMutation();
  const unsubscribeMutation = trpc.webPush.unsubscribe.useMutation();

  const notices = useMemo<PortalNotice[]>(() => {
    const deduped = new Map<number, PortalNotice>();

    snapshots.forEach((snapshot: any) => {
      (snapshot?.notices ?? []).forEach((notice: any) => {
        const noticeId = Number(notice.id ?? 0);
        if (!noticeId || deduped.has(noticeId)) return;
        deduped.set(noticeId, {
          id: noticeId,
          title: String(notice.title ?? ""),
          content: String(notice.content ?? ""),
          createdAt: notice.createdAt ?? null,
        });
      });
    });

    return Array.from(deduped.values()).sort(
      (left, right) =>
        new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime(),
    );
  }, [snapshots]);

  const readStorageKey = user ? `portal-notice-read:${user.id}` : "";
  const alertStorageKey = user ? `portal-push-alerts:${user.id}` : "";
  const unreadCount = useMemo(
    () => notices.filter((notice) => !readNoticeIds.includes(notice.id)).length,
    [notices, readNoticeIds],
  );

  const iosLike = isIosLikeDevice();
  const standalone = isStandaloneDisplayMode();
  const webPushSupported = isWebPushSupported();
  const canUsePushInCurrentMode = webPushSupported && (!iosLike || standalone);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const syncStoredState = async () => {
      setReadNoticeIds(readStoredNumberArray(readStorageKey));
      const savedEnabled = readStoredBoolean(alertStorageKey, false);

      if (!webPushSupported) {
        if (!cancelled) setAlertsEnabled(savedEnabled);
        return;
      }

      try {
        const existingSubscription = await getExistingPushSubscription();
        if (cancelled) return;
        setAlertsEnabled(Boolean(existingSubscription) || savedEnabled);
      } catch {
        if (!cancelled) setAlertsEnabled(savedEnabled);
      }
    };

    void syncStoredState();
    return () => {
      cancelled = true;
    };
  }, [alertStorageKey, readStorageKey, user, webPushSupported]);

  useEffect(() => {
    hasInitializedRef.current = false;
    announcedIdsRef.current = new Set();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    writeStoredNumberArray(readStorageKey, readNoticeIds);
  }, [readNoticeIds, readStorageKey, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    localStorage.setItem(alertStorageKey, String(alertsEnabled));
  }, [alertStorageKey, alertsEnabled, user]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      announcedIdsRef.current = new Set(notices.map((notice) => notice.id));
      hasInitializedRef.current = true;
      return;
    }

    if (!alertsEnabled) return;

    const freshNotices = notices.filter((notice) => !announcedIdsRef.current.has(notice.id));

    freshNotices.forEach((notice) => {
      announcedIdsRef.current.add(notice.id);
      toast.info(notice.title, {
        description: notice.content,
      });
    });
  }, [alertsEnabled, notices]);

  const markAllRead = () => {
    setReadNoticeIds((current) =>
      Array.from(new Set([...current, ...notices.map((notice) => notice.id)])),
    );
  };

  const handleToggleAlerts = async () => {
    if (!user) return;

    if (alertsEnabled) {
      setIsToggling(true);
      try {
        const endpoint = await removePushSubscription();
        if (endpoint) {
          await unsubscribeMutation.mutateAsync({ endpoint });
        }
        setAlertsEnabled(false);
        toast.success("알림을 껐습니다.");
      } catch (error: any) {
        toast.error(error?.message || "알림 해제 중 오류가 발생했습니다.");
      } finally {
        setIsToggling(false);
      }
      return;
    }

    if (iosLike && !standalone) {
      toast.info("아이폰/아이패드는 Safari에서 '홈 화면에 추가' 후 다시 열어야 알림 권한을 켤 수 있습니다.");
      return;
    }

    if (!webPushSupported) {
      toast.error("이 기기 또는 브라우저는 웹 푸시 알림을 지원하지 않습니다.");
      return;
    }

    if (!webPushStatus.data?.configured || !webPushStatus.data?.publicKey) {
      toast.error("서버 푸시 설정이 아직 완료되지 않았습니다.");
      return;
    }

    if (typeof window !== "undefined" && window.Notification.permission === "denied") {
      toast.error("브라우저 설정에서 알림 차단을 해제한 뒤 다시 시도해 주세요.");
      return;
    }

    setIsToggling(true);
    try {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission !== "granted"
      ) {
        const permission = await window.Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("알림 권한이 허용되지 않았습니다.");
          return;
        }
      }

      const subscription = await ensurePushSubscription(webPushStatus.data.publicKey);
      await subscribeMutation.mutateAsync({
        subscription: subscription.toJSON() as {
          endpoint: string;
          expirationTime?: number | null;
          keys: { p256dh: string; auth: string };
        },
        deviceLabel: detectDeviceLabel(),
        userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent,
      });

      setAlertsEnabled(true);
      toast.success("알림을 켰습니다.");
    } catch (error: any) {
      toast.error(error?.message || "알림 설정 중 오류가 발생했습니다.");
    } finally {
      setIsToggling(false);
    }
  };

  const statusText = (() => {
    if (iosLike && !standalone) {
      return "아이폰/아이패드는 홈 화면에 추가 후 켤 수 있습니다.";
    }
    if (!webPushSupported) {
      return "이 브라우저는 푸시 알림을 지원하지 않습니다.";
    }
    if (!canUsePushInCurrentMode) {
      return "현재 모드에서는 푸시 알림을 사용할 수 없습니다.";
    }
    if (!webPushStatus.data?.configured) {
      return "서버 푸시 설정이 아직 없습니다.";
    }
    return "공지 등록 시 기기 알림으로 바로 받습니다.";
  })();

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) {
            markAllRead();
          }
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors"
        style={{
          backgroundColor: theme.colors.background.tertiary,
          borderColor: theme.colors.border.primary,
          color: theme.colors.text.primary,
        }}
        aria-label="알림 열기"
      >
        {alertsEnabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 min-w-5 rounded-full px-1 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: theme.colors.status.error,
              color: "#fff",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-14 z-40 w-[360px] rounded-3xl border p-4 shadow-2xl"
          style={{
            backgroundColor: "rgba(10, 10, 10, 0.97)",
            borderColor: theme.colors.border.primary,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                알림
              </p>
              <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                읽지 않은 공지 {unreadCount}건
              </p>
            </div>
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.primary,
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              모두 읽음
            </button>
          </div>

          <div
            className="mt-4 flex items-center justify-between rounded-2xl px-3 py-3"
            style={{ backgroundColor: theme.colors.background.secondary }}
          >
            <div className="pr-3">
              <p className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                기기 알림
              </p>
              <p className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                {statusText}
              </p>
            </div>
            <button
              onClick={() => void handleToggleAlerts()}
              disabled={
                isToggling ||
                subscribeMutation.isPending ||
                unsubscribeMutation.isPending ||
                (!alertsEnabled && (!canUsePushInCurrentMode || !webPushStatus.data?.configured))
              }
              className="rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              style={{
                backgroundColor: alertsEnabled
                  ? theme.colors.accent.primary
                  : theme.colors.background.primary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              {isToggling ? "처리 중" : alertsEnabled ? "켜짐" : "켜기"}
            </button>
          </div>

          {iosLike && !standalone ? (
            <div
              className="mt-3 rounded-2xl px-3 py-3 text-xs"
              style={{
                backgroundColor: theme.colors.background.secondary,
                color: theme.colors.text.tertiary,
              }}
            >
              Safari에서 공유 버튼을 누른 뒤 "홈 화면에 추가"로 설치하고, 홈 화면에서 다시 열어야
              알림 권한이 나타납니다.
            </div>
          ) : null}

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
            {notices.length === 0 ? (
              <div
                className="rounded-2xl px-4 py-10 text-center text-sm"
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.tertiary,
                }}
              >
                아직 도착한 공지가 없습니다.
              </div>
            ) : (
              notices.map((notice) => {
                const isUnread = !readNoticeIds.includes(notice.id);
                return (
                  <button
                    key={notice.id}
                    onClick={() => {
                      setReadNoticeIds((current) => Array.from(new Set([...current, notice.id])));
                      setOpen(false);
                      setLocation(user?.role === "student" ? "/student/notices" : "/parent");
                    }}
                    className="w-full rounded-2xl border px-4 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: isUnread
                        ? theme.colors.accent.primary
                        : theme.colors.border.primary,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-semibold"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {notice.title}
                        </p>
                        <p
                          className="mt-1 line-clamp-2 text-sm"
                          style={{ color: theme.colors.text.tertiary }}
                        >
                          {notice.content}
                        </p>
                      </div>
                      {isUnread ? (
                        <span
                          className="mt-1 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.colors.accent.primary }}
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs" style={{ color: theme.colors.text.tertiary }}>
                      {formatDateTime(notice.createdAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
