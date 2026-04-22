import { useAuth } from "@/_core/hooks/useAuth";
import PortalLayout from "@/components/PortalLayout";
import { Badge, Card, EmptyState, Input } from "@/components/common/CommonComponents";
import { useLinkedPortalData } from "@/hooks/useLinkedPortalData";
import { STUDENT_NAV_ITEMS, formatCurrency, formatDate } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { uiThemeVars } from "@/styles/runtime-theme";
import { useEffect, useMemo, useState } from "react";

type ProfileForm = {
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  dateOfBirth: string;
  address: string;
  notes: string;
};

function toDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function StudentProfile() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { snapshots, isLoading } = useLinkedPortalData();
  const snapshot = snapshots[0];
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "grades">("profile");
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    dateOfBirth: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (!snapshot) return;
    setForm({
      name: snapshot.student.name || "",
      phone: snapshot.student.phone || "",
      parentName: snapshot.student.parentName || "",
      parentPhone: snapshot.student.parentPhone || "",
      dateOfBirth: toDateInputValue(snapshot.student.dateOfBirth),
      address: snapshot.student.address || "",
      notes: snapshot.student.notes || "",
    });
  }, [snapshot]);

  const updateProfileMutation = trpc.portal.updateMyProfile.useMutation({
    onSuccess: async () => {
      setIsEditing(false);
      await utils.portal.linkedStudents.invalidate();
    },
  });

  const latestSchoolGrade = snapshot?.grades.latestSchoolGrade;
  const mockExams = useMemo(() => snapshot?.grades.mockExams ?? [], [snapshot]);

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-8">데이터를 불러오는 중입니다.</div>;
  }

  if (!snapshot) {
    return (
      <PortalLayout title="프로필" subtitle="내 정보" navItems={STUDENT_NAV_ITEMS} variant="portal-light">
        <Card variant="elevated" padding="lg">
          <EmptyState title="프로필 데이터를 불러올 수 없습니다" />
        </Card>
      </PortalLayout>
    );
  }

  const handleSave = async () => {
    await updateProfileMutation.mutateAsync({
      name: form.name,
      phone: form.phone,
      parentName: form.parentName,
      parentPhone: form.parentPhone,
      dateOfBirth: form.dateOfBirth || undefined,
      address: form.address,
      notes: form.notes,
    });
  };

  return (
    <PortalLayout title="프로필" subtitle="내 정보를 관리하세요." navItems={STUDENT_NAV_ITEMS} variant="portal-light">
      <div className="space-y-6">
        <div className="flex gap-2 rounded-2xl p-2" style={{ backgroundColor: uiThemeVars.surface }}>
          <button
            onClick={() => setActiveTab("profile")}
            className="flex-1 rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: activeTab === "profile" ? uiThemeVars.accentPrimary : "transparent",
              color: activeTab === "profile" ? "#fff" : uiThemeVars.textPrimary,
            }}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className="flex-1 rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: activeTab === "grades" ? uiThemeVars.accentPrimary : "transparent",
              color: activeTab === "grades" ? "#fff" : uiThemeVars.textPrimary,
            }}
          >
            성적 / 수납
          </button>
        </div>

        {activeTab === "profile" ? (
          <div className="space-y-6">
            <Card variant="elevated" padding="lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                  학생 기본 정보
                </h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="rounded-lg px-4 py-2 text-sm font-medium"
                        style={{
                          backgroundColor: uiThemeVars.accentPrimary,
                          color: "#fff",
                        }}
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setForm({
                            name: snapshot.student.name || "",
                            phone: snapshot.student.phone || "",
                            parentName: snapshot.student.parentName || "",
                            parentPhone: snapshot.student.parentPhone || "",
                            dateOfBirth: toDateInputValue(snapshot.student.dateOfBirth),
                            address: snapshot.student.address || "",
                            notes: snapshot.student.notes || "",
                          });
                        }}
                        className="rounded-lg px-4 py-2 text-sm font-medium"
                        style={{
                          backgroundColor: uiThemeVars.surfaceAlt,
                          color: uiThemeVars.textPrimary,
                          border: `1px solid ${uiThemeVars.borderPrimary}`,
                        }}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg px-4 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: uiThemeVars.surfaceAlt,
                        color: uiThemeVars.textPrimary,
                        border: `1px solid ${uiThemeVars.borderPrimary}`,
                      }}
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    이름
                  </p>
                  {isEditing ? (
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.name}</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    이메일
                  </p>
                  <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.email || "-"}</p>
                </div>
                <div>
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    휴대전화
                  </p>
                  {isEditing ? (
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.phone || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    생년월일
                  </p>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{formatDate(snapshot.student.dateOfBirth)}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    주소
                  </p>
                  {isEditing ? (
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.address || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    보호자 이름
                  </p>
                  {isEditing ? (
                    <Input
                      value={form.parentName}
                      onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.parentName || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    보호자 연락처
                  </p>
                  {isEditing ? (
                    <Input
                      value={form.parentPhone}
                      onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.parentPhone || "-"}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                    메모
                  </p>
                  {isEditing ? (
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="min-h-28 w-full rounded-lg p-3"
                      style={{
                        backgroundColor: uiThemeVars.surfaceAlt,
                        color: uiThemeVars.textPrimary,
                        border: `1px solid ${uiThemeVars.borderPrimary}`,
                      }}
                    />
                  ) : (
                    <p style={{ color: uiThemeVars.textPrimary }}>{snapshot.student.notes || "-"}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                수강 중인 반
              </h2>
              <div className="space-y-3">
                {snapshot.classes.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl p-4"
                    style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                  >
                    <div>
                      <p style={{ color: uiThemeVars.textPrimary }}>{item.name}</p>
                      <p className="mt-1 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                        {item.subject} · {item.teacherName || "강사 미지정"}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">
                      수강 중
                    </Badge>
                  </div>
                ))}
                {snapshot.classes.length === 0 ? (
                  <p style={{ color: uiThemeVars.textTertiary }}>수강 중인 반이 없습니다.</p>
                ) : null}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card variant="elevated" padding="lg">
              <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                성적 요약
              </h2>
              <div className="mb-4 flex items-center gap-3">
                <Badge variant="info" size="sm">
                  최근 내신
                </Badge>
                <p style={{ color: uiThemeVars.textPrimary }}>{latestSchoolGrade?.schoolGrade ?? "-"}등급</p>
              </div>
              <div className="space-y-3">
                {mockExams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                  >
                    <p className="mb-3 font-medium" style={{ color: uiThemeVars.textPrimary }}>
                      {exam.mockExamMonth}월 모의고사
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5" style={{ color: uiThemeVars.textSecondary }}>
                      <div>국어 {exam.korean ?? "-"}</div>
                      <div>영어 {exam.english ?? "-"}</div>
                      <div>수학 {exam.math ?? "-"}</div>
                      <div>과학 {exam.science ?? "-"}</div>
                      <div>사회 {exam.social ?? "-"}</div>
                    </div>
                  </div>
                ))}
                {mockExams.length === 0 ? (
                  <p style={{ color: uiThemeVars.textTertiary }}>등록된 모의고사 성적이 없습니다.</p>
                ) : null}
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h2 className="mb-4 text-lg font-semibold" style={{ color: uiThemeVars.textPrimary }}>
                수납 현황
              </h2>
              <div className="space-y-3">
                {snapshot.payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl p-4"
                    style={{ backgroundColor: uiThemeVars.surfaceAlt }}
                  >
                    <div>
                      <p style={{ color: uiThemeVars.textPrimary }}>{payment.month}</p>
                      <p className="mt-1 text-sm" style={{ color: uiThemeVars.textTertiary }}>
                        납부기한 {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: uiThemeVars.textPrimary }}>{formatCurrency(payment.amount)}</p>
                      <Badge
                        size="sm"
                        variant={
                          payment.status === "paid"
                            ? "success"
                            : payment.status === "overdue"
                              ? "error"
                              : "warning"
                        }
                      >
                        {payment.status === "paid"
                          ? "납부 완료"
                          : payment.status === "overdue"
                            ? "미납"
                            : "대기"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {snapshot.payments.length === 0 ? (
                  <p style={{ color: uiThemeVars.textTertiary }}>등록된 수납 정보가 없습니다.</p>
                ) : null}
              </div>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
