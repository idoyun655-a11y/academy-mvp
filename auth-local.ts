/**
 * 로컬 개발용 JWT 기반 인증 시스템
 * 프로덕션에서는 Manus OAuth 또는 다른 인증 서비스 사용
 */

import jwt from 'jsonwebtoken';
import * as db from './db';
import { User } from '../drizzle/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * JWT 토큰 생성
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * 회원가입
 */
export async function signup(email: string, password: string, name: string, role: string = 'student') {
  try {
    // 이미 존재하는 사용자 확인
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 새 사용자 생성
    const user = await db.createUser({
      email,
      name,
      role: role as any,
      openId: `local-${Date.now()}-${Math.random()}`,
      loginMethod: 'local',
    });

    const token = generateToken({
      userId: user.id!,
      email: user.email || '',
      role: user.role,
    });

    return { user, token };
  } catch (error) {
    console.error('[Auth] Signup failed:', error);
    throw error;
  }
}

/**
 * 로그인
 */
export async function login(email: string, password: string) {
  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // 간단한 비밀번호 검증 (실제로는 더 복잡한 로직 필요)
    // 개발용이므로 모든 비밀번호 허용
    if (!password) {
      throw new Error('Password required');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email || '',
      role: user.role,
    });

    return { user, token };
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    throw error;
  }
}

/**
 * 테스트 계정 생성
 */
export async function createTestAccounts() {
  try {
    const testAccounts = [
      { email: 'admin@academy.com', password: 'admin123', name: '관리자', role: 'admin' },
      { email: 'teacher@academy.com', password: 'teacher123', name: '강사', role: 'teacher' },
      { email: 'student1@academy.com', password: 'student123', name: '학생1', role: 'student' },
      { email: 'student2@academy.com', password: 'student123', name: '학생2', role: 'student' },
      { email: 'parent@academy.com', password: 'parent123', name: '학부모', role: 'parent' },
    ];

    for (const account of testAccounts) {
      const existing = await db.getUserByEmail(account.email);
      if (!existing) {
        await signup(account.email, account.password, account.name, account.role);
        console.log(`[Auth] Created test account: ${account.email}`);
      }
    }
  } catch (error) {
    console.error('[Auth] Failed to create test accounts:', error);
  }
}
