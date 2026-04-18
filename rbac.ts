import { TRPCError } from "@trpc/server";
import type { User } from "../drizzle/schema";

export type UserRole = "superadmin" | "admin" | "teacher" | "student" | "parent";

/**
 * RBAC (Role-Based Access Control) 권한 관리
 * 각 역할별로 접근 가능한 기능을 정의합니다.
 */

export const roleHierarchy: Record<UserRole, number> = {
  superadmin: 5,
  admin: 4,
  teacher: 3,
  student: 2,
  parent: 1,
};

/**
 * 사용자가 특정 역할 이상의 권한을 가지고 있는지 확인
 */
export function hasRole(user: User | null | undefined, requiredRole: UserRole): boolean {
  if (!user) return false;
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * 사용자가 특정 역할 중 하나를 가지고 있는지 확인
 */
export function hasAnyRole(user: User | null | undefined, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * 권한 검증 에러 발생
 */
export function throwUnauthorized(message: string = "권한이 없습니다.") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message,
  });
}

/**
 * 관리자 권한 확인 (admin 이상)
 */
export function requireAdmin(user: User | null | undefined) {
  if (!hasRole(user, "admin")) {
    throwUnauthorized("관리자 권한이 필요합니다.");
  }
}

/**
 * 슈퍼관리자 권한 확인 (superadmin만)
 */
export function requireSuperAdmin(user: User | null | undefined) {
  if (user?.role !== "superadmin") {
    throwUnauthorized("슈퍼관리자 권한이 필요합니다.");
  }
}

/**
 * 강사 이상 권한 확인
 */
export function requireTeacher(user: User | null | undefined) {
  if (!hasRole(user, "teacher")) {
    throwUnauthorized("강사 이상의 권한이 필요합니다.");
  }
}

/**
 * 학생 또는 학부모 권한 확인
 */
export function requireStudentOrParent(user: User | null | undefined) {
  if (!hasAnyRole(user, ["student", "parent"])) {
    throwUnauthorized("학생 또는 학부모 권한이 필요합니다.");
  }
}

/**
 * 역할별 기본 권한 매트릭스
 */
export const rolePermissions: Record<UserRole, string[]> = {
  superadmin: [
    // 모든 권한
    "manage_users",
    "manage_admins",
    "manage_students",
    "manage_classes",
    "manage_teachers",
    "manage_attendance",
    "manage_notices",
    "manage_notifications",
    "view_logs",
    "manage_system",
  ],
  admin: [
    "manage_students",
    "manage_classes",
    "manage_teachers",
    "manage_attendance",
    "manage_notices",
    "manage_notifications",
    "view_logs",
  ],
  teacher: [
    "view_students",
    "manage_attendance",
    "view_notices",
    "create_notices",
    "view_classes",
  ],
  student: [
    "view_own_profile",
    "view_classes",
    "view_attendance",
    "view_notices",
  ],
  parent: [
    "view_child_profile",
    "view_child_classes",
    "view_child_attendance",
    "view_notices",
  ],
};

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
}

/**
 * 권한 확인 (권한이 없으면 에러 발생)
 */
export function requirePermission(user: User | null | undefined, permission: string) {
  if (!hasPermission(user, permission)) {
    throwUnauthorized(`'${permission}' 권한이 필요합니다.`);
  }
}
