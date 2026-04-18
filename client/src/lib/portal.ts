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
  { href: "/student/schedule", label: "시간표" },
  { href: "/student/attendance", label: "출결" },
  { href: "/student/notices", label: "공지" },
  { href: "/student/profile", label: "프로필" },
];

export const PARENT_NAV_ITEMS = [{ href: "/parent", label: "부모 페이지" }];

export const ATTENDANCE_META = {
  present: {
    label: "출석",
    color: theme.colors.status.success,
  },
  late: {
    label: "지각",
    color: theme.colors.status.warning,
  },
  absent: {
    label: "결석",
    color: theme.colors.status.error,
  },
  early_leave: {
    label: "조퇴",
    color: "#ef4444",
  },
} as const;

export function getAttendanceMeta(status: string) {
  return (
    ATTENDANCE_META[status as keyof typeof ATTENDANCE_META] ?? {
      label: status,
      color: theme.colors.text.tertiary,
    }
  );
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
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
