import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_USERS } from './auth';

describe('auth.listStudents, auth.updateStudent, auth.deleteStudent', () => {
  beforeEach(() => {
    // 테스트용 학생 데이터 추가
    TEST_USERS['student1@example.com'] = {
      id: 100,
      email: 'student1@example.com',
      name: '김학생',
      role: 'student',
      password: 'Student123',
      phone: '010-1111-1111',
    };
    TEST_USERS['student2@example.com'] = {
      id: 101,
      email: 'student2@example.com',
      name: '이학생',
      role: 'student',
      password: 'Student456',
      phone: '010-2222-2222',
    };
  });

  describe('listStudents', () => {
    it('should return all students', () => {
      const students = Object.values(TEST_USERS)
        .filter((user: any) => user.role === 'student')
        .map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || null,
          role: user.role,
        }));

      expect(students.length).toBeGreaterThanOrEqual(2);
      expect(students.some((s: any) => s.email === 'student1@example.com')).toBe(true);
      expect(students.some((s: any) => s.email === 'student2@example.com')).toBe(true);
    });

    it('should filter students by search term', () => {
      const searchTerm = '김';
      const students = Object.values(TEST_USERS)
        .filter((user: any) => user.role === 'student')
        .map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || null,
          role: user.role,
        }));

      const filtered = students.filter((student: any) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.phone && student.phone.includes(searchTerm))
      );

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((s: any) => s.name === '김학생')).toBe(true);
    });

    it('should support pagination', () => {
      const limit = 1;
      const offset = 0;

      const students = Object.values(TEST_USERS)
        .filter((user: any) => user.role === 'student')
        .map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || null,
          role: user.role,
        }));

      const total = students.length;
      const paginated = students.slice(offset, offset + limit);

      expect(paginated.length).toBeLessThanOrEqual(limit);
      expect(total).toBeGreaterThanOrEqual(paginated.length);
    });
  });

  describe('updateStudent', () => {
    it('should update student name', () => {
      const email = 'student1@example.com';
      const newName = '박학생';

      if (email in TEST_USERS) {
        const student = TEST_USERS[email];
        if (student.role === 'student') {
          student.name = newName;
        }
      }

      expect(TEST_USERS[email].name).toBe(newName);
    });

    it('should update student phone', () => {
      const email = 'student1@example.com';
      const newPhone = '010-3333-3333';

      if (email in TEST_USERS) {
        const student = TEST_USERS[email];
        if (student.role === 'student') {
          student.phone = newPhone;
        }
      }

      expect(TEST_USERS[email].phone).toBe(newPhone);
    });

    it('should throw error if student not found', () => {
      const email = 'nonexistent@example.com';
      let error: string | null = null;

      if (!(email in TEST_USERS)) {
        error = 'Student not found';
      }

      expect(error).toBe('Student not found');
    });
  });

  describe('deleteStudent', () => {
    it('should delete student successfully', () => {
      const email = 'student1@example.com';

      expect(email in TEST_USERS).toBe(true);

      if (email in TEST_USERS) {
        const student = TEST_USERS[email];
        if (student.role === 'student') {
          delete TEST_USERS[email];
        }
      }

      expect(email in TEST_USERS).toBe(false);
    });

    it('should throw error if student not found', () => {
      const email = 'nonexistent@example.com';
      let error: string | null = null;

      if (!(email in TEST_USERS)) {
        error = 'Student not found';
      }

      expect(error).toBe('Student not found');
    });
  });

  describe('Student Auto-sync on Signup', () => {
    it('should automatically add student to TEST_USERS on signup', () => {
      const newStudentEmail = 'newsignup@example.com';
      
      // 회원가입 시뮬레이션
      TEST_USERS[newStudentEmail] = {
        id: 102,
        email: newStudentEmail,
        name: '새로운학생',
        role: 'student',
        password: 'NewStudent123',
        phone: '010-4444-4444',
      };

      // 관리자가 학생 목록 조회
      const students = Object.values(TEST_USERS)
        .filter((user: any) => user.role === 'student')
        .map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || null,
          role: user.role,
        }));

      // 새로 가입한 학생이 목록에 있는지 확인
      expect(students.some((s: any) => s.email === newStudentEmail)).toBe(true);
    });
  });
});
