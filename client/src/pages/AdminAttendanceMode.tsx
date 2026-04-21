import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Button from "@/components/common/Button";
import { Badge } from "@/components/common/CommonComponents";
import AdminAttendanceKioskContent from "@/components/AdminAttendanceKioskContent";
import { theme } from "@/styles/design-system";

function formatClock(value: Date) {
  return value.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateHeader(value: Date) {
  return value.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function AdminAttendanceMode() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [now, setNow] = useState(() => new Date());
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false,
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser fullscreen can be blocked by policy. In that case use F11.
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: theme.colors.background.primary,
          color: theme.colors.text.primary,
        }}
      >
        인증 상태를 확인하는 중입니다.
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen px-3 py-3 md:px-4 md:py-4"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(0,132,255,0.2), transparent 28%), radial-gradient(circle at top right, rgba(48,176,192,0.16), transparent 24%), #02060d",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1800px] flex-col gap-4">
        <header
          className="rounded-[28px] border px-4 py-4 md:px-5 md:py-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            borderColor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="sm">
                  상시 출석체크 모드
                </Badge>
                <Badge variant="default" size="sm">
                  4자리 자동 입력
                </Badge>
              </div>

              <div>
                <h1
                  className="text-2xl font-bold tracking-tight md:text-3xl"
                  style={{ color: theme.colors.text.primary }}
                >
                  등하원 출석체크 모드
                </h1>
                <p
                  className="mt-1.5 text-sm md:text-base"
                  style={{ color: theme.colors.text.secondary }}
                >
                  별도 모니터나 키오스크 화면에 띄워 두고 학생 출석번호만 빠르게 입력할 수 있는 전용 화면입니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div
                className="rounded-[22px] border px-4 py-2.5 text-right"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(2,6,13,0.55)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.24em]"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  Current Time
                </p>
                <p
                  className="mt-1 text-2xl font-semibold tabular-nums md:text-3xl"
                  style={{ color: theme.colors.text.primary }}
                >
                  {formatClock(now)}
                </p>
                <p
                  className="mt-1 text-xs md:text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {formatDateHeader(now)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Button variant="secondary" onClick={toggleFullscreen}>
                  {isFullscreen ? "전체 화면 해제" : "전체 화면"}
                </Button>
                <Button variant="secondary" onClick={() => setLocation("/admin/attendance")}>
                  관리 화면으로 돌아가기
                </Button>
                <Button onClick={() => setLocation("/admin")}>대시보드</Button>
              </div>
            </div>
          </div>
        </header>

        <AdminAttendanceKioskContent mode="fullscreen" />
      </div>
    </div>
  );
}
