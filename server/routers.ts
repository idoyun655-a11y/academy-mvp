import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "../shared/const";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  router,
  protectedProcedure,
  adminProcedure,
  studentProcedure,
} from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ensureDefaultAdminAccount,
  login,
  generateToken,
  AuthUser,
  validatePassword,
} from "./auth";
import { hashPassword } from "./password";

import {
  createStudent,
  getStudents,
  getStudentById,
  getStudentByUserId,
  updateStudent,
  softDeleteStudent,
  getClasses,
  getClassById,
  createClass,
  updateClass,
  getClassSchedules,
  createClassSchedule,
  replaceClassSchedules,
  updateClassSchedule,
  getStudentEnrollmentIds,
  syncStudentEnrollments,
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  getGradesByStudent,
  saveGrade,
  updateGrade,
  getGradeStats,
  createUser,
  getUserByEmail,
  listUsersByRole,
  updateUserByEmail,
  deleteUserByEmail,
  createExamSchedule,
  createStudentExamRequest,
  listExamSchedules,
  listStudentExamRequests,
  updateExamSchedule,
  updateStudentExamRequest,
  deleteExamSchedule,
  deleteStudentExamRequest,
  getStudentExamRequestById,
  createAcademyEvent,
  listAcademyEvents,
  updateAcademyEvent,
  deleteAcademyEvent,
  createTuitionPayment,
  getTuitionPaymentsByStudent,
  updateTuitionPayment,
  getTuitionPaymentsByMonth,
  getOverduePayments,
} from "./db";
import {
  ensureAttendancePinAvailable,
  getTodayCommuteFeed,
  getTodayCommuteSummary,
  recordCommuteByPin,
} from "./commute";
import {
  getAdminDashboardSnapshot,
  getLinkedPortalSnapshots,
  getStudentPortalSnapshot,
} from "./portalData";
import {
  bulkUpdateStudentOps,
  getStudentOpsSummary,
  listStudentOps,
} from "./studentOps";
import {
  getSchoolDirectoryByName,
  listSchoolDirectoryStats,
  searchSchoolDirectory,
} from "./schoolDirectory";
import {
  getSmsStatus,
  listNotificationLogs,
  previewSmsAudience,
  sendBulkSmsMessage,
} from "./notificationCenter";

function toAuthUser(user: any): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    name: user.name || user.email || "",
    role:
      user.role === "superadmin" ? "admin" : (user.role as AuthUser["role"]),
    phone: user.phone || undefined,
  };
}

function extractInsertedId(result: any) {
  const rawId =
    result?.id ?? result?.insertId ?? result?.[0]?.id ?? result?.[0]?.insertId;
  const parsedId = Number(rawId ?? 0);
  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
}

const schoolLevelSchema = z.enum(["elementary", "middle", "high", "other"]);
const lifecycleStatusSchema = z.enum(["active", "on_hold", "leaving", "ended"]);
const followUpStatusSchema = z.enum([
  "none",
  "needs_contact",
  "scheduled",
  "done",
]);
const attendancePinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "출석번호는 숫자 4자리여야 합니다.");
const schoolNameSchema = z.string().trim().min(1).max(255);
const schoolDirectoryLevelSchema = z.enum(["elementary", "middle", "high"]);
const studentExamRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);
const studentOpsSavedViewSchema = z.enum([
  "all",
  "unclassified",
  "elementary",
  "middle",
  "high",
  "unassigned_class",
  "overdue",
  "pending_checkout",
  "follow_up",
  "on_hold",
  "leaving",
]);
const studentOpsSortBySchema = z.enum([
  "default",
  "name",
  "gradeLevel",
  "updatedAt",
  "createdAt",
]);
const studentOpsSortOrderSchema = z.enum(["asc", "desc"]);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => toAuthUser(opts.ctx.user)),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await ensureDefaultAdminAccount();

        const result = await login(input.email, input.password);
        if (!result) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        const openId = result.user.email;
        const userName = result.user.name || result.user.email;
        const sessionToken = await sdk.createSessionToken(openId, {
          name: userName,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return {
          user: result.user,
          token: sessionToken,
        };
      }),

    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
          passwordConfirm: z.string(),
          name: z.string().min(1),
          phone: z.string().optional(),
          role: z.enum(["student", "parent"]).default("student"),
          attendancePin: z.string().trim().optional(),
          schoolName: z.string().trim().optional(),
          parentName: z.string().optional(),
          parentPhone: z.string().optional(),
          schoolLevel: schoolLevelSchema.optional(),
          gradeLevel: z.number().int().min(1).max(12).optional(),
          lifecycleStatus: lifecycleStatusSchema.optional(),
          followUpStatus: followUpStatusSchema.optional(),
          followUpDueDate: z.string().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await ensureDefaultAdminAccount();

        const passwordValidation = validatePassword(input.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.message);
        }

        if (input.password !== input.passwordConfirm) {
          throw new Error("비밀번호 확인이 일치하지 않습니다.");
        }

        // DB에서 이메일 중복 확인
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("이미 가입된 이메일입니다.");
        }

        // DB users 테이블에 생성 (password 해시)
        let createdEmail: string | null = null;

        try {
          const hashedPassword = await hashPassword(input.password);
          const dbUser = await createUser({
            email: input.email,
            name: input.name,
            phone: input.phone || null,
            password: hashedPassword,
            role: input.role as "student" | "parent",
            openId: input.email, // email을 openId로 사용
            loginMethod: "email",
          });

          if (!dbUser?.id) {
            throw new Error("계정을 생성하지 못했습니다.");
          }

          // role이 student인 경우 students 테이블에도 생성
          createdEmail = dbUser.email || input.email;

          if (input.role === "student") {
            if (!input.attendancePin) {
              throw new Error("학생 계정은 출석번호 4자리가 필요합니다.");
            }

            if (!input.schoolName?.trim()) {
              throw new Error("학생 계정은 학교명을 입력해야 합니다.");
            }

            const attendancePin = await ensureAttendancePinAvailable(
              input.attendancePin,
            );

            await createStudent({
              userId: dbUser.id,
              name: input.name,
              email: input.email,
              phone: input.phone || null,
              attendancePin,
              schoolName: input.schoolName.trim(),
              parentName: input.parentName || null,
              parentPhone: input.parentPhone || null,
              schoolLevel: input.schoolLevel || "other",
              gradeLevel: input.gradeLevel ?? null,
              lifecycleStatus: input.lifecycleStatus || "active",
              followUpStatus: input.followUpStatus || "none",
              followUpDueDate: input.followUpDueDate
                ? new Date(input.followUpDueDate)
                : null,
              dateOfBirth: input.dateOfBirth
                ? new Date(input.dateOfBirth)
                : null,
              address: input.address || null,
              notes: input.notes || null,
              isActive: true,
            });
          }

          const newUser: AuthUser = {
            id: dbUser.id,
            email: input.email,
            name: input.name,
            role: input.role as "student" | "parent",
          };

          return {
            user: newUser,
            token: generateToken(newUser),
            message: "회원가입이 완료되었습니다.",
          };
        } catch (error) {
          if (createdEmail && input.role === "student") {
            try {
              const createdUser = await getUserByEmail(createdEmail);
              if (createdUser?.role === "student") {
                await deleteUserByEmail(createdEmail);
              }
            } catch (cleanupError) {
              console.error(
                "[Auth] Failed to clean up half-created student account:",
                cleanupError,
              );
            }
          }

          throw error;
        }
      }),

    checkEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        await ensureDefaultAdminAccount();
        // DB에서 이메일 중복 확인
        const dbUser = await getUserByEmail(input.email);
        return { available: !dbUser };
      }),

    resetPassword: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
          passwordConfirm: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const passwordValidation = validatePassword(input.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.message);
        }

        if (input.password !== input.passwordConfirm) {
          throw new Error("비밀번호 확인이 일치하지 않습니다.");
        }

        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new Error("등록된 이메일을 찾을 수 없습니다.");
        }

        const hashedPassword = await hashPassword(input.password);
        await updateUserByEmail(input.email, { password: hashedPassword });

        return {
          success: true,
          message: "비밀번호가 새 값으로 변경되었습니다. 다시 로그인하세요.",
        };
      }),

    registerTeacher: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
          name: z.string().min(1),
          phone: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const passwordValidation = validatePassword(input.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.message);
        }

        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("이미 등록된 이메일입니다.");
        }

        const hashedPassword = await hashPassword(input.password);
        const dbUser = await createUser({
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          password: hashedPassword,
          role: "teacher",
          openId: input.email,
          loginMethod: "email",
        });

        if (!dbUser?.id) {
          throw new Error("강사 계정을 생성하지 못했습니다.");
        }

        return {
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
          message: "강사 계정이 등록되었습니다.",
        };
      }),

    listTeachers: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          search: z.string().optional(),
        }),
      )
      .query(async ({ input }) =>
        listUsersByRole("teacher", input.limit, input.offset, input.search),
      ),

    updateTeacher: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          phone: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const teacher = await getUserByEmail(input.email);
        if (!teacher || teacher.role !== "teacher") {
          throw new Error("강사 계정을 찾을 수 없습니다.");
        }

        await updateUserByEmail(input.email, {
          name: input.name,
          phone: input.phone || null,
        });

        const updated = await getUserByEmail(input.email);
        return {
          id: updated?.id,
          email: updated?.email || "",
          name: updated?.name || "",
          phone: updated?.phone || null,
          role: updated?.role,
          message: "강사 정보가 수정되었습니다.",
        };
      }),

    deleteTeacher: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const teacher = await getUserByEmail(input.email);
        if (!teacher || teacher.role !== "teacher") {
          throw new Error("강사 계정을 찾을 수 없습니다.");
        }

        await deleteUserByEmail(input.email);

        return {
          success: true,
          message: "강사 계정이 삭제되었습니다.",
        };
      }),

    listStudents: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          search: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { getStudents } = await import("./db");
        const result = await getStudents(
          input.limit,
          input.offset,
          input.search ? { name: input.search } : undefined,
        );

        return {
          data: result.data.map((student: any) => ({
            id: student.id,
            email: student.email || "",
            name: student.name || "",
            phone: student.phone || null,
            role: "student",
            createdAt: student.createdAt || new Date(),
          })),
          total: result.total,
          limit: input.limit,
          offset: input.offset,
        };
      }),

    updateStudent: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { updateStudent, getStudentById } = await import("./db");
        const student = await getStudentById(input.id);

        if (!student) {
          throw new Error("Student not found");
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone || null;

        await updateStudent(input.id, updateData);
        const updated = await getStudentById(input.id);

        return {
          id: updated?.id,
          email: updated?.email || "",
          name: updated?.name || "",
          phone: updated?.phone || null,
          role: "student",
          message: "Student updated successfully",
        };
      }),

    deleteStudent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { softDeleteStudent, getStudentById } = await import("./db");
        const student = await getStudentById(input.id);

        if (!student) {
          throw new Error("Student not found");
        }

        await softDeleteStudent(input.id);

        return {
          success: true,
          message: "Student deleted successfully",
        };
      }),
  }),

  studentOps: router({
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          search: z.string().optional(),
          savedView: studentOpsSavedViewSchema.optional(),
          schoolLevel: schoolLevelSchema.optional(),
          gradeLevel: z.number().int().min(1).max(12).optional(),
          classId: z.number().int().positive().optional(),
          lifecycleStatus: lifecycleStatusSchema.optional(),
          followUpStatus: followUpStatusSchema.optional(),
          sortBy: studentOpsSortBySchema.default("default"),
          sortOrder: studentOpsSortOrderSchema.default("asc"),
        }),
      )
      .query(async ({ input }) => {
        return listStudentOps(input);
      }),

    summary: adminProcedure.query(async () => {
      return getStudentOpsSummary();
    }),

    bulkUpdate: adminProcedure
      .input(
        z.object({
          studentIds: z.array(z.number().int().positive()).min(1),
          lifecycleStatus: lifecycleStatusSchema.optional(),
          schoolLevel: schoolLevelSchema.optional(),
          gradeLevel: z.number().int().min(1).max(12).nullable().optional(),
          followUpStatus: followUpStatusSchema.optional(),
          followUpDueDate: z.string().nullable().optional(),
          classIds: z.array(z.number().int().positive()).optional(),
          classSyncMode: z
            .enum(["replace", "add", "remove"])
            .default("replace"),
        }),
      )
      .mutation(async ({ input }) => {
        return bulkUpdateStudentOps({
          ...input,
          followUpDueDate:
            input.followUpDueDate === undefined
              ? undefined
              : input.followUpDueDate
                ? new Date(input.followUpDueDate)
                : null,
        });
      }),
  }),

  schoolDirectory: router({
    search: publicProcedure
      .input(
        z.object({
          query: z.string().default(""),
          schoolLevel: schoolDirectoryLevelSchema.optional(),
        }),
      )
      .query(({ input }) => {
        return {
          items: searchSchoolDirectory(input.query, input.schoolLevel),
          stats: listSchoolDirectoryStats(),
        };
      }),

    getByName: publicProcedure
      .input(
        z.object({
          schoolName: schoolNameSchema,
          schoolLevel: schoolDirectoryLevelSchema.optional(),
        }),
      )
      .query(({ input }) => {
        return getSchoolDirectoryByName(input.schoolName, input.schoolLevel);
      }),
  }),

  portal: router({
    linkedStudents: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "로그인이 필요합니다.",
        });
      }

      if (ctx.user.role !== "student" && ctx.user.role !== "parent") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "학생 또는 부모 계정으로만 접근할 수 있습니다.",
        });
      }

      const snapshots = await getLinkedPortalSnapshots(ctx.user);
      return {
        role: ctx.user.role,
        snapshots,
      };
    }),

    adminSummary: adminProcedure.query(async () => {
      return getAdminDashboardSnapshot();
    }),

    updateMyProfile: studentProcedure
      .input(
        z.object({
          name: z.string().min(1).optional(),
          phone: z.string().optional(),
          parentName: z.string().optional(),
          parentPhone: z.string().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const student = await getStudentByUserId(ctx.user.id);

        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "학생 프로필을 찾을 수 없습니다.",
          });
        }

        const updatePayload: Record<string, unknown> = {};
        if (input.name !== undefined) updatePayload.name = input.name;
        if (input.phone !== undefined) updatePayload.phone = input.phone;
        if (input.parentName !== undefined)
          updatePayload.parentName = input.parentName;
        if (input.parentPhone !== undefined)
          updatePayload.parentPhone = input.parentPhone;
        if (input.address !== undefined) updatePayload.address = input.address;
        if (input.notes !== undefined) updatePayload.notes = input.notes;
        if (input.dateOfBirth !== undefined) {
          updatePayload.dateOfBirth = input.dateOfBirth
            ? new Date(input.dateOfBirth)
            : null;
        }

        await updateStudent(student.id, updatePayload as any);

        return getStudentPortalSnapshot(student.id, ["student"]);
      }),
  }),

  // ============ Student Management ============
  students: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          search: z.string().optional(),
          classId: z.number().optional(),
        }),
      )
      .query(async ({ input }) => {
        return getStudents(input.limit, input.offset, {
          name: input.search,
          classId: input.classId,
        });
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getStudentById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          attendancePin: attendancePinSchema,
          schoolName: schoolNameSchema.optional(),
          parentPhone: z.string().optional(),
          parentName: z.string().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await createStudent({
          userId: input.userId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          attendancePin: input.attendancePin,
          schoolName: input.schoolName?.trim() || null,
          parentPhone: input.parentPhone || null,
          parentName: input.parentName || null,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          address: input.address || null,
          notes: input.notes || null,
          isActive: true,
        });
        console.log("[API] Created student:", result);
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          attendancePin: attendancePinSchema.nullish(),
          schoolName: schoolNameSchema.nullish(),
          parentPhone: z.string().optional(),
          parentName: z.string().optional(),
          schoolLevel: schoolLevelSchema.optional(),
          gradeLevel: z.number().int().min(1).max(12).nullable().optional(),
          lifecycleStatus: lifecycleStatusSchema.optional(),
          followUpStatus: followUpStatusSchema.optional(),
          followUpDueDate: z.string().nullable().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const result = await updateStudent(id, {
          ...updateData,
          attendancePin:
            updateData.attendancePin === undefined
              ? undefined
              : updateData.attendancePin || null,
          schoolName:
            updateData.schoolName === undefined
              ? undefined
              : updateData.schoolName?.trim() || null,
          followUpDueDate:
            updateData.followUpDueDate === undefined
              ? undefined
              : updateData.followUpDueDate
                ? new Date(updateData.followUpDueDate)
                : null,
          dateOfBirth: updateData.dateOfBirth
            ? new Date(updateData.dateOfBirth)
            : undefined,
        });
        console.log("[API] Updated student:", result);
        return result;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await softDeleteStudent(input.id);
        console.log("[API] Deleted student:", input.id);
        return { success: true };
      }),
  }),

  // ============ Class Management ============
  classes: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        }),
      )
      .query(async ({ input }) => {
        return getClasses(input.limit, input.offset);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getClassById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          subject: z.string().min(1),
          teacherId: z.number(),
          capacity: z.number().default(20),
          room: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await createClass({
          name: input.name,
          subject: input.subject,
          teacherId: input.teacherId,
          capacity: input.capacity,
          room: input.room || null,
          description: input.description || null,
          isActive: true,
        });
        console.log("[API] Created class:", result);
        return { id: extractInsertedId(result) };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          subject: z.string().optional(),
          capacity: z.number().optional(),
          room: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const result = await updateClass(id, updateData);
        console.log("[API] Updated class:", result);
        return result;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateClass(input.id, { isActive: false });
        console.log("[API] Deleted class:", input.id);
        return { success: true };
      }),
  }),

  // ============ Class Schedules ============
  classSchedules: router({
    list: publicProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getClassSchedules(input.classId);
      }),

    create: adminProcedure
      .input(
        z.object({
          classId: z.number(),
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string(),
          endTime: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await createClassSchedule({
          classId: input.classId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
        });
        console.log("[API] Created class schedule:", result);
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          classId: z.number().optional(),
          dayOfWeek: z.number().min(0).max(6).optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const result = await updateClassSchedule(id, updateData);
        console.log("[API] Updated class schedule:", result);
        return result;
      }),

    replaceForClass: adminProcedure
      .input(
        z.object({
          classId: z.number(),
          schedules: z
            .array(
              z.object({
                dayOfWeek: z.number().min(0).max(6),
                startTime: z.string(),
                endTime: z.string(),
              }),
            )
            .min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await replaceClassSchedules(
          input.classId,
          input.schedules,
        );
        console.log("[API] Replaced class schedules:", result);
        return result;
      }),
  }),

  classEnrollments: router({
    listByStudent: adminProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return getStudentEnrollmentIds(input.studentId);
      }),

    sync: adminProcedure
      .input(
        z.object({
          studentId: z.number(),
          classIds: z.array(z.number()),
        }),
      )
      .mutation(async ({ input }) => {
        return syncStudentEnrollments(input.studentId, input.classIds);
      }),
  }),

  commute: router({
    todayFeed: adminProcedure.query(async () => {
      return getTodayCommuteFeed();
    }),

    todaySummary: adminProcedure.query(async () => {
      return getTodayCommuteSummary();
    }),

    recordByPin: adminProcedure
      .input(
        z.object({
          attendancePin: attendancePinSchema,
        }),
      )
      .mutation(async ({ input }) => {
        return recordCommuteByPin(input.attendancePin);
      }),
  }),

  // ============ Notices ============
  notices: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          onlyPublished: z.boolean().default(false),
        }),
      )
      .query(async ({ input }) => {
        return getNotices(input.limit, input.offset, input.onlyPublished);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getNoticeById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          targetRoles: z.array(z.string()).default(["student", "parent"]),
          targetClassIds: z.array(z.number()).optional(),
          attachmentUrls: z.array(z.string()).optional(),
          isPublished: z.boolean().default(false),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const result = await createNotice({
          title: input.title,
          content: input.content,
          createdBy: ctx.user?.id || 1,
          targetRoles: input.targetRoles as any,
          targetClassIds: input.targetClassIds as any,
          attachmentUrls: input.attachmentUrls as any,
          isPublished: input.isPublished,
          publishedAt: input.isPublished ? new Date() : null,
        });
        console.log("[API] Created notice:", result);
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          targetRoles: z.array(z.string()).optional(),
          targetClassIds: z.array(z.number()).optional(),
          attachmentUrls: z.array(z.string()).optional(),
          isPublished: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const updatePayload: any = { ...updateData };
        if (updateData.isPublished) {
          updatePayload.publishedAt = new Date();
        }
        const result = await updateNotice(id, updatePayload);
        console.log("[API] Updated notice:", result);
        return result;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateNotice(input.id, { deletedAt: new Date() });
        console.log("[API] Deleted notice:", input.id);
        return { success: true };
      }),
  }),

  // ============ Grades Management ============
  grades: router({
    getByStudent: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        const grades = await getGradesByStudent(input.studentId);
        return grades;
      }),

    save: adminProcedure
      .input(
        z.object({
          studentId: z.number(),
          mockExamMonth: z.enum(["3", "6", "9", "10"]).optional(),
          korean: z.number().min(1).max(9).optional(),
          english: z.number().min(1).max(9).optional(),
          math: z.number().min(1).max(9).optional(),
          science: z.number().min(1).max(9).optional(),
          social: z.number().min(1).max(9).optional(),
          schoolGrade: z.number().min(1).max(9).optional(),
          schoolGradeType: z.enum(["5", "9"]).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await saveGrade(input);
        console.log("[API] Saved grade:", result);
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          korean: z.number().min(1).max(9).optional(),
          english: z.number().min(1).max(9).optional(),
          math: z.number().min(1).max(9).optional(),
          science: z.number().min(1).max(9).optional(),
          social: z.number().min(1).max(9).optional(),
          schoolGrade: z.number().min(1).max(9).optional(),
          schoolGradeType: z.enum(["5", "9"]).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const result = await updateGrade(id, updateData);
        console.log("[API] Updated grade:", result);
        return result;
      }),

    getStats: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        const stats = await getGradeStats(input.studentId);
        return stats;
      }),
  }),

  // ============ Notifications (Mock Provider) ============
  notifications: router({
    smsStatus: adminProcedure.query(async () => {
      return getSmsStatus();
    }),

    previewAudience: adminProcedure
      .input(
        z.object({
          scope: z.enum([
            "selected_students",
            "saved_view",
            "class",
            "all_active",
          ]),
          studentIds: z.array(z.number().int().positive()).default([]),
          savedView: studentOpsSavedViewSchema.optional(),
          classId: z.number().int().positive().optional(),
          recipientKinds: z.array(z.enum(["student", "parent"])).min(1),
        }),
      )
      .query(async ({ input }) => {
        return previewSmsAudience(input);
      }),

    sendBulkSms: adminProcedure
      .input(
        z.object({
          scope: z.enum([
            "selected_students",
            "saved_view",
            "class",
            "all_active",
          ]),
          studentIds: z.array(z.number().int().positive()).default([]),
          savedView: studentOpsSavedViewSchema.optional(),
          classId: z.number().int().positive().optional(),
          recipientKinds: z.array(z.enum(["student", "parent"])).min(1),
          title: z.string().max(120).optional(),
          message: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        return sendBulkSmsMessage(input);
      }),

    logs: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(30),
          offset: z.number().min(0).default(0),
        }),
      )
      .query(async ({ input }) => {
        return listNotificationLogs(input);
      }),

    send: publicProcedure
      .input(
        z.object({
          studentId: z.number(),
          type: z.string(),
          message: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const student = await getStudentById(input.studentId);
        console.log("[NOTIFICATION] 알림톡 발송:");
        console.log(`  - 학생: ${student?.name} (${student?.email})`);
        console.log(`  - 타입: ${input.type}`);
        console.log(`  - 메시지: ${input.message}`);
        console.log(`  - 시간: ${new Date().toISOString()}`);
        return { success: true, sentAt: new Date() };
      }),
  }),

  // ============ Calendar Management ============
  calendar: router({
    // Exam Schedules
    createExam: adminProcedure
      .input(
        z.object({
          examName: z.string().min(1),
          examDate: z.string(),
          examEndDate: z.string().optional(),
          subject: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return await createExamSchedule({
          examName: input.examName,
          examDate: new Date(input.examDate),
          examEndDate: input.examEndDate
            ? new Date(input.examEndDate)
            : undefined,
          subject: input.subject,
          description: input.description,
        });
      }),

    listExams: publicProcedure.query(async () => {
      return await listExamSchedules();
    }),

    updateExam: adminProcedure
      .input(
        z.object({
          id: z.number(),
          examName: z.string().optional(),
          examDate: z.string().optional(),
          examEndDate: z.string().optional(),
          subject: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const data: any = {};
        if (updateData.examName) data.examName = updateData.examName;
        if (updateData.examDate) data.examDate = new Date(updateData.examDate);
        if (updateData.examEndDate)
          data.examEndDate = new Date(updateData.examEndDate);
        if (updateData.subject) data.subject = updateData.subject;
        if (updateData.description) data.description = updateData.description;
        return await updateExamSchedule(id, data);
      }),

    deleteExam: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteExamSchedule(input.id);
      }),

    // Academy Events
    createEvent: adminProcedure
      .input(
        z.object({
          eventName: z.string().min(1),
          eventDate: z.string(),
          eventEndDate: z.string().optional(),
          eventType: z.enum(["holiday", "event", "notice", "other"]),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return await createAcademyEvent({
          eventName: input.eventName,
          eventDate: new Date(input.eventDate),
          eventEndDate: input.eventEndDate
            ? new Date(input.eventEndDate)
            : undefined,
          eventType: input.eventType,
          description: input.description,
        });
      }),

    listEvents: publicProcedure.query(async () => {
      return await listAcademyEvents();
    }),

    updateEvent: adminProcedure
      .input(
        z.object({
          id: z.number(),
          eventName: z.string().optional(),
          eventDate: z.string().optional(),
          eventEndDate: z.string().optional(),
          eventType: z.enum(["holiday", "event", "notice", "other"]).optional(),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const data: any = {};
        if (updateData.eventName) data.eventName = updateData.eventName;
        if (updateData.eventDate)
          data.eventDate = new Date(updateData.eventDate);
        if (updateData.eventEndDate)
          data.eventEndDate = new Date(updateData.eventEndDate);
        if (updateData.eventType) data.eventType = updateData.eventType;
        if (updateData.description) data.description = updateData.description;
        return await updateAcademyEvent(id, data);
      }),

    deleteEvent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAcademyEvent(input.id);
      }),

    listStudentRequests: protectedProcedure
      .input(
        z
          .object({
            status: studentExamRequestStatusSchema.optional(),
            studentId: z.number().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "student") {
          const student = await getStudentByUserId(ctx.user.id);
          if (!student) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "학생 정보를 찾을 수 없습니다.",
            });
          }

          return listStudentExamRequests({ studentId: student.id });
        }

        if (
          ctx.user.role === "admin" ||
          ctx.user.role === "superadmin" ||
          ctx.user.role === "teacher"
        ) {
          return listStudentExamRequests({
            studentId: input?.studentId,
            status: input?.status,
          });
        }

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "해당 계정으로는 학생 시험 요청을 볼 수 없습니다.",
        });
      }),

    createStudentRequest: studentProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(150),
          examDate: z.string(),
          examEndDate: z.string().optional(),
          subject: z.string().trim().optional(),
          description: z.string().trim().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const student = await getStudentByUserId(ctx.user.id);
        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "학생 정보를 찾을 수 없습니다.",
          });
        }

        return createStudentExamRequest({
          studentId: student.id,
          schoolNameSnapshot: student.schoolName ?? null,
          title: input.title.trim(),
          examDate: new Date(input.examDate),
          examEndDate: input.examEndDate ? new Date(input.examEndDate) : null,
          subject: input.subject?.trim() || null,
          description: input.description?.trim() || null,
        });
      }),

    updateStudentRequest: studentProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().trim().min(1).max(150),
          examDate: z.string(),
          examEndDate: z.string().optional(),
          subject: z.string().trim().optional(),
          description: z.string().trim().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const student = await getStudentByUserId(ctx.user.id);
        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "학생 정보를 찾을 수 없습니다.",
          });
        }

        const existing = await getStudentExamRequestById(input.id);
        if (!existing || existing.studentId !== student.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "시험 요청을 찾을 수 없습니다.",
          });
        }
        if (existing.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "승인 대기 상태에서만 수정할 수 있습니다.",
          });
        }

        return updateStudentExamRequest(input.id, {
          schoolNameSnapshot: student.schoolName ?? null,
          title: input.title.trim(),
          examDate: new Date(input.examDate),
          examEndDate: input.examEndDate ? new Date(input.examEndDate) : null,
          subject: input.subject?.trim() || null,
          description: input.description?.trim() || null,
        });
      }),

    deleteStudentRequest: studentProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const student = await getStudentByUserId(ctx.user.id);
        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "학생 정보를 찾을 수 없습니다.",
          });
        }

        const existing = await getStudentExamRequestById(input.id);
        if (!existing || existing.studentId !== student.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "시험 요청을 찾을 수 없습니다.",
          });
        }
        if (existing.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "승인 대기 상태에서만 삭제할 수 있습니다.",
          });
        }

        return deleteStudentExamRequest(input.id);
      }),

    reviewStudentRequest: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["approved", "rejected"]),
          reviewNote: z.string().trim().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getStudentExamRequestById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "시험 요청을 찾을 수 없습니다.",
          });
        }
        if (existing.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "이미 처리된 요청입니다.",
          });
        }

        let linkedExamScheduleId = existing.linkedExamScheduleId ?? null;

        if (input.status === "approved") {
          const createdExam: any = await createExamSchedule({
            examName: existing.title,
            examDate: new Date(existing.examDate),
            examEndDate: existing.examEndDate
              ? new Date(existing.examEndDate)
              : undefined,
            subject: existing.subject || undefined,
            description: existing.description || undefined,
          });

          linkedExamScheduleId =
            extractInsertedId(createdExam) ??
            (typeof createdExam?.id === "number" ? createdExam.id : null);
        }

        return updateStudentExamRequest(existing.id, {
          status: input.status,
          reviewedByUserId: ctx.user.id,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote?.trim() || null,
          linkedExamScheduleId,
        });
      }),
  }),

  // ============ Tuition Payment Management ============
  tuition: router({
    create: adminProcedure
      .input(
        z.object({
          studentId: z.number(),
          month: z.string(),
          amount: z.string(),
          paidAmount: z.string().optional(),
          status: z.enum(["pending", "paid", "overdue"]).optional(),
          dueDate: z.string().optional(),
          paidDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return await createTuitionPayment({
          studentId: input.studentId,
          month: input.month,
          amount: input.amount,
          paidAmount: input.paidAmount,
          status: input.status,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          paidDate: input.paidDate ? new Date(input.paidDate) : undefined,
          notes: input.notes || undefined,
        });
      }),

    getByStudent: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return await getTuitionPaymentsByStudent(input.studentId);
      }),

    updatePayment: adminProcedure
      .input(
        z.object({
          id: z.number(),
          month: z.string().optional(),
          amount: z.string().optional(),
          paidAmount: z.string().optional(),
          status: z.enum(["pending", "paid", "overdue"]).optional(),
          dueDate: z.string().optional(),
          paidDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const data: any = {};

        if (updateData.month !== undefined) data.month = updateData.month;
        if (updateData.amount !== undefined) data.amount = updateData.amount;
        if (updateData.paidAmount !== undefined)
          data.paidAmount = updateData.paidAmount;
        if (updateData.status !== undefined) data.status = updateData.status;
        if (updateData.dueDate !== undefined) {
          data.dueDate = updateData.dueDate
            ? new Date(updateData.dueDate)
            : null;
        }
        if (updateData.paidDate !== undefined) {
          data.paidDate = updateData.paidDate
            ? new Date(updateData.paidDate)
            : null;
        }
        if (updateData.notes !== undefined)
          data.notes = updateData.notes || null;

        return await updateTuitionPayment(id, data);
      }),

    getByMonth: adminProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ input }) => {
        return await getTuitionPaymentsByMonth(input.month);
      }),

    getOverdue: adminProcedure.query(async () => {
      return await getOverduePayments();
    }),
  }),
});

export type AppRouter = typeof appRouter;
