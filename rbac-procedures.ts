import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";
import { requireAdmin, requireSuperAdmin, requireTeacher, requireStudentOrParent, requirePermission, type UserRole } from "../rbac";

/**
 * RBAC 기반 tRPC 프로시저
 * 각 역할별로 접근을 제한하는 프로시저를 정의합니다.
 */

/**
 * 슈퍼관리자만 접근 가능
 */
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireSuperAdmin(ctx.user);
  return next({ ctx });
});

/**
 * 관리자(admin 이상) 접근 가능
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireAdmin(ctx.user);
  return next({ ctx });
});

/**
 * 강사(teacher 이상) 접근 가능
 */
export const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireTeacher(ctx.user);
  return next({ ctx });
});

/**
 * 학생 또는 학부모 접근 가능
 */
export const studentOrParentProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireStudentOrParent(ctx.user);
  return next({ ctx });
});

/**
 * 특정 권한을 요구하는 프로시저 생성
 */
export function createPermissionProcedure(permission: string) {
  return protectedProcedure.use(({ ctx, next }) => {
    requirePermission(ctx.user, permission);
    return next({ ctx });
  });
}
