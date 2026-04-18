import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "./password";
import { ensurePrimaryAdminUser, getUserByEmail } from "./db";

const isProduction = process.env.NODE_ENV === "production";
const configuredJwtSecret = process.env.JWT_SECRET?.trim();

if (isProduction && !configuredJwtSecret) {
  throw new Error("JWT_SECRET must be set in production.");
}

if (isProduction && !process.env.DEFAULT_ADMIN_PASSWORD?.trim()) {
  throw new Error("DEFAULT_ADMIN_PASSWORD must be set in production.");
}

const JWT_SECRET = configuredJwtSecret || "dev-secret-key-2024";

export const DEFAULT_ADMIN_EMAIL =
  process.env.DEFAULT_ADMIN_EMAIL?.trim() || "etacademy@gmail.com";
export const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD?.trim() || "etacademy!!";
export const DEFAULT_ADMIN_NAME =
  process.env.DEFAULT_ADMIN_NAME?.trim() || "ET영어전문학원 관리자";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student" | "parent";
  phone?: string | null;
}

let ensureDefaultAdminPromise: Promise<void> | null = null;

function mapRole(role: string | null | undefined): AuthUser["role"] {
  if (role === "superadmin") return "admin";
  if (role === "teacher") return "teacher";
  if (role === "parent") return "parent";
  return role === "admin" ? "admin" : "student";
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function ensureDefaultAdminAccount() {
  if (!ensureDefaultAdminPromise) {
    ensureDefaultAdminPromise = (async () => {
      const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      await ensurePrimaryAdminUser({
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        name: DEFAULT_ADMIN_NAME,
        legacyEmails: ["ETenglishacademy@gmail.com"],
      });
    })();
  }

  await ensureDefaultAdminPromise;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string } | null> {
  try {
    await ensureDefaultAdminAccount();

    const dbUser = await getUserByEmail(email);
    if (!dbUser || !dbUser.password) {
      return null;
    }

    const isPasswordValid = await verifyPassword(password, dbUser.password);
    if (!isPasswordValid) {
      return null;
    }

    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email || "",
      name: dbUser.name || dbUser.email || "",
      role: mapRole(dbUser.role),
      phone: dbUser.phone || undefined,
    };

    return {
      user,
      token: generateToken(user),
    };
  } catch (error) {
    console.error("[Auth] Login failed:", error);
    return null;
  }
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (/\s/.test(password)) {
    return { valid: false, message: "비밀번호에는 공백을 사용할 수 없습니다." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: "비밀번호에는 영문자가 최소 1개 필요합니다." };
  }
  return { valid: true };
}

export function authenticateRequest(_req: any) {
  return null;
}
