import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { theme } from '@/styles/design-system';
import { Card, Input, Badge } from '@/components/common/CommonComponents';
import Button from '@/components/common/Button';

interface Teacher {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

interface EditingTeacher {
  email: string;
  name: string;
  phone: string | null;
}

export default function TeacherManagement() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<EditingTeacher | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const registerTeacherMutation = trpc.auth.registerTeacher.useMutation();
  const updateTeacherMutation = trpc.auth.updateTeacher.useMutation();
  const deleteTeacherMutation = trpc.auth.deleteTeacher.useMutation();
  const listTeachersQuery = trpc.auth.listTeachers.useQuery({
    limit: 50,
    offset: 0,
    search: searchTerm || undefined,
  });

  // 교사 목록 업데이트
  useEffect(() => {
    if (listTeachersQuery.data) {
      setTeachers(listTeachersQuery.data.data);
    }
  }, [listTeachersQuery.data]);

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;

    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'medium';
    return 'strong';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 유효성 검증
      if (!email || !password || !name) {
        toast.error('필수 정보를 입력해주세요');
        return;
      }

      if (password.length < 8) {
        toast.error('비밀번호는 최소 8자 이상이어야 합니다');
        return;
      }

      if (!/[A-Z]/.test(password)) {
        toast.error('비밀번호는 대문자를 포함해야 합니다');
        return;
      }

      if (!/[0-9]/.test(password)) {
        toast.error('비밀번호는 숫자를 포함해야 합니다');
        return;
      }

      await registerTeacherMutation.mutateAsync({
        email,
        password,
        name,
        phone: phone || undefined,
      });

      toast.success('교사 계정이 등록되었습니다');
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setPasswordStrength('weak');
      
      // 교사 목록 새로고침
      listTeachersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || '교사 계정 등록 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditPhone(teacher.phone || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher) return;

    try {
      await updateTeacherMutation.mutateAsync({
        email: editingTeacher.email,
        name: editName || undefined,
        phone: editPhone || undefined,
      });

      toast.success('교사 정보가 수정되었습니다');
      setEditingTeacher(null);
      listTeachersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || '교사 정보 수정 실패');
    }
  };

  const handleDeleteTeacher = async (email: string) => {
    try {
      await deleteTeacherMutation.mutateAsync({ email });
      toast.success('교사 계정이 삭제되었습니다');
      setDeleteConfirm(null);
      listTeachersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || '교사 계정 삭제 실패');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'strong':
        return '#10b981';
      default:
        return '#d1d5db';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: theme.colors.text.primary }}
        >
          👨‍🏫 교사 관리
        </h1>
        <p
          className="text-sm"
          style={{ color: theme.colors.text.tertiary }}
        >
          새로운 교사 계정을 등록하고 관리합니다
        </p>
      </div>

      {/* 교사 등록 폼 */}
      <Card variant="elevated" padding="lg">
        <div className="mb-4">
          <h2
            className="text-xl font-semibold"
            style={{ color: theme.colors.text.primary }}
          >
            새 교사 계정 등록
          </h2>
        </div>

        <form onSubmit={handleRegisterTeacher} className="space-y-4">
          {/* 이메일 */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text.primary }}
            >
              이메일 *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              size="md"
              leftIcon="✉️"
            />
          </div>

          {/* 이름 */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text.primary }}
            >
              이름 *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="강사 이름"
              size="md"
              leftIcon="👤"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text.primary }}
            >
              전화번호
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              size="md"
              leftIcon="📞"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text.primary }}
            >
              비밀번호 * (최소 8자, 대문자, 숫자 포함)
            </label>
            <Input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              size="md"
              leftIcon="🔒"
            />
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: getPasswordStrengthColor() }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: getPasswordStrengthColor() }}
                >
                  {passwordStrength === 'weak' && '약함'}
                  {passwordStrength === 'medium' && '중간'}
                  {passwordStrength === 'strong' && '강함'}
                </span>
              </div>
            )}
          </div>

          {/* 등록 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isFullWidth
            isLoading={isLoading}
          >
            {isLoading ? '등록 중...' : '교사 계정 등록'}
          </Button>
        </form>
      </Card>

      {/* 교사 목록 */}
      <Card variant="elevated" padding="lg">
        <div className="mb-4">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            등록된 교사 목록 ({teachers.length}명)
          </h2>
          
          {/* 검색 */}
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="교사명, 이메일, 전화번호로 검색..."
            size="md"
            leftIcon="🔍"
          />
        </div>

        {/* 교사 목록 테이블 */}
        {teachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${theme.colors.border.light}`,
                  }}
                >
                  <th
                    className="text-left py-3 px-4 font-semibold"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    이름
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    이메일
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    전화번호
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    상태
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                    }}
                  >
                    <td
                      className="py-3 px-4"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {teacher.name}
                    </td>
                    <td
                      className="py-3 px-4"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {teacher.email}
                    </td>
                    <td
                      className="py-3 px-4"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {teacher.phone || '-'}
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
                        onClick={() => handleEditTeacher(teacher)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirm(teacher.email)}
                      >
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="text-center py-8"
            style={{ color: theme.colors.text.tertiary }}
          >
            등록된 교사가 없습니다
          </div>
        )}
      </Card>

      {/* 교사 정보 수정 모달 */}
      {editingTeacher && (
        <Card variant="elevated" padding="lg">
          <div className="mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              교사 정보 수정
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: theme.colors.text.secondary }}
            >
              {editingTeacher.email}
            </p>
          </div>

          <div className="space-y-4">
            {/* 이름 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                이름
              </label>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="강사 이름"
                size="md"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                전화번호
              </label>
              <Input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="010-1234-5678"
                size="md"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="primary"
                size="md"
                isFullWidth
                onClick={handleSaveEdit}
                isLoading={updateTeacherMutation.isPending}
              >
                저장
              </Button>
              <Button
                variant="secondary"
                size="md"
                isFullWidth
                onClick={() => setEditingTeacher(null)}
              >
                취소
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <Card variant="elevated" padding="lg">
          <div className="mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: theme.colors.status.error }}
            >
              ⚠️ 교사 계정 삭제
            </h2>
            <p
              className="text-sm mt-2"
              style={{ color: theme.colors.text.secondary }}
            >
              정말로 이 교사 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <p
              className="text-sm font-medium mt-2"
              style={{ color: theme.colors.text.primary }}
            >
              {deleteConfirm}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="danger"
              size="md"
              isFullWidth
              onClick={() => handleDeleteTeacher(deleteConfirm)}
              isLoading={deleteTeacherMutation.isPending}
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
        </Card>
      )}

      {/* 안내 */}
      <Card variant="glass" padding="md">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <h3
              className="font-semibold text-sm mb-2"
              style={{ color: theme.colors.text.primary }}
            >
              교사 계정 관리 안내
            </h3>
            <ul
              className="text-xs space-y-1"
              style={{ color: theme.colors.text.secondary }}
            >
              <li>• 등록된 이메일로 로그인할 수 있습니다</li>
              <li>• 비밀번호는 최소 8자, 대문자, 숫자를 포함해야 합니다</li>
              <li>• 교사는 자신의 반과 학생 정보를 관리할 수 있습니다</li>
              <li>• 수정 버튼으로 이름과 전화번호를 변경할 수 있습니다</li>
              <li>• 삭제 버튼으로 교사 계정을 완전히 제거할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
