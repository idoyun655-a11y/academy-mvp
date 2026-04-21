import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/common/Button";
import AdminAttendanceKioskContent from "@/components/AdminAttendanceKioskContent";
import { theme } from "@/styles/design-system";

export default function AdminAttendance() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const openStandaloneMode = () => {
    const popup = window.open(
      "/admin/attendance-mode",
      "_blank",
      "noopener,noreferrer",
    );

    if (!popup) {
      setLocation("/admin/attendance-mode");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <h1
              className="text-3xl font-bold md:text-4xl"
              style={{ color: theme.colors.text.primary }}
            >
              등하원 출석체크
            </h1>
            <p className="text-base" style={{ color: theme.colors.text.tertiary }}>
              학생 출석번호 4자리를 입력하면 같은 날 기준으로 첫 입력은 등원, 두 번째 입력은 하원으로 자동 기록됩니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setLocation("/admin/attendance-mode")}
            >
              현재 탭에서 모드 열기
            </Button>
            <Button onClick={openStandaloneMode}>새 탭으로 출석체크 모드 열기</Button>
          </div>
        </div>

        <AdminAttendanceKioskContent mode="embedded" />
      </div>
    </DashboardLayout>
  );
}
