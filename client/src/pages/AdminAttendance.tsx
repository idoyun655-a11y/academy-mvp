import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/common/Button";
import { Badge, Card, EmptyState, StatCard } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS, formatDateTime } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["지우기", "0", "전체삭제"],
] as const;

function statusLabel(eventType: "check_in" | "check_out") {
  return eventType === "check_in" ? "등원" : "하원";
}

function statusVariant(eventType: "check_in" | "check_out") {
  return eventType === "check_in" ? "success" : "info";
}

export default function AdminAttendance() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [inputBuffer, setInputBuffer] = useState("");

  const { data: todayFeed, isLoading } = trpc.commute.todayFeed.useQuery(
    undefined,
    LIVE_QUERY_OPTIONS,
  );
  const { data: todaySummary } = trpc.commute.todaySummary.useQuery(
    undefined,
    LIVE_QUERY_OPTIONS,
  );

  const recordMutation = trpc.commute.recordByPin.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await Promise.all([
        utils.commute.todayFeed.invalidate(),
        utils.commute.todaySummary.invalidate(),
        utils.portal.adminSummary.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.studentOps.list.invalidate(),
        utils.studentOps.summary.invalidate(),
      ]);
    },
    onError: (error: any) => {
      toast.error(error.message || "등하원 처리 중 오류가 발생했습니다.");
    },
  });

  useEffect(() => {
    if (inputBuffer.length !== 4 || recordMutation.isPending) return;
    const nextPin = inputBuffer;
    setInputBuffer("");
    recordMutation.mutate({ attendancePin: nextPin });
  }, [inputBuffer, recordMutation]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (recordMutation.isPending) return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        setInputBuffer((current) =>
          current.length >= 4 ? current : `${current}${event.key}`,
        );
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setInputBuffer((current) => current.slice(0, -1));
        return;
      }

      if (event.key === "Delete" || event.key === "Escape") {
        event.preventDefault();
        setInputBuffer("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordMutation.isPending]);

  const onSiteNames = useMemo(
    () =>
      (todayFeed ?? [])
        .filter((item: any) => item.eventType === "check_in" && item.isOnSite)
        .map((item: any) => item.studentName),
    [todayFeed],
  );

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const handleKeypadPress = (value: string) => {
    if (recordMutation.isPending) return;

    if (value === "지우기") {
      setInputBuffer((current) => current.slice(0, -1));
      return;
    }

    if (value === "전체삭제") {
      setInputBuffer("");
      return;
    }

    setInputBuffer((current) => (current.length >= 4 ? current : `${current}${value}`));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1
            className="text-3xl font-bold md:text-4xl"
            style={{ color: theme.colors.text.primary }}
          >
            출석체크 창
          </h1>
          <p className="text-base" style={{ color: theme.colors.text.tertiary }}>
            학생이 4자리 출석번호를 입력하면 오늘 기준으로 첫 입력은 등원, 두 번째 입력은 하원으로 자동 기록됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="오늘 등원" value={todaySummary?.todayCheckInCount ?? 0} color="success" />
          <StatCard label="오늘 하원" value={todaySummary?.todayCheckOutCount ?? 0} color="info" />
          <StatCard label="현재 원내" value={todaySummary?.onSiteCount ?? 0} color="warning" />
          <StatCard label="미하원" value={todaySummary?.pendingCheckoutCount ?? 0} color="error" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card
            variant="elevated"
            padding="lg"
            className="min-h-[560px] xl:min-h-[720px]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                  오늘 등하원 기록
                </h2>
                <p className="mt-1 text-sm" style={{ color: theme.colors.text.tertiary }}>
                  최신 기록이 위에 쌓입니다.
                </p>
              </div>
              <Badge variant="info" size="sm">
                원내 {todaySummary?.onSiteCount ?? 0}명
              </Badge>
            </div>

            {onSiteNames.length > 0 ? (
              <div
                className="mt-4 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: theme.colors.border.primary,
                  backgroundColor: theme.colors.background.secondary,
                }}
              >
                <p className="text-xs" style={{ color: theme.colors.text.tertiary }}>
                  아직 하원하지 않은 학생
                </p>
                <p className="mt-2 text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                  {onSiteNames.join(", ")}
                </p>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              {isLoading ? (
                <p style={{ color: theme.colors.text.tertiary }}>기록을 불러오는 중입니다.</p>
              ) : todayFeed?.length ? (
                todayFeed.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: item.isOnSite
                        ? theme.colors.accent.primary
                        : theme.colors.border.primary,
                      backgroundColor: theme.colors.background.secondary,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" style={{ color: theme.colors.text.primary }}>
                            {item.studentName}
                          </p>
                          <Badge variant={statusVariant(item.eventType)} size="sm">
                            {statusLabel(item.eventType)}
                          </Badge>
                          {item.isOnSite ? (
                            <Badge variant="warning" size="sm">
                              미하원
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                          출석번호 {item.attendancePin ?? "미등록"}
                        </p>
                      </div>
                      <div className="text-right text-sm" style={{ color: theme.colors.text.tertiary }}>
                        <p>{formatDateTime(item.eventAt)}</p>
                        <p className="mt-1">{item.commuteDate}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="오늘 기록이 아직 없습니다." description="오른쪽 키패드에서 4자리 출석번호를 입력하세요." />
              )}
            </div>
          </Card>

          <Card
            variant="elevated"
            padding="lg"
            className="min-h-[560px] xl:min-h-[720px]"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                숫자 키패드
              </h2>
              <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                4자리가 채워지면 자동으로 제출됩니다.
              </p>
            </div>

            <div
              className="mt-6 rounded-3xl border px-6 py-8 text-center"
              style={{
                borderColor: theme.colors.border.primary,
                backgroundColor: theme.colors.background.secondary,
              }}
            >
              <p className="text-sm" style={{ color: theme.colors.text.tertiary }}>
                현재 입력
              </p>
              <p
                className="mt-4 text-4xl font-bold tracking-[0.35em] md:text-5xl md:tracking-[0.6em]"
                style={{ color: theme.colors.text.primary }}
              >
                {(inputBuffer || "____").padEnd(4, "_")}
              </p>
              <p className="mt-4 text-sm" style={{ color: theme.colors.text.tertiary }}>
                {recordMutation.isPending ? "처리 중..." : "학생이 번호를 바로 누르면 됩니다."}
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:gap-4">
              {KEYPAD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-3 sm:gap-4">
                  {row.map((key) => {
                    const isAction = key === "지우기" || key === "전체삭제";
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadPress(key)}
                        disabled={recordMutation.isPending}
                        className="h-20 rounded-3xl text-xl font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:h-24 sm:text-2xl"
                        style={{
                          backgroundColor: isAction
                            ? theme.colors.background.secondary
                            : theme.colors.accent.primary,
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.primary}`,
                        }}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div
              className="mt-8 rounded-2xl border px-4 py-4"
              style={{
                borderColor: theme.colors.border.primary,
                backgroundColor: theme.colors.background.secondary,
              }}
            >
              <p className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                입력 규칙
              </p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: theme.colors.text.tertiary }}>
                <li>첫 입력은 등원으로 처리됩니다.</li>
                <li>같은 날 두 번째 입력은 하원으로 처리됩니다.</li>
                <li>이미 하원까지 끝난 학생은 더 이상 입력되지 않습니다.</li>
                <li>등록되지 않은 번호는 오류로 안내됩니다.</li>
                <li>PC 키보드 숫자와 숫자패드도 바로 입력할 수 있습니다.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
