import { useAuth } from "@/_core/hooks/useAuth";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import { formatDateTime } from "@/lib/portal";
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

export default function PortalNotificationBell() {
  const { user } = useAuth();
  const { snapshots } = useLinkedPortalData();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [readNoticeIds, setReadNoticeIds] = useState<number[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);
  const announcedIdsRef = useRef<Set<number>>(new Set());

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
  const alertStorageKey = user ? `portal-browser-alerts:${user.id}` : "";
  const unreadCount = useMemo(
    () => notices.filter((notice) => !readNoticeIds.includes(notice.id)).length,
    [notices, readNoticeIds],
  );

  useEffect(() => {
    if (!user) return;
    setReadNoticeIds(readStoredNumberArray(readStorageKey));
    setAlertsEnabled(readStoredBoolean(alertStorageKey, false));
  }, [alertStorageKey, readStorageKey, user]);

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
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission !== "granted") return;

    const freshNotices = notices.filter((notice) => !announcedIdsRef.current.has(notice.id));

    freshNotices.forEach((notice) => {
      announcedIdsRef.current.add(notice.id);
      const notification = new window.Notification(notice.title, {
        body: notice.content,
        tag: `portal-notice-${notice.id}`,
      });
      notification.onclick = () => {
        window.focus();
        setLocation(user?.role === "student" ? "/student/notices" : "/parent");
        notification.close();
      };
      toast.info(notice.title, {
        description: notice.content,
      });
    });
  }, [alertsEnabled, notices, setLocation, user?.role]);

  const markAllRead = () => {
    setReadNoticeIds((current) => Array.from(new Set([...current, ...notices.map((notice) => notice.id)])));
  };

  const handleToggleAlerts = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("이 브라우저는 알림 기능을 지원하지 않습니다.");
      return;
    }

    if (alertsEnabled) {
      setAlertsEnabled(false);
      return;
    }

    if (window.Notification.permission === "granted") {
      setAlertsEnabled(true);
      toast.success("브라우저 알림을 켰습니다.");
      return;
    }

    const permission = await window.Notification.requestPermission();
    if (permission === "granted") {
      setAlertsEnabled(true);
      toast.success("브라우저 알림을 켰습니다.");
      return;
    }

    toast.error("브라우저 알림 권한이 허용되지 않았습니다.");
  };

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
                새 공지 {unreadCount}건
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
            <div>
              <p className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                브라우저 알림
              </p>
              <p className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                사이트가 열려 있을 때 새 공지를 즉시 표시합니다.
              </p>
            </div>
            <button
              onClick={handleToggleAlerts}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: alertsEnabled
                  ? theme.colors.accent.primary
                  : theme.colors.background.primary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.primary}`,
              }}
            >
              {alertsEnabled ? "켜짐" : "켜기"}
            </button>
          </div>

          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto">
            {notices.length === 0 ? (
              <div
                className="rounded-2xl px-4 py-10 text-center text-sm"
                style={{ backgroundColor: theme.colors.background.secondary, color: theme.colors.text.tertiary }}
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
