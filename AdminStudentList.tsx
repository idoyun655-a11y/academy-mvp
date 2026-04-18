import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, Badge } from '@/components/common/CommonComponents';
import Button from '@/components/common/Button';
import { theme } from '@/styles/design-system';
import { trpc } from '@/lib/trpc';


export default function AdminStudentList() {
  const showToast = (message: string, type: string) => {
    alert(message);
  };
  const [search, setSearch] = useState('');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 학생 목록 조회
  const { data: studentsData, isLoading, refetch } = trpc.auth.listStudents.useQuery({
    limit,
    offset,
    search: search || undefined,
  });

  // 학생 정보 수정
  const updateStudentMutation = trpc.auth.updateStudent.useMutation({
    onSuccess: () => {
      alert('학생 정보가 수정되었습니다.');
      setEditingStudent(null);
      refetch();
    },
    onError: (error) => {
      alert(`오류: ${error.message}`);
    },
  });

  // 학생 계정 삭제
  const deleteStudentMutation = trpc.auth.deleteStudent.useMutation({
    onSuccess: () => {
      alert('학생 계정이 삭제되었습니다.');
      setDeleteConfirm(null);
      refetch();
    },
    onError: (error) => {
      alert(`오류: ${error.message}`);
    },
  });

  const students = studentsData?.data || [];
  const total = studentsData?.total || 0;

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditPhone(student.phone || '');
  };

  const handleSaveEdit = () => {
    if (!editingStudent) return;
    updateStudentMutation.mutate({
      id: editingStudent.id,
      name: editName || undefined,
      phone: editPhone || undefined,
    });
  };

  const handleDeleteStudent = (id: number) => {
    deleteStudentMutation.mutate({ id });
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: theme.colors.text.primary }}
          >
            👥 학생 관리
          </h1>
          <p
            className="text-base"
            style={{ color: theme.colors.text.tertiary }}
          >
            회원가입한 학생들을 조회하고 관리합니다
          </p>
        </div>

        {/* 검색 */}
        <Card variant="elevated" padding="lg">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="학생명, 이메일, 전화번호로 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              className="flex-1 px-4 py-2 border rounded-lg"
              style={{ borderColor: theme.colors.border.light }}
            />
          </div>
        </Card>

        {/* 학생 목록 */}
        <Card variant="elevated" padding="lg">
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: theme.colors.text.tertiary }}>
                등록된 학생이 없습니다
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${theme.colors.border.light}`,
                      }}
                    >
                      <th className="py-3 px-4 text-left font-semibold">
                        이름
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        이메일
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        전화번호
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        상태
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student: any) => (
                      <tr
                        key={student.email}
                        style={{
                          borderBottom: `1px solid ${theme.colors.border.light}`,
                        }}
                      >
                        <td className="py-3 px-4">{student.name}</td>
                        <td className="py-3 px-4 text-sm">
                          {student.email}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {student.phone || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success" size="sm">
                            활성
                          </Badge>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteConfirm(student.email)}
                          >
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between mt-6 pt-4">
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  총 {total}명 (페이지 {currentPage}/{totalPages})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    이전
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setOffset(
                        Math.min(offset + limit, (total - 1) * limit)
                      )
                    }
                    disabled={currentPage >= totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* 수정 모달 */}
        {editingStudent && (
          <Card
            variant="elevated"
            padding="lg"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                학생 정보 수정
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: theme.colors.border.light }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: theme.colors.border.light }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  size="md"
                  isFullWidth
                  onClick={handleSaveEdit}
                  isLoading={updateStudentMutation.isPending}
                >
                  저장
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  isFullWidth
                  onClick={() => setEditingStudent(null)}
                >
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 삭제 확인 모달 */}
        {deleteConfirm && (
          <Card
            variant="elevated"
            padding="lg"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 w-96">
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                학생 계정 삭제
              </h2>

              <p
                className="mb-6"
                style={{ color: theme.colors.text.secondary }}
              >
                정말로 {deleteConfirm} 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수
                없습니다.
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteStudent(Number(deleteConfirm))}
                  isLoading={deleteStudentMutation.isPending}
                >
                  삭제
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  isFullWidth
                  onClick={() => setDeleteConfirm(null)}
                >
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
