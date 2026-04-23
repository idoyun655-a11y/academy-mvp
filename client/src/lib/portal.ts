import { theme } from "@/styles/design-system";

export const LIVE_QUERY_OPTIONS = {
  refetchInterval: 5000,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  staleTime: 2000,
} as const;

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const STUDENT_NAV_ITEMS = [
  { href: "/student", label: "홈" },
  { href: "/student/calendar", label: "캘린더" },
  { href: "/student/schedule", label: "시간표" },
  { href: "/student/attendance", label: "출결" },
  { href: "/student/notices", label: "공지" },
  { href: "/student/profile", label: "프로필" },
];

export const PARENT_NAV_ITEMS = [{ href: "/parent", label: "부모 페이지" }];

export const COMMUTE_STATUS_META = {
  not_arrived: {
    label: "기록 없음",
    color: theme.colors.text.tertiary,
  },
  checked_in: {
    label: "등원",
    color: theme.colors.status.success,
  },
  checked_out: {
    label: "하원",
    color: theme.colors.status.info,
  },
} as const;

export function getCommuteStatusMeta(status: string) {
  return (
    COMMUTE_STATUS_META[status as keyof typeof COMMUTE_STATUS_META] ?? {
      label: status,
      color: theme.colors.text.tertiary,
    }
  );
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}

export function formatCurrency(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "-";
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function getLatestMockExam(mockExams: any[]) {
  if (!mockExams || mockExams.length === 0) return null;
  return mockExams[mockExams.length - 1];
}
