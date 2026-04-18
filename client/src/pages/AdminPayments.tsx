import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge, Card, EmptyState, SearchBar } from "@/components/common/CommonComponents";
import { LIVE_QUERY_OPTIONS, formatCurrency, formatDate } from "@/lib/portal";
import { trpc } from "@/lib/trpc";
import { theme } from "@/styles/design-system";
import { useMemo, useState } from "react";

type PaymentStatus = "pending" | "paid" | "overdue";

type PaymentForm = {
  month: string;
  amount: string;
  paidAmount: string;
  status: PaymentStatus;
  dueDate: string;
  paidDate: string;
  notes: string;
};

const INITIAL_FORM: PaymentForm = {
  month: new Date().toISOString().slice(0, 7),
  amount: "",
  paidAmount: "",
  status: "pending",
  dueDate: "",
  paidDate: "",
  notes: "",
};

function toDateValue(value?: string | Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function getStatusLabel(status: PaymentStatus) {
  if (status === "paid") return "납부 완료";
  if (status === "overdue") return "미납";
  return "대기";
}

function getStatusVariant(status: PaymentStatus) {
  if (status === "paid") return "success";
  if (status === "overdue") return "error";
  return "warning";
}

export default function AdminPayments() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [searchName, setSearchName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [form, setForm] = useState<PaymentForm>(INITIAL_FORM);

  const { data: studentsData } = trpc.students.list.useQuery(
    { limit: 200, offset: 0, search: searchName || undefined },
    LIVE_QUERY_OPTIONS
  );

  const { data: paymentsData, isLoading } = trpc.tuition.getByStudent.useQuery(
    { studentId: selectedStudentId || 0 },
    {
      ...LIVE_QUERY_OPTIONS,
      enabled: Boolean(selectedStudentId),
    }
  );

  const createPaymentMutation = trpc.tuition.create.useMutation({
    onSuccess: async () => {
      setEditingPaymentId(null);
      setForm(INITIAL_FORM);
      await Promise.all([
        utils.tuition.getByStudent.invalidate(),
        utils.tuition.getByMonth.invalidate(),
        utils.tuition.getOverdue.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.portal.adminSummary.invalidate(),
      ]);
    },
  });

  const updatePaymentMutation = trpc.tuition.updatePayment.useMutation({
    onSuccess: async () => {
      setEditingPaymentId(null);
      setForm(INITIAL_FORM);
      await Promise.all([
        utils.tuition.getByStudent.invalidate(),
        utils.tuition.getByMonth.invalidate(),
        utils.tuition.getOverdue.invalidate(),
        utils.portal.linkedStudents.invalidate(),
        utils.portal.adminSummary.invalidate(),
      ]);
    },
  });

  const students = studentsData?.data ?? [];
  const payments = paymentsData ?? [];
  const selectedStudent =
    students.find((student: any) => student.id === selectedStudentId) ?? null;

  const totals = useMemo(
    () => ({
      pending: payments.filter((payment: any) => payment.status === "pending").length,
      overdue: payments.filter((payment: any) => payment.status === "overdue").length,
      paid: payments.filter((payment: any) => payment.status === "paid").length,
    }),
    [payments]
  );

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const isSaving = createPaymentMutation.isPending || updatePaymentMutation.isPending;

  const handleResetForm = () => {
    setEditingPaymentId(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async () => {
    if (!selectedStudentId || !form.month || !form.amount) return;

    const normalizedPaidAmount =
      form.status === "paid"
        ? form.paidAmount || form.amount
        : form.paidAmount || "0";
    const normalizedPaidDate =
      form.status === "paid" ? form.paidDate || new Date().toISOString().slice(0, 10) : form.paidDate;

    const payload = {
      month: form.month,
      amount: form.amount,
      paidAmount: normalizedPaidAmount,
      status: form.status,
      dueDate: form.dueDate || undefined,
      paidDate: normalizedPaidDate || undefined,
      notes: form.notes || undefined,
    };

    if (editingPaymentId) {
      await updatePaymentMutation.mutateAsync({
        id: editingPaymentId,
        ...payload,
        dueDate: form.dueDate,
        paidDate: normalizedPaidDate,
        notes: form.notes,
      });
      return;
    }

    await createPaymentMutation.mutateAsync({
      studentId: selectedStudentId,
      ...payload,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-4xl font-bold mb-1"
            style={{ color: theme.colors.text.primary }}
          >
            수납 관리
          </h1>
          <p
            className="text-base"
            style={{ color: theme.colors.text.tertiary }}
          >
            저장하면 학생 페이지와 학부모 페이지의 수납 현황이 같은 데이터로 즉시 갱신됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="elevated" padding="lg">
            <SearchBar
              placeholder="학생 검색"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
            />

            <div className="mt-4 space-y-2 max-h-[32rem] overflow-y-auto">
              {students.map((student: any) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    handleResetForm();
                  }}
                  className="w-full text-left p-3 rounded-lg"
                  style={{
                    backgroundColor:
                      selectedStudentId === student.id
                        ? theme.colors.accent.primary
                        : theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                  }}
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs mt-1 opacity-80">{student.email || "-"}</p>
                </button>
              ))}
              {students.length === 0 && <EmptyState title="학생이 없습니다" />}
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {!selectedStudentId ? (
              <Card variant="elevated" padding="lg">
                <EmptyState title="학생을 먼저 선택해 주세요" />
              </Card>
            ) : (
              <>
                <Card variant="elevated" padding="lg">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {selectedStudent?.name || "선택된 학생"} 수납 입력
                      </h2>
                      <p
                        className="text-sm mt-1"
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        같은 월은 새로 저장해도 자동으로 최신 값으로 덮어씁니다.
                      </p>
                    </div>
                    <button
                      onClick={handleResetForm}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    >
                      새 입력
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="month"
                      value={form.month}
                      onChange={(event) => setForm({ ...form, month: event.target.value })}
                      className="px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={form.amount}
                      onChange={(event) => setForm({ ...form, amount: event.target.value })}
                      placeholder="청구 금액"
                      className="px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm({ ...form, status: event.target.value as PaymentStatus })
                      }
                      className="px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    >
                      <option value="pending">납부 대기</option>
                      <option value="paid">납부 완료</option>
                      <option value="overdue">미납</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={form.paidAmount}
                      onChange={(event) => setForm({ ...form, paidAmount: event.target.value })}
                      placeholder="실납부액"
                      className="px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                      className="px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                    <input
                      type="date"
                      value={form.paidDate}
                      onChange={(event) => setForm({ ...form, paidDate: event.target.value })}
                      className="px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                    <textarea
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      placeholder="메모"
                      className="md:col-span-2 min-h-28 px-3 py-3 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.border.primary}`,
                      }}
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isSaving || !form.month || !form.amount}
                      className="px-4 py-3 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: theme.colors.accent.primary,
                        color: "#fff",
                      }}
                    >
                      {isSaving ? "저장 중..." : editingPaymentId ? "수납 수정" : "수납 저장"}
                    </button>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="elevated" padding="md">
                    <p style={{ color: theme.colors.text.tertiary }}>납부 완료</p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: theme.colors.status.success }}
                    >
                      {totals.paid}
                    </p>
                  </Card>
                  <Card variant="elevated" padding="md">
                    <p style={{ color: theme.colors.text.tertiary }}>납부 대기</p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: theme.colors.status.warning }}
                    >
                      {totals.pending}
                    </p>
                  </Card>
                  <Card variant="elevated" padding="md">
                    <p style={{ color: theme.colors.text.tertiary }}>미납</p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: theme.colors.status.error }}
                    >
                      {totals.overdue}
                    </p>
                  </Card>
                </div>

                <Card variant="elevated" padding="lg">
                  <h2
                    className="text-lg font-semibold mb-4"
                    style={{ color: theme.colors.text.primary }}
                  >
                    저장된 수납 내역
                  </h2>

                  {isLoading ? (
                    <p style={{ color: theme.colors.text.tertiary }}>데이터를 불러오는 중입니다.</p>
                  ) : payments.length === 0 ? (
                    <EmptyState title="등록된 수납 내역이 없습니다" />
                  ) : (
                    <div className="space-y-3">
                      {payments.map((payment: any) => (
                        <div
                          key={payment.id}
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: theme.colors.background.secondary }}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className="text-lg font-semibold"
                                  style={{ color: theme.colors.text.primary }}
                                >
                                  {payment.month}
                                </p>
                                <Badge
                                  variant={getStatusVariant(payment.status as PaymentStatus)}
                                  size="sm"
                                >
                                  {getStatusLabel(payment.status as PaymentStatus)}
                                </Badge>
                              </div>
                              <p
                                className="text-sm"
                                style={{ color: theme.colors.text.tertiary }}
                              >
                                청구 {formatCurrency(payment.amount)} · 납부 {formatCurrency(payment.paidAmount)}
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: theme.colors.text.tertiary }}
                              >
                                납부기한 {formatDate(payment.dueDate)} · 실제 납부일 {formatDate(payment.paidDate)}
                              </p>
                              {payment.notes && (
                                <p
                                  className="text-sm whitespace-pre-wrap"
                                  style={{ color: theme.colors.text.tertiary }}
                                >
                                  {payment.notes}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingPaymentId(payment.id);
                                setForm({
                                  month: payment.month,
                                  amount: String(payment.amount ?? ""),
                                  paidAmount: String(payment.paidAmount ?? ""),
                                  status: payment.status,
                                  dueDate: toDateValue(payment.dueDate),
                                  paidDate: toDateValue(payment.paidDate),
                                  notes: payment.notes || "",
                                });
                              }}
                              className="px-3 py-2 rounded-lg text-sm"
                              style={{
                                backgroundColor: theme.colors.background.primary,
                                color: theme.colors.text.primary,
                                border: `1px solid ${theme.colors.border.primary}`,
                              }}
                            >
                              불러오기
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
