import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "./shared/const";
import { sdk } from "./server/_core/sdk";
import { systemRouter } from "./server/_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./server/_core/trpc";
import { z } from "zod";
import { login, generateToken, AuthUser, validatePassword } from "./auth";
import { hashPassword } from "./password";
import { eq, sql, like } from "drizzle-orm";

import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  getClasses,
  getClassById,
  createClass,
  updateClass,
  getClassSchedules,
  createClassSchedule,
  updateClassSchedule,
  getAttendance,
  recordAttendance,
  updateAttendance,
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
  getDb,
  createExamSchedule,
  listExamSchedules,
  updateExamSchedule,
  deleteExamSchedule,
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
import { users } from "./drizzle/schema";

function toAuthUser(user: any): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    name: user.name || user.email || "",
    role: user.role === "superadmin" ? "admin" : (user.role as AuthUser["role"]),
    phone: user.phone || undefined,
  };
}


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
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await login(input.email, input.password);
        if (!result) {
          throw new Error("Invalid credentials");
        }
        
        // Use email as openId for TEST_USERS
        const openId = result.user.email;
        
        // Create session token with proper openId
        // Ensure name is not empty (required by verifySession)
        const userName = result.user.name || result.user.email;
        const sessionToken = await sdk.createSessionToken(openId, {
          name: userName,
        });
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
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
        })
      )
      .mutation(async ({ input }) => {
        const passwordValidation = validatePassword(input.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.message);
        }

        if (input.password !== input.passwordConfirm) {
          throw new Error("Passwords do not match");
        }

        // DB에서 이메일 중복 확인
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Already registered email");
        }

        // DB users 테이블에 생성 (password 해시)
        const hashedPassword = await hashPassword(input.password);
        const dbUser = await createUser({
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          password: hashedPassword,
          role: input.role as 'student' | 'parent',
          openId: input.email, // email을 openId로 사용
          loginMethod: 'email',
        });

        if (!dbUser?.id) {
          throw new Error("Failed to create user");
        }

        // role이 student인 경우 students 테이블에도 생성
        if (input.role === 'student') {
          await createStudent({
            userId: dbUser.id,
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            isActive: true,
          });
        }

        const newUser: AuthUser = {
          id: dbUser.id,
          email: input.email,
          name: input.name,
          role: input.role as 'student' | 'parent',
        };

        return {
          user: newUser,
          token: generateToken(newUser),
          message: "Signup successful",
        };
      }),

    checkEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        // DB에서 이메일 중복 확인
        const dbUser = await getUserByEmail(input.email);
        return { available: !dbUser };
      }),

    registerTeacher: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string()
            .min(8)
            .regex(/[A-Z]/)
            .regex(/[0-9]/),
          name: z.string().min(1),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // DB에서 이메일 중복 확인
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error('Already registered email');
        }

        // DB users 테이블에 교사 생성
        const hashedPassword = await hashPassword(input.password);
        const dbUser = await createUser({
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          password: hashedPassword,
          role: 'teacher',
          openId: input.email,
          loginMethod: 'email',
        });

        if (!dbUser?.id) {
          throw new Error('Failed to create teacher account');
        }

        return {
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
          message: 'Teacher account registered',
        };
      }),

    listTeachers: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        // DB에서 teacher 역할 사용자 조회
        const db = await getDb();
        if (!db) {
          return { data: [], total: 0, limit: input.limit, offset: input.offset };
        }

        // 간단한 조회: role = 'teacher'
        const teachers = await db.select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
        })
          .from(users)
          .where(eq(users.role, 'teacher'))
          .limit(input.limit)
          .offset(input.offset);

        // 총 개수 조회
        const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` })
          .from(users)
          .where(eq(users.role, 'teacher'));

        return {
          data: teachers.map(t => ({
            id: t.id,
            email: t.email || '',
            name: t.name || '',
            phone: t.phone || null,
            role: t.role,
          })),
          total: Number(total) || 0,
          limit: input.limit,
          offset: input.offset,
        };
      }),

    updateTeacher: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const teacher = await getUserByEmail(input.email);
        if (!teacher || teacher.role !== 'teacher') {
          throw new Error('Teacher not found');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const updateData: Record<string, any> = {};

        if (input.name !== undefined) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone || null;

        if (Object.keys(updateData).length > 0) {
          await db.update(users).set(updateData).where(eq(users.email, input.email));
        }

        const updated = await getUserByEmail(input.email);
        return {
          id: updated?.id,
          email: updated?.email || '',
          name: updated?.name || '',
          phone: updated?.phone || null,
          role: updated?.role,
          message: 'Teacher updated successfully',
        };
      }),

    deleteTeacher: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const teacher = await getUserByEmail(input.email);
        if (!teacher || teacher.role !== 'teacher') {
          throw new Error('Teacher not found');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db.delete(users).where(eq(users.email, input.email));

        return {
          success: true,
          message: 'Teacher deleted successfully',
        };
      }),

    listStudents: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getStudents } = await import('./db');
        const result = await getStudents(input.limit, input.offset, input.search ? { name: input.search } : undefined);
        
        return {
          data: result.data.map((student: any) => ({
            id: student.id,
            email: student.email || '',
            name: student.name || '',
            phone: student.phone || null,
            role: 'student',
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
        })
      )
      .mutation(async ({ input }) => {
        const { updateStudent, getStudentById } = await import('./db');
        const student = await getStudentById(input.id);
        
        if (!student) {
          throw new Error('Student not found');
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone || null;

        await updateStudent(input.id, updateData);
        const updated = await getStudentById(input.id);

        return {
          id: updated?.id,
          email: updated?.email || '',
          name: updated?.name || '',
          phone: updated?.phone || null,
          role: 'student',
          message: 'Student updated successfully',
        };
      }),

    deleteStudent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { softDeleteStudent, getStudentById } = await import('./db');
        const student = await getStudentById(input.id);
        
        if (!student) {
          throw new Error('Student not found');
        }

        await softDeleteStudent(input.id);

        return {
          success: true,
          message: 'Student deleted successfully',
        };
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
        })
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
          parentPhone: z.string().optional(),
          parentName: z.string().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createStudent({
          userId: input.userId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
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
          parentPhone: z.string().optional(),
          parentName: z.string().optional(),
          dateOfBirth: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const result = await updateStudent(id, {
          ...updateData,
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
        })
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
        })
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
        return result;
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
        })
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
        })
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
          startTime: z.string().optional(),
          endTime: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const result = await updateClassSchedule(id, updateData);
        console.log("[API] Updated class schedule:", result);
        return result;
      }),
  }),

  // ============ Attendance Management ============
  attendance: router({
    list: publicProcedure
      .input(
        z.object({
          classId: z.number().optional(),
          date: z.string(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        if (!input.classId) {
          return { data: [], total: 0 };
        }
        const date = new Date(input.date);
        const result = await getAttendance(
          input.classId,
          date,
          input.limit,
          input.offset
        );
        return result;
      }),

    record: adminProcedure
      .input(
        z.object({
          studentId: z.number(),
          classId: z.number(),
          attendanceDate: z.string(),
          status: z.enum(["present", "late", "absent", "early_leave"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await recordAttendance({
          studentId: input.studentId,
          classId: input.classId,
          attendanceDate: new Date(input.attendanceDate),
          status: input.status,
          notes: input.notes || null,
          recordedBy: ctx.user?.id || null,
        });
        console.log("[API] Recorded attendance:", result);
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["present", "late", "absent", "early_leave"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await updateAttendance(input.id, {
          status: input.status,
          notes: input.notes || null,
          updatedAt: new Date(),
        });
        console.log("[API] Updated attendance:", result);
        return result;
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
        })
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
        })
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
        })
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
        })
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
        })
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
    send: publicProcedure
      .input(
        z.object({
          studentId: z.number(),
          type: z.string(),
          message: z.string(),
        })
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
        })
      )
      .mutation(async ({ input }) => {
        return await createExamSchedule({
          examName: input.examName,
          examDate: new Date(input.examDate),
          examEndDate: input.examEndDate ? new Date(input.examEndDate) : undefined,
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const data: any = {};
        if (updateData.examName) data.examName = updateData.examName;
        if (updateData.examDate) data.examDate = new Date(updateData.examDate);
        if (updateData.examEndDate) data.examEndDate = new Date(updateData.examEndDate);
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
        })
      )
      .mutation(async ({ input }) => {
        return await createAcademyEvent({
          eventName: input.eventName,
          eventDate: new Date(input.eventDate),
          eventEndDate: input.eventEndDate ? new Date(input.eventEndDate) : undefined,
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const data: any = {};
        if (updateData.eventName) data.eventName = updateData.eventName;
        if (updateData.eventDate) data.eventDate = new Date(updateData.eventDate);
        if (updateData.eventEndDate) data.eventEndDate = new Date(updateData.eventEndDate);
        if (updateData.eventType) data.eventType = updateData.eventType;
        if (updateData.description) data.description = updateData.description;
        return await updateAcademyEvent(id, data);
      }),

    deleteEvent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAcademyEvent(input.id);
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
          dueDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createTuitionPayment({
          studentId: input.studentId,
          month: input.month,
          amount: input.amount,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          notes: input.notes,
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
          paidAmount: z.string().optional(),
          status: z.enum(["pending", "paid", "overdue"]).optional(),
          paidDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        const data: any = {};
        if (updateData.paidAmount) data.paidAmount = updateData.paidAmount;
        if (updateData.status) data.status = updateData.status;
        if (updateData.paidDate) data.paidDate = new Date(updateData.paidDate);
        if (updateData.notes) data.notes = updateData.notes;
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
