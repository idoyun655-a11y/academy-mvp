import { eq, and, isNull, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, teachers, classes, classSchedules, classEnrollments, attendance, notices, notificationTemplates, notificationLogs, adminLogs, payments, grades, examSchedules, academyEvents, tuitionPayments } from "./drizzle/schema";
import { ENV } from "./env";
import { TEST_USERS } from "./auth";

let _db: ReturnType<typeof drizzle> | null = null;
const memoryUsers = new Map<string, any>();
let nextMemoryUserId = 10000;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'superadmin';
      updateSet.role = 'superadmin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    const memoryUser = memoryUsers.get(openId);
    if (memoryUser) return memoryUser;
    const seeded = Object.values(TEST_USERS).find((user) => user.email === openId);
    if (!seeded) return undefined;
    return {
      id: seeded.id,
      openId: seeded.email,
      email: seeded.email,
      name: seeded.name,
      phone: seeded.phone ?? null,
      role: seeded.role,
      password: seeded.password,
      loginMethod: "email",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      deletedAt: null,
    };
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    const memoryUser = memoryUsers.get(email);
    if (memoryUser) return memoryUser;
    const seeded = Object.values(TEST_USERS).find((user) => user.email === email);
    if (!seeded) return undefined;
    return {
      id: seeded.id,
      openId: seeded.email,
      email: seeded.email,
      name: seeded.name,
      phone: seeded.phone ?? null,
      role: seeded.role,
      password: seeded.password,
      loginMethod: "email",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      deletedAt: null,
    };
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: typeof users.$inferInsert) {
  const db = await getDb();
  if (!db) {
    const created = {
      id: nextMemoryUserId++,
      openId: data.openId,
      email: data.email ?? null,
      name: data.name ?? null,
      phone: data.phone ?? null,
      role: data.role ?? "student",
      password: data.password ?? null,
      loginMethod: data.loginMethod ?? "email",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: null,
      deletedAt: null,
    };
    if (created.openId) memoryUsers.set(created.openId, created);
    if (created.email) memoryUsers.set(created.email, created);
    return created;
  }
  
  // Drizzle insert - password 필드 포함
  const insertData: Record<string, any> = {
    openId: data.openId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    loginMethod: data.loginMethod,
    role: data.role,
  };
  
  // password가 있으면 포함
  if (data.password !== undefined) {
    insertData.password = data.password;
  }
  
  await db.insert(users).values(insertData as any);
  // 생성된 user를 다시 조회하여 반환
  if (insertData.email) {
    return await getUserByEmail(insertData.email);
  }
  if (insertData.openId) {
    return await getUserByOpenId(insertData.openId);
  }
  return undefined;
}

// ============ Student Queries ============
export async function getStudents(limit: number = 50, offset: number = 0, filters?: { name?: string; classId?: number }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  let whereConditions: any[] = [isNull(students.deletedAt)];

  if (filters?.name) {
    whereConditions.push(sql`${students.name} LIKE ${`%${filters.name}%`}`);
  }

  if (filters?.classId) {
    // Join with classEnrollments to filter by class
    const enrolledStudents = await db
      .select({ studentId: classEnrollments.studentId })
      .from(classEnrollments)
      .where(eq(classEnrollments.classId, filters.classId));
    const studentIds = enrolledStudents.map(e => e.studentId);
    if (studentIds.length === 0) return { data: [], total: 0 };
    whereConditions.push(sql`${students.id} IN (${sql.join(studentIds)})`);
  }

  const data = await db.select().from(students).where(and(...whereConditions)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(students).where(isNull(students.deletedAt));
  const total = countResult[0]?.count || 0;

  return { data, total };
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(and(eq(students.id, id), isNull(students.deletedAt)));
  return result.length > 0 ? result[0] : undefined;
}

export async function createStudent(data: typeof students.$inferInsert) {
  const db = await getDb();
  if (!db) {
    return {
      id: nextMemoryUserId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }
  const result = await db.insert(students).values(data);
  return result;
}

export async function updateStudent(id: number, data: Partial<typeof students.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(students).set(data).where(eq(students.id, id));
}

export async function softDeleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(students).set({ deletedAt: new Date() }).where(eq(students.id, id));
}

// ============ Class Queries ============
export async function getClasses(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const data = await db.select().from(classes).where(isNull(classes.deletedAt)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(classes).where(isNull(classes.deletedAt));
  const total = countResult[0]?.count || 0;

  return { data, total };
}

export async function getClassById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(and(eq(classes.id, id), isNull(classes.deletedAt)));
  return result.length > 0 ? result[0] : undefined;
}

export async function createClass(data: typeof classes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(classes).values(data);
}

export async function updateClass(id: number, data: Partial<typeof classes.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(classes).set(data).where(eq(classes.id, id));
}

export async function getClassSchedules(classId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(classSchedules).where(eq(classSchedules.classId, classId));
  return result;
}

export async function createClassSchedule(data: typeof classSchedules.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(classSchedules).values(data);
}

export async function updateClassSchedule(id: number, data: Partial<typeof classSchedules.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(classSchedules).set(data).where(eq(classSchedules.id, id));
}

// ============ Attendance Queries ============
export async function getAttendance(classId: number, date: Date, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const data = await db
    .select({
      id: attendance.id,
      classId: attendance.classId,
      studentId: attendance.studentId,
      studentName: students.name,
      attendanceDate: attendance.attendanceDate,
      status: attendance.status,
      notes: attendance.notes,
      recordedBy: attendance.recordedBy,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    })
    .from(attendance)
    .leftJoin(students, eq(attendance.studentId, students.id))
    .where(and(eq(attendance.classId, classId), sql`${attendance.attendanceDate} BETWEEN ${dateStart} AND ${dateEnd}`))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(attendance)
    .where(and(eq(attendance.classId, classId), sql`${attendance.attendanceDate} BETWEEN ${dateStart} AND ${dateEnd}`));
  const total = countResult[0]?.count || 0;

  return { data, total };
}

export async function recordAttendance(data: typeof attendance.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attendance).values(data);
  return result;
}

export async function updateAttendance(id: number, data: Partial<typeof attendance.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(attendance).set(data).where(eq(attendance.id, id));
  return result;
}

// ============ Notice Queries ============
export async function getNotices(limit: number = 50, offset: number = 0, onlyPublished: boolean = false) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  let whereConditions: any[] = [isNull(notices.deletedAt)];
  if (onlyPublished) {
    whereConditions.push(eq(notices.isPublished, true));
  }

  const data = await db.select().from(notices).where(and(...whereConditions)).orderBy(desc(notices.createdAt)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(notices).where(isNull(notices.deletedAt));
  const total = countResult[0]?.count || 0;

  return { data, total };
}

export async function getNoticeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notices).where(and(eq(notices.id, id), isNull(notices.deletedAt)));
  return result.length > 0 ? result[0] : undefined;
}

export async function createNotice(data: typeof notices.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notices).values(data);
}

export async function updateNotice(id: number, data: Partial<typeof notices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notices).set(data).where(eq(notices.id, id));
}

// ============ Admin Log Queries ============
export async function createAdminLog(data: typeof adminLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(adminLogs).values(data);
}

export async function getAdminLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const data = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(adminLogs);
  const total = countResult[0]?.count || 0;

  return { data, total };
}

// ============ Notification Template Queries ============
export async function getNotificationTemplates(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const data = await db.select().from(notificationTemplates).where(eq(notificationTemplates.isActive, true)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(notificationTemplates).where(eq(notificationTemplates.isActive, true));
  const total = countResult[0]?.count || 0;

  return { data, total };
}

export async function getNotificationTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notificationTemplates).where(eq(notificationTemplates.id, id));
  return result.length > 0 ? result[0] : undefined;
}

export async function createNotificationTemplate(data: typeof notificationTemplates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notificationTemplates).values(data);
}

// ============ Notification Log Queries ============
export async function createNotificationLog(data: typeof notificationLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notificationLogs).values(data);
}

export async function getNotificationLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const data = await db.select().from(notificationLogs).orderBy(desc(notificationLogs.createdAt)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(notificationLogs);
  const total = countResult[0]?.count || 0;

  return { data, total };
}




// ============ Grade Queries ============
export async function getGradesByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  const data = await db.select().from(grades).where(eq(grades.studentId, studentId)).orderBy(desc(grades.createdAt));
  return data;
}

export async function getGradesByStudentAndMonth(studentId: number, mockExamMonth: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(grades).where(eq(grades.studentId, studentId));
  return result.find(g => g.mockExamMonth === mockExamMonth) || undefined;
}

export async function saveGrade(data: typeof grades.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if grade already exists
  if (data.mockExamMonth) {
    const existing = await db.select().from(grades).where(
      and(
        eq(grades.studentId, data.studentId),
        eq(grades.mockExamMonth, data.mockExamMonth)
      )
    );

    if (existing.length > 0) {
      // Update existing
      return db.update(grades).set(data).where(eq(grades.id, existing[0].id));
    }
  }
  // Insert new
  return db.insert(grades).values(data);
}

export async function updateGrade(id: number, data: Partial<typeof grades.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(grades).set(data).where(eq(grades.id, id));
}

export async function getGradeStats(studentId: number) {
  const db = await getDb();
  if (!db) return { mockExams: [], schoolGrades: [] };

  const allGrades = await db.select().from(grades).where(eq(grades.studentId, studentId));
  const mockExams = allGrades.filter(g => g.mockExamMonth !== null).sort((a, b) => {
    const monthOrder = { '3': 1, '6': 2, '9': 3, '10': 4 };
    return (monthOrder[a.mockExamMonth as keyof typeof monthOrder] || 0) - (monthOrder[b.mockExamMonth as keyof typeof monthOrder] || 0);
  });
  const schoolGrades = allGrades.filter(g => g.schoolGrade !== null);

  return { mockExams, schoolGrades };
}


// ============================================
// Calendar Functions
// ============================================

export async function createExamSchedule(data: {
  examName: string;
  examDate: Date;
  examEndDate?: Date;
  subject?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(examSchedules).values(data);
  return result;
}

export async function listExamSchedules() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(examSchedules).orderBy(desc(examSchedules.examDate));
}

export async function updateExamSchedule(id: number, data: Partial<typeof examSchedules.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(examSchedules).set(data).where(eq(examSchedules.id, id));
}

export async function deleteExamSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(examSchedules).where(eq(examSchedules.id, id));
}

export async function createAcademyEvent(data: {
  eventName: string;
  eventDate: Date;
  eventEndDate?: Date;
  eventType: "holiday" | "event" | "notice" | "other";
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(academyEvents).values(data);
}

export async function listAcademyEvents() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(academyEvents).orderBy(desc(academyEvents.eventDate));
}

export async function updateAcademyEvent(id: number, data: Partial<typeof academyEvents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(academyEvents).set(data).where(eq(academyEvents.id, id));
}

export async function deleteAcademyEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(academyEvents).where(eq(academyEvents.id, id));
}

// ============================================
// Tuition Payment Functions
// ============================================

export async function createTuitionPayment(data: {
  studentId: number;
  month: string;
  amount: string;
  paidAmount?: string;
  status?: "pending" | "paid" | "overdue";
  dueDate?: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(tuitionPayments).values([data])
}

export async function getTuitionPaymentsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tuitionPayments).where(eq(tuitionPayments.studentId, studentId)).orderBy(desc(tuitionPayments.month));
}

export async function updateTuitionPayment(id: number, data: Partial<typeof tuitionPayments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(tuitionPayments).set(data).where(eq(tuitionPayments.id, id));
}

export async function getTuitionPaymentsByMonth(month: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tuitionPayments).where(eq(tuitionPayments.month, month));
}

export async function getOverduePayments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tuitionPayments).where(eq(tuitionPayments.status, "overdue"));
}
