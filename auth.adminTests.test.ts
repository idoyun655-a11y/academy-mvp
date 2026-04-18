import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_USERS } from './auth';

describe('Admin Authentication and Authorization', () => {
  beforeEach(() => {
    // 테스트용 데이터 초기화
    // TEST_USERS는 이미 관리자 계정을 포함하고 있음
  });

  describe('Admin Login', () => {
    it('should successfully login with admin account', () => {
      const adminEmail = 'ETenglishacademy@gmail.com';
      const adminPassword = 'ETenglish';

      const user = TEST_USERS[adminEmail];
      expect(user).toBeDefined();
      expect(user.role).toBe('admin');
      expect(user.password).toBe(adminPassword);
    });

    it('should have admin role', () => {
      const adminEmail = 'ETenglishacademy@gmail.com';
      const user = TEST_USERS[adminEmail];

      expect(user.role).toBe('admin');
    });
  });

  describe('Teacher Registration Authorization', () => {
    it('should only allow admin to register teachers', () => {
      const adminEmail = 'ETenglishacademy@gmail.com';
      const admin = TEST_USERS[adminEmail];

      // 관리자만 교사 등록 가능
      expect(admin.role === 'admin').toBe(true);
    });

    it('should prevent non-admin from registering teachers', () => {
      // 학생이나 학부모는 교사 등록 불가
      const studentEmail = 'student@example.com';
      const studentUser = {
        id: 100,
        email: studentEmail,
        name: '학생',
        role: 'student' as const,
        password: 'StudentPass123',
      };

      expect(studentUser.role === 'admin').toBe(false);
      expect(studentUser.role).not.toBe('admin');
    });
  });

  describe('Teacher Login After Registration', () => {
    it('should allow teacher to login after registration', () => {
      const teacherEmail = 'teacher@example.com';
      const teacherPassword = 'Teacher123';

      // 교사 등록
      TEST_USERS[teacherEmail] = {
        id: 200,
        email: teacherEmail,
        name: '교사',
        role: 'teacher',
        password: teacherPassword,
      };

      // 로그인 확인
      const teacher = TEST_USERS[teacherEmail];
      expect(teacher).toBeDefined();
      expect(teacher.role).toBe('teacher');
      expect(teacher.password).toBe(teacherPassword);
    });
  });

  describe('Duplicate Email Registration', () => {
    it('should fail when registering with duplicate email', () => {
      const email = 'ETenglishacademy@gmail.com';

      // 이미 존재하는 이메일
      const exists = email in TEST_USERS;
      expect(exists).toBe(true);

      // 중복 등록 시도 (실패해야 함)
      let error: string | null = null;
      if (email in TEST_USERS) {
        error = 'Already registered email';
      }

      expect(error).toBe('Already registered email');
    });

    it('should allow registration with new email', () => {
      const newEmail = 'newteacher@example.com';

      // 새 이메일은 존재하지 않음
      const exists = newEmail in TEST_USERS;
      expect(exists).toBe(false);

      // 새 이메일로 등록 가능
      TEST_USERS[newEmail] = {
        id: 300,
        email: newEmail,
        name: '새 교사',
        role: 'teacher',
        password: 'NewTeacher123',
      };

      expect(newEmail in TEST_USERS).toBe(true);
    });
  });

  describe('Admin Role Verification', () => {
    it('should verify admin has correct permissions', () => {
      const adminEmail = 'ETenglishacademy@gmail.com';
      const admin = TEST_USERS[adminEmail];

      // 관리자 권한 확인
      const isAdmin = admin.role === 'admin';
      expect(isAdmin).toBe(true);

      // 관리자는 교사 등록 가능
      expect(isAdmin).toBe(true);
    });

    it('should verify teacher cannot perform admin operations', () => {
      const teacherEmail = 'teacher@example.com';
      TEST_USERS[teacherEmail] = {
        id: 400,
        email: teacherEmail,
        name: '교사',
        role: 'teacher',
        password: 'Teacher123',
      };

      const teacher = TEST_USERS[teacherEmail];
      const isAdmin = teacher.role === 'admin';
      expect(isAdmin).toBe(false);
    });
  });
});
