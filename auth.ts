import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword } from './password';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-2024';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  phone?: string | null;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

// 관리자 계정 (마이그레이션 목적 - 기존 TEST_USERS 호환성)
export const TEST_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@test.com': {
    id: 1,
    email: 'admin@test.com',
    name: '관리자',
    role: 'admin',
    password: 'admin123',
  },
  'ETenglishacademy@gmail.com': {
    id: 1,
    email: 'ETenglishacademy@gmail.com',
    name: 'ET영어전문학원',
    role: 'admin',
    password: 'ETenglish',
  },
};

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  // DB에서만 인증 (TEST_USERS 폴백 완전 제거)
  try {
    const { getUserByEmail } = await import('./db');
    const dbUser = await getUserByEmail(email);
    
    // 사용자가 없거나 password가 없으면 로그인 실패
    if (!dbUser || !dbUser.password) {
      return null;
    }
    
    // bcrypt 해시와 레거시 평문 테스트 계정을 모두 허용
    const storedPassword = dbUser.password;
    const isBcryptHash =
      typeof storedPassword === "string" &&
      (storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2y$"));
    const isPasswordValid = isBcryptHash
      ? await verifyPassword(password, storedPassword)
      : storedPassword === password;
    if (!isPasswordValid) {
      return null;
    }
    
    // 로그인 성공
    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email || '',
      name: dbUser.name || '',
      role: (dbUser.role as any) || 'student',
      phone: dbUser.phone || undefined,
    };
    
    return {
      user,
      token: generateToken(user),
    };
  } catch (error) {
    console.error('[Auth] DB login check failed:', error);
    return null;
  }
}

// 비밀번호 유효성 검증 (최소 8자, 대문자, 숫자 포함)
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '비밀번호는 대문자를 포함해야 합니다.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '비밀번호는 숫자를 포함해야 합니다.' };
  }
  return { valid: true };
}

export function authenticateRequest(req: any) {
  // This function is now handled by sdk.authenticateRequest
  // Kept for backward compatibility
  return null;
}
