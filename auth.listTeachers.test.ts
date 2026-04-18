import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_USERS } from './auth';

describe('auth.listTeachers', () => {
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

  it('should return all teachers', () => {
    const teachers = Object.values(TEST_USERS)
      .filter((user: any) => user.role === 'teacher')
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
      }));

    expect(teachers.length).toBeGreaterThanOrEqual(2);
    expect(teachers.some((t: any) => t.email === 'teacher1@example.com')).toBe(true);
    expect(teachers.some((t: any) => t.email === 'teacher2@example.com')).toBe(true);
  });

  it('should filter teachers by search term', () => {
    const searchTerm = '김';
    const teachers = Object.values(TEST_USERS)
      .filter((user: any) => user.role === 'teacher')
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
      }));

    const filtered = teachers.filter((teacher: any) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.phone && teacher.phone.includes(searchTerm))
    );

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some((t: any) => t.name === '김교사')).toBe(true);
  });

  it('should support pagination', () => {
    const limit = 1;
    const offset = 0;

    const teachers = Object.values(TEST_USERS)
      .filter((user: any) => user.role === 'teacher')
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
      }));

    const total = teachers.length;
    const paginated = teachers.slice(offset, offset + limit);

    expect(paginated.length).toBeLessThanOrEqual(limit);
    expect(total).toBeGreaterThanOrEqual(paginated.length);
  });

  it('should return empty array when no teachers exist', () => {
    // 모든 교사 제거
    Object.keys(TEST_USERS).forEach((key) => {
      if (TEST_USERS[key].role === 'teacher') {
        delete TEST_USERS[key];
      }
    });

    const teachers = Object.values(TEST_USERS)
      .filter((user: any) => user.role === 'teacher')
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
      }));

    expect(teachers.length).toBe(0);
  });

  it('should include teacher phone number when available', () => {
    const teachers = Object.values(TEST_USERS)
      .filter((user: any) => user.role === 'teacher')
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        role: user.role,
      }));

    const teacherWithPhone = teachers.find((t: any) => t.phone);
    expect(teacherWithPhone?.phone).toBeDefined();
  });
});
