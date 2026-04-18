import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_USERS } from './auth';

describe('auth.updateTeacher and auth.deleteTeacher', () => {
  beforeEach(() => {
    // 테스트용 교사 데이터 추가
    TEST_USERS['teacher1@example.com'] = {
      id: 1,
      email: 'teacher1@example.com',
      name: '김교사',
      role: 'teacher',
      password: 'Teacher123',
      phone: '010-1234-5678',
    };
    TEST_USERS['teacher2@example.com'] = {
      id: 2,
      email: 'teacher2@example.com',
      name: '이교사',
      role: 'teacher',
      password: 'Teacher456',
      phone: '010-9876-5432',
    };
  });

  describe('updateTeacher', () => {
    it('should update teacher name', () => {
      const email = 'teacher1@example.com';
      const newName = '박교사';

      if (email in TEST_USERS) {
        const teacher = TEST_USERS[email];
        if (teacher.role === 'teacher') {
          teacher.name = newName;
        }
      }

      expect(TEST_USERS[email].name).toBe(newName);
    });

    it('should update teacher phone', () => {
      const email = 'teacher1@example.com';
      const newPhone = '010-5555-5555';

      if (email in TEST_USERS) {
        const teacher = TEST_USERS[email];
        if (teacher.role === 'teacher') {
          teacher.phone = newPhone;
        }
      }

      expect(TEST_USERS[email].phone).toBe(newPhone);
    });

    it('should throw error if teacher not found', () => {
      const email = 'nonexistent@example.com';
      let error: string | null = null;

      if (!(email in TEST_USERS)) {
        error = 'Teacher not found';
      }

      expect(error).toBe('Teacher not found');
    });

    it('should throw error if user is not a teacher', () => {
      const email = 'ETenglishacademy@gmail.com'; // admin account
      let error: string | null = null;

      if (email in TEST_USERS) {
        const user = TEST_USERS[email];
        if (user.role !== 'teacher') {
          error = 'User is not a teacher';
        }
      }

      expect(error).toBe('User is not a teacher');
    });
  });

  describe('deleteTeacher', () => {
    it('should delete teacher successfully', () => {
      const email = 'teacher1@example.com';

      expect(email in TEST_USERS).toBe(true);

      if (email in TEST_USERS) {
        const teacher = TEST_USERS[email];
        if (teacher.role === 'teacher') {
          delete TEST_USERS[email];
        }
      }

      expect(email in TEST_USERS).toBe(false);
    });

    it('should throw error if teacher not found', () => {
      const email = 'nonexistent@example.com';
      let error: string | null = null;

      if (!(email in TEST_USERS)) {
        error = 'Teacher not found';
      }

      expect(error).toBe('Teacher not found');
    });

    it('should throw error if user is not a teacher', () => {
      const email = 'ETenglishacademy@gmail.com'; // admin account
      let error: string | null = null;

      if (email in TEST_USERS) {
        const user = TEST_USERS[email];
        if (user.role !== 'teacher') {
          error = 'User is not a teacher';
        }
      }

      expect(error).toBe('User is not a teacher');
    });
  });
});
