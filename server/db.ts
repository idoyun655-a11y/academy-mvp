import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  academyEvents,
  adminLogs,
  attendance,
  commuteLogs,
  classEnrollments,
  classSchedules,
  classes,
  examSchedules,
  grades,
  type InsertUser,
  notices,
  notificationLogs,
  notificationTemplates,
  students,
  tuitionPayments,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { ensureAttendancePinAvailable, isValidAttendancePin } from "./commute";
import {
  getNextLocalId,
  readLocalStore,
  updateLocalStore,
} from "./localStore";

let _db: ReturnType<typeof drizzle> | null = null;

const DEFAULT_STUDENT_META = {
  schoolLevel: "other",
  gradeLevel: null,
  lifecycleStatus: "active",
  followUpStatus: "none",
  followUpDueDate: null,
} as const;

function shouldUseLocalStore() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  return !databaseUrl || databaseUrl.startsWith("file:");
}

function nowIso() {
  return new Date().toISOString();
}

function toIso(value: Date | string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function isActiveRecord(record: { deletedAt?: string | null } | undefined) {
  return Boolean(record) && !record?.deletedAt;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeStudentRecord<T extends Record<string, any>>(student: T): T {
  return {
    ...student,
    attendancePin: student.attendancePin ?? null,
    schoolLevel: student.schoolLevel ?? DEFAULT_STUDENT_META.schoolLevel,
    gradeLevel: student.gradeLevel ?? DEFAULT_STUDENT_META.gradeLevel,
    lifecycleStatus: student.lifecycleStatus ?? DEFAULT_STUDENT_META.lifecycleStatus,
    followUpStatus: student.followUpStatus ?? DEFAULT_STUDENT_META.followUpStatus,
    followUpDueDate: student.followUpDueDate ?? DEFAULT_STUDENT_META.followUpDueDate,
  };
}

function paginate<T>(items: T[], limit: number, offset: number) {
  return items.slice(offset, offset + limit);
}

function sortByDateDesc<T extends Record<string, any>>(items: T[], key: keyof T) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left[key] ?? 0).getTime();
    const rightTime = new Date(right[key] ?? 0).getTime();
    return rightTime - leftTime;
  });
}

function sameDay(value: Date | string | null | undefined, target: Date) {
  if (!value) return false;
  const date = toDate(value);
  if (!date) return false;
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export async function getDb() {
  if (shouldUseLocalStore()) {
    return null;
  }

  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect, using local store:", error);
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
    await updateLocalStore((store) => {
      const existing = store.users.find(
        (entry) =>
          entry.openId === user.openId ||
          (user.email &&
            entry.email &&
            normalizeEmail(entry.email) === normalizeEmail(user.email)),
      );
      const currentTime = nowIso();

      if (existing) {
        if (user.openId !== undefined) existing.openId = user.openId;
        if (user.email !== undefined) {
          existing.email = user.email ? normalizeEmail(user.email) : null;
        }
        if (user.name !== undefined) existing.name = user.name ?? null;
        if (user.phone !== undefined) existing.phone = user.phone ?? null;
        if (user.password !== undefined) existing.password = user.password ?? "";
        if (user.loginMethod !== undefined) {
          existing.loginMethod = user.loginMethod ?? null;
        }
        if (user.role !== undefined) {
          existing.role = user.role;
        } else if (user.openId === ENV.ownerOpenId) {
          existing.role = "superadmin";
        }
        if (user.lastSignedIn !== undefined) {
          existing.lastSignedIn = toIso(user.lastSignedIn);
        }
        existing.updatedAt = currentTime;
        existing.isActive = true;
        existing.deletedAt = null;
        return;
      }

      store.users.push({
        id: getNextLocalId(store, "users"),
        openId: user.openId,
        email: user.email ? normalizeEmail(user.email) : null,
        name: user.name ?? null,
        phone: user.phone ?? null,
        password: user.password ?? "",
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? (user.openId === ENV.ownerOpenId ? "superadmin" : "student"),
        isActive: true,
        createdAt: currentTime,
        updatedAt: currentTime,
        lastSignedIn: toIso(user.lastSignedIn) ?? currentTime,
        deletedAt: null,
      });
    });
    return;
  }

  const values: InsertUser = {
    openId: user.openId,
  };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod", "phone", "password"] as const;
  fields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized =
      field === "email" && typeof value === "string" ? normalizeEmail(value) : value ?? null;
    values[field] = normalized as any;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "superadmin";
    updateSet.role = "superadmin";
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.users.find((user) => isActiveRecord(user) && user.openId === openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.users.find(
      (user) =>
        isActiveRecord(user) &&
        user.email &&
        normalizeEmail(user.email) === normalized,
    );
  }

  const result = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: typeof users.$inferInsert) {
  const db = await getDb();
  const normalizedEmail = data.email ? normalizeEmail(data.email) : null;

  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const user = {
        id: getNextLocalId(store, "users"),
        openId: data.openId ?? normalizedEmail ?? `local-user-${Date.now()}`,
        email: normalizedEmail,
        name: data.name ?? null,
        phone: data.phone ?? null,
        password: data.password ?? "",
        loginMethod: data.loginMethod ?? "email",
        role: data.role ?? "student",
        isActive: data.isActive ?? true,
        createdAt: currentTime,
        updatedAt: currentTime,
        lastSignedIn: currentTime,
        deletedAt: null,
      };
      store.users.push(user);
      return { ...user };
    });
  }

  const insertData: Record<string, any> = {
    openId: data.openId,
    name: data.name,
    email: normalizedEmail,
    phone: data.phone,
    password: data.password,
    loginMethod: data.loginMethod,
    role: data.role,
    isActive: data.isActive,
  };

  await db.insert(users).values(insertData);

  if (normalizedEmail) {
    return getUserByEmail(normalizedEmail);
  }
  if (insertData.openId) {
    return getUserByOpenId(insertData.openId);
  }
  return undefined;
}

export async function updateUserByEmail(
  email: string,
  data: Partial<typeof users.$inferInsert>,
) {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const user = store.users.find(
        (entry) =>
          isActiveRecord(entry) &&
          entry.email &&
          normalizeEmail(entry.email) === normalized,
      );
      if (!user) return undefined;

      if (data.email !== undefined) user.email = data.email ? normalizeEmail(data.email) : null;
      if (data.openId !== undefined) user.openId = data.openId ?? null;
      if (data.name !== undefined) user.name = data.name ?? null;
      if (data.phone !== undefined) user.phone = data.phone ?? null;
      if (data.password !== undefined) user.password = data.password ?? "";
      if (data.loginMethod !== undefined) user.loginMethod = data.loginMethod ?? null;
      if (data.role !== undefined) user.role = data.role;
      if (data.isActive !== undefined) user.isActive = data.isActive;
      if (data.lastSignedIn !== undefined) user.lastSignedIn = toIso(data.lastSignedIn);
      if (data.deletedAt !== undefined) user.deletedAt = toIso(data.deletedAt);
      user.updatedAt = nowIso();
      return { ...user };
    });
  }

  const updateData: Record<string, any> = {};
  if (data.email !== undefined) updateData.email = data.email ? normalizeEmail(data.email) : null;
  if (data.openId !== undefined) updateData.openId = data.openId ?? null;
  if (data.name !== undefined) updateData.name = data.name ?? null;
  if (data.phone !== undefined) updateData.phone = data.phone ?? null;
  if (data.password !== undefined) updateData.password = data.password ?? "";
  if (data.loginMethod !== undefined) updateData.loginMethod = data.loginMethod ?? null;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.lastSignedIn !== undefined) updateData.lastSignedIn = data.lastSignedIn;
  if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ?? null;

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.email, normalized));
  }

  return getUserByEmail((data.email as string) || normalized);
}

export async function deleteUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const user = store.users.find(
        (entry) =>
          isActiveRecord(entry) &&
          entry.email &&
          normalizeEmail(entry.email) === normalized,
      );
      if (!user) return { success: false };
      user.deletedAt = nowIso();
      user.isActive = false;
      user.updatedAt = nowIso();
      return { success: true };
    });
  }

  await db.delete(users).where(eq(users.email, normalized));
  return { success: true };
}

export async function listUsersByRole(
  role: string,
  limit: number = 50,
  offset: number = 0,
  search?: string,
) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const keyword = search?.trim().toLowerCase();
    const filtered = store.users.filter((user) => {
      if (!isActiveRecord(user) || user.role !== role) return false;
      if (!keyword) return true;
      return [user.name, user.email, user.phone]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .some((value) => value.toLowerCase().includes(keyword));
    });

    return {
      data: paginate(filtered, limit, offset),
      total: filtered.length,
      limit,
      offset,
    };
  }

  const data = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
    })
    .from(users)
    .where(eq(users.role, role as any))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, role as any));

  return {
    data,
    total: Number(total) || 0,
    limit,
    offset,
  };
}

export async function ensurePrimaryAdminUser(config: {
  email: string;
  passwordHash: string;
  name: string;
  legacyEmails?: string[];
}) {
  const email = normalizeEmail(config.email);
  const legacyEmails = (config.legacyEmails ?? []).map(normalizeEmail);
  const current = await getUserByEmail(email);

  if (current) {
    const keepExistingPassword =
      current.role === "admin" || current.role === "superadmin";

    return updateUserByEmail(email, {
      openId: email,
      email,
      name: config.name,
      password:
        keepExistingPassword && current.password
          ? current.password
          : config.passwordHash,
      role: "admin",
      loginMethod: "email",
      isActive: true,
      deletedAt: null as any,
    });
  }

  for (const legacyEmail of legacyEmails) {
    const legacy = await getUserByEmail(legacyEmail);
    if (!legacy) continue;

    const keepExistingPassword =
      legacy.role === "admin" || legacy.role === "superadmin";

    await updateUserByEmail(legacyEmail, {
      openId: email,
      email,
      name: config.name,
      password:
        keepExistingPassword && legacy.password
          ? legacy.password
          : config.passwordHash,
      role: "admin",
      loginMethod: "email",
      isActive: true,
      deletedAt: null as any,
    });
    return getUserByEmail(email);
  }

  return createUser({
    openId: email,
    email,
    name: config.name,
    password: config.passwordHash,
    role: "admin",
    loginMethod: "email",
    isActive: true,
  });
}

export async function getStudents(
  limit: number = 50,
  offset: number = 0,
  filters?: { name?: string; classId?: number },
) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    let filtered = store.students.filter((student) => isActiveRecord(student));

    if (filters?.name) {
      const keyword = filters.name.toLowerCase();
      filtered = filtered.filter((student) =>
        [student.name, student.email, student.phone, student.attendancePin]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .some((value) => value.toLowerCase().includes(keyword)),
      );
    }

    if (filters?.classId) {
      const activeStudentIds = new Set(
        store.classEnrollments
          .filter(
            (entry) =>
              isActiveRecord(entry) &&
              entry.status === "active" &&
              entry.classId === filters.classId,
          )
          .map((entry) => entry.studentId),
      );
      filtered = filtered.filter((student) => activeStudentIds.has(student.id));
    }

    return {
      data: paginate(filtered, limit, offset).map((student) => normalizeStudentRecord(student)),
      total: filtered.length,
    };
  }

  const whereConditions: any[] = [isNull(students.deletedAt)];
  if (filters?.name) {
    whereConditions.push(sql`${students.name} LIKE ${`%${filters.name}%`}`);
  }
  if (filters?.classId) {
    const enrolledStudents = await db
      .select({ studentId: classEnrollments.studentId })
      .from(classEnrollments)
      .where(eq(classEnrollments.classId, filters.classId));
    const studentIds = enrolledStudents.map((row) => row.studentId);
    if (studentIds.length === 0) return { data: [], total: 0 };
    whereConditions.push(sql`${students.id} IN (${sql.join(studentIds)})`);
  }

  const data = await db
    .select()
    .from(students)
    .where(and(...whereConditions))
    .limit(limit)
    .offset(offset);
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(and(...whereConditions));
  return {
    data: data.map((student) => normalizeStudentRecord(student)),
    total: countResult[0]?.count || 0,
  };
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const student = store.students.find((entry) => entry.id === id && isActiveRecord(entry));
    return student ? normalizeStudentRecord(student) : undefined;
  }

  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)));
  return result.length > 0 ? normalizeStudentRecord(result[0]) : undefined;
}

export async function getStudentByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const student = store.students.find(
      (student) => student.userId === userId && isActiveRecord(student),
    );
    return student ? normalizeStudentRecord(student) : undefined;
  }

  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
    .limit(1);
  return result.length > 0 ? normalizeStudentRecord(result[0]) : undefined;
}

export async function createStudent(data: typeof students.$inferInsert) {
  if (data.attendancePin) {
    data.attendancePin = await ensureAttendancePinAvailable(data.attendancePin);
  }

  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const student = {
        id: getNextLocalId(store, "students"),
        userId: data.userId,
        name: data.name,
        email: data.email ? normalizeEmail(data.email) : null,
        phone: data.phone ?? null,
        attendancePin: data.attendancePin ?? null,
        parentPhone: data.parentPhone ?? null,
        parentName: data.parentName ?? null,
        schoolLevel: data.schoolLevel ?? DEFAULT_STUDENT_META.schoolLevel,
        gradeLevel: data.gradeLevel ?? DEFAULT_STUDENT_META.gradeLevel,
        lifecycleStatus: data.lifecycleStatus ?? DEFAULT_STUDENT_META.lifecycleStatus,
        followUpStatus: data.followUpStatus ?? DEFAULT_STUDENT_META.followUpStatus,
        followUpDueDate: toIso(data.followUpDueDate) ?? DEFAULT_STUDENT_META.followUpDueDate,
        dateOfBirth: toIso(data.dateOfBirth) ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        isActive: data.isActive ?? true,
        createdAt: currentTime,
        updatedAt: currentTime,
        deletedAt: null,
      };
      store.students.push(student);
      return normalizeStudentRecord({ ...student });
    });
  }

  await db.insert(students).values(data);
  const result = await db
    .select()
    .from(students)
    .where(eq(students.userId, data.userId))
    .orderBy(desc(students.id))
    .limit(1);
  return result.length > 0 ? normalizeStudentRecord(result[0]) : undefined;
}

export async function updateStudent(id: number, data: Partial<typeof students.$inferInsert>) {
  if (data.attendancePin !== undefined) {
    data.attendancePin = data.attendancePin
      ? await ensureAttendancePinAvailable(data.attendancePin, id)
      : null;
  }

  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const student = store.students.find((entry) => entry.id === id && isActiveRecord(entry));
      if (!student) {
        throw new Error("Student not found");
      }

      if (data.userId !== undefined) student.userId = data.userId;
      if (data.name !== undefined) student.name = data.name;
      if (data.email !== undefined) {
        student.email = data.email ? normalizeEmail(data.email) : null;
      }
      if (data.phone !== undefined) student.phone = data.phone ?? null;
      if (data.attendancePin !== undefined) student.attendancePin = data.attendancePin ?? null;
      if (data.parentPhone !== undefined) student.parentPhone = data.parentPhone ?? null;
      if (data.parentName !== undefined) student.parentName = data.parentName ?? null;
      if (data.schoolLevel !== undefined) {
        student.schoolLevel = data.schoolLevel ?? DEFAULT_STUDENT_META.schoolLevel;
      }
      if (data.gradeLevel !== undefined) student.gradeLevel = data.gradeLevel ?? null;
      if (data.lifecycleStatus !== undefined) {
        student.lifecycleStatus = data.lifecycleStatus ?? DEFAULT_STUDENT_META.lifecycleStatus;
      }
      if (data.followUpStatus !== undefined) {
        student.followUpStatus = data.followUpStatus ?? DEFAULT_STUDENT_META.followUpStatus;
      }
      if (data.followUpDueDate !== undefined) {
        student.followUpDueDate = toIso(data.followUpDueDate);
      }
      if (data.dateOfBirth !== undefined) student.dateOfBirth = toIso(data.dateOfBirth);
      if (data.address !== undefined) student.address = data.address ?? null;
      if (data.notes !== undefined) student.notes = data.notes ?? null;
      if (data.isActive !== undefined) student.isActive = data.isActive;
      student.updatedAt = nowIso();
      return normalizeStudentRecord({ ...student });
    });
  }

  await db.update(students).set(data).where(eq(students.id, id));
  return getStudentById(id);
}

export async function getCommuteLogsByStudent(
  studentId: number,
  limit: number = 60,
) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.commuteLogs
      .filter((entry) => entry.studentId === studentId)
      .sort((left, right) => {
        const leftTime =
          new Date(left.checkOutAt ?? left.checkInAt ?? left.createdAt ?? 0).getTime();
        const rightTime =
          new Date(right.checkOutAt ?? right.checkInAt ?? right.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, limit);
  }

  return db
    .select()
    .from(commuteLogs)
    .where(eq(commuteLogs.studentId, studentId))
    .orderBy(desc(commuteLogs.commuteDate), desc(commuteLogs.checkInAt), desc(commuteLogs.id))
    .limit(limit);
}

export async function softDeleteStudent(id: number) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const student = store.students.find((entry) => entry.id === id && isActiveRecord(entry));
      if (!student) {
        throw new Error("Student not found");
      }
      student.deletedAt = nowIso();
      student.isActive = false;
      student.updatedAt = nowIso();
      return { success: true };
    });
  }

  return db.update(students).set({ deletedAt: new Date() }).where(eq(students.id, id));
}

export async function getClasses(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const active = store.classes.filter((classItem) => isActiveRecord(classItem));
    return {
      data: paginate(active, limit, offset),
      total: active.length,
    };
  }

  const data = await db
    .select()
    .from(classes)
    .where(isNull(classes.deletedAt))
    .limit(limit)
    .offset(offset);
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(classes)
    .where(isNull(classes.deletedAt));
  return { data, total: countResult[0]?.count || 0 };
}

export async function getClassById(id: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.classes.find((classItem) => classItem.id === id && isActiveRecord(classItem));
  }

  const result = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), isNull(classes.deletedAt)));
  return result.length > 0 ? result[0] : undefined;
}

export async function createClass(data: typeof classes.$inferInsert) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const classItem = {
        id: getNextLocalId(store, "classes"),
        name: data.name,
        subject: data.subject,
        teacherId: data.teacherId,
        capacity: data.capacity ?? 20,
        room: data.room ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        createdAt: currentTime,
        updatedAt: currentTime,
        deletedAt: null,
      };
      store.classes.push(classItem);
      return { ...classItem };
    });
  }

  return db.insert(classes).values(data);
}

export async function updateClass(id: number, data: Partial<typeof classes.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const classItem = store.classes.find((entry) => entry.id === id && isActiveRecord(entry));
      if (!classItem) {
        throw new Error("Class not found");
      }
      if (data.name !== undefined) classItem.name = data.name;
      if (data.subject !== undefined) classItem.subject = data.subject;
      if (data.teacherId !== undefined) classItem.teacherId = data.teacherId;
      if (data.capacity !== undefined) classItem.capacity = data.capacity;
      if (data.room !== undefined) classItem.room = data.room ?? null;
      if (data.description !== undefined) classItem.description = data.description ?? null;
      if (data.isActive !== undefined) classItem.isActive = data.isActive;
      classItem.updatedAt = nowIso();
      return { ...classItem };
    });
  }

  return db.update(classes).set(data).where(eq(classes.id, id));
}

export async function getClassSchedules(classId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.classSchedules
      .filter((schedule) => schedule.classId === classId)
      .sort((left, right) => {
        if (left.dayOfWeek !== right.dayOfWeek) return left.dayOfWeek - right.dayOfWeek;
        return String(left.startTime).localeCompare(String(right.startTime));
      });
  }

  return db.select().from(classSchedules).where(eq(classSchedules.classId, classId));
}

export async function createClassSchedule(data: typeof classSchedules.$inferInsert) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const schedule = {
        id: getNextLocalId(store, "classSchedules"),
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        createdAt: currentTime,
        updatedAt: currentTime,
      };
      store.classSchedules.push(schedule);
      return { ...schedule };
    });
  }

  return db.insert(classSchedules).values(data);
}

export async function updateClassSchedule(
  id: number,
  data: Partial<typeof classSchedules.$inferInsert>,
) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const schedule = store.classSchedules.find((entry) => entry.id === id);
      if (!schedule) throw new Error("Class schedule not found");
      if (data.classId !== undefined) schedule.classId = data.classId;
      if (data.dayOfWeek !== undefined) schedule.dayOfWeek = data.dayOfWeek;
      if (data.startTime !== undefined) schedule.startTime = data.startTime;
      if (data.endTime !== undefined) schedule.endTime = data.endTime;
      schedule.updatedAt = nowIso();
      return { ...schedule };
    });
  }

  return db.update(classSchedules).set(data).where(eq(classSchedules.id, id));
}

export async function replaceClassSchedules(
  classId: number,
  schedules: Array<
    Pick<typeof classSchedules.$inferInsert, "dayOfWeek" | "startTime" | "endTime">
  >,
) {
  const normalizedSchedules = Array.from(
    new Map(
      schedules.map((schedule) => [
        schedule.dayOfWeek,
        {
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      ]),
    ).values(),
  ).sort((left, right) => left.dayOfWeek - right.dayOfWeek);

  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      store.classSchedules = store.classSchedules.filter((entry) => entry.classId !== classId);

      for (const schedule of normalizedSchedules) {
        store.classSchedules.push({
          id: getNextLocalId(store, "classSchedules"),
          classId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          createdAt: currentTime,
          updatedAt: currentTime,
        });
      }

      return {
        success: true,
        count: normalizedSchedules.length,
      };
    });
  }

  await db.delete(classSchedules).where(eq(classSchedules.classId, classId));

  if (normalizedSchedules.length > 0) {
    await db.insert(classSchedules).values(
      normalizedSchedules.map((schedule) => ({
        classId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    );
  }

  return {
    success: true,
    count: normalizedSchedules.length,
  };
}

export async function getStudentEnrollmentIds(studentId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.classEnrollments
      .filter(
        (entry) =>
          entry.studentId === studentId &&
          entry.status === "active" &&
          isActiveRecord(entry),
      )
      .map((entry) => entry.classId);
  }

  const rows = await db
    .select({ classId: classEnrollments.classId })
    .from(classEnrollments)
    .where(
      and(
        eq(classEnrollments.studentId, studentId),
        isNull(classEnrollments.deletedAt),
        eq(classEnrollments.status, "active"),
      ),
    );
  return rows.map((row) => row.classId);
}

export async function syncStudentEnrollments(studentId: number, classIds: number[]) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const normalizedClassIds = Array.from(new Set(classIds));
      const existing = store.classEnrollments.filter((entry) => entry.studentId === studentId);

      for (const row of existing) {
        const shouldBeActive = normalizedClassIds.includes(row.classId);
        if (shouldBeActive) {
          row.status = "active";
          row.deletedAt = null;
        } else {
          row.status = "inactive";
          row.deletedAt = currentTime;
        }
        row.updatedAt = currentTime;
      }

      const existingClassIds = new Set(existing.map((row) => row.classId));
      for (const classId of normalizedClassIds) {
        if (!existingClassIds.has(classId)) {
          store.classEnrollments.push({
            id: getNextLocalId(store, "classEnrollments"),
            classId,
            studentId,
            enrolledAt: currentTime,
            status: "active",
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
          });
        }
      }

      return store.classEnrollments
        .filter(
          (entry) =>
            entry.studentId === studentId &&
            entry.status === "active" &&
            isActiveRecord(entry),
        )
        .map((entry) => entry.classId);
    });
  }

  const normalizedClassIds = Array.from(new Set(classIds));
  const existing = await db
    .select({
      id: classEnrollments.id,
      classId: classEnrollments.classId,
      deletedAt: classEnrollments.deletedAt,
      status: classEnrollments.status,
    })
    .from(classEnrollments)
    .where(eq(classEnrollments.studentId, studentId));

  for (const row of existing) {
    const shouldBeActive = normalizedClassIds.includes(row.classId);

    if (shouldBeActive) {
      await db
        .update(classEnrollments)
        .set({ status: "active", deletedAt: null })
        .where(eq(classEnrollments.id, row.id));
    } else if (!row.deletedAt) {
      await db
        .update(classEnrollments)
        .set({ status: "inactive", deletedAt: new Date() })
        .where(eq(classEnrollments.id, row.id));
    }
  }

  const existingClassIdSet = new Set(existing.map((row) => row.classId));
  for (const classId of normalizedClassIds) {
    if (!existingClassIdSet.has(classId)) {
      await db.insert(classEnrollments).values({
        studentId,
        classId,
        status: "active",
      });
    }
  }

  return getStudentEnrollmentIds(studentId);
}

export async function getAttendance(
  classId: number,
  date: Date,
  limit: number = 50,
  offset: number = 0,
) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const items = store.attendance
      .filter((record) => record.classId === classId && sameDay(record.attendanceDate, date))
      .map((record) => ({
        ...record,
        studentName:
          store.students.find((student) => student.id === record.studentId && isActiveRecord(student))
            ?.name ?? null,
      }));

    return {
      data: paginate(sortByDateDesc(items, "attendanceDate"), limit, offset),
      total: items.length,
    };
  }

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
    .where(
      and(
        eq(attendance.classId, classId),
        sql`${attendance.attendanceDate} BETWEEN ${dateStart} AND ${dateEnd}`,
      ),
    )
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(attendance)
    .where(
      and(
        eq(attendance.classId, classId),
        sql`${attendance.attendanceDate} BETWEEN ${dateStart} AND ${dateEnd}`,
      ),
    );

  return { data, total: countResult[0]?.count || 0 };
}

export async function recordAttendance(data: typeof attendance.$inferInsert) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const existing = store.attendance.find(
        (record) =>
          record.studentId === data.studentId &&
          record.classId === data.classId &&
          sameDay(record.attendanceDate, data.attendanceDate),
      );

      if (existing) {
        existing.attendanceDate = toIso(data.attendanceDate);
        existing.status = data.status;
        existing.notes = data.notes ?? null;
        existing.recordedBy = data.recordedBy ?? null;
        existing.updatedAt = currentTime;
        return { ...existing };
      }

      const record = {
        id: getNextLocalId(store, "attendance"),
        classId: data.classId,
        studentId: data.studentId,
        attendanceDate: toIso(data.attendanceDate),
        status: data.status,
        notes: data.notes ?? null,
        recordedBy: data.recordedBy ?? null,
        createdAt: currentTime,
        updatedAt: currentTime,
      };
      store.attendance.push(record);
      return { ...record };
    });
  }

  const dateStart = new Date(data.attendanceDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(data.attendanceDate);
  dateEnd.setHours(23, 59, 59, 999);

  const existing = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, data.studentId),
        eq(attendance.classId, data.classId),
        sql`${attendance.attendanceDate} BETWEEN ${dateStart} AND ${dateEnd}`,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(attendance)
      .set({
        attendanceDate: data.attendanceDate,
        status: data.status,
        notes: data.notes ?? null,
        recordedBy: data.recordedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(attendance.id, existing[0].id));
  }

  return db.insert(attendance).values(data);
}

export async function updateAttendance(id: number, data: Partial<typeof attendance.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const record = store.attendance.find((entry) => entry.id === id);
      if (!record) throw new Error("Attendance not found");
      if (data.classId !== undefined) record.classId = data.classId;
      if (data.studentId !== undefined) record.studentId = data.studentId;
      if (data.attendanceDate !== undefined) record.attendanceDate = toIso(data.attendanceDate);
      if (data.status !== undefined) record.status = data.status;
      if (data.notes !== undefined) record.notes = data.notes ?? null;
      if (data.recordedBy !== undefined) record.recordedBy = data.recordedBy ?? null;
      record.updatedAt = nowIso();
      return { ...record };
    });
  }

  return db.update(attendance).set(data).where(eq(attendance.id, id));
}

export async function getNotices(
  limit: number = 50,
  offset: number = 0,
  onlyPublished: boolean = false,
) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const filtered = sortByDateDesc(
      store.notices.filter(
        (notice) => isActiveRecord(notice) && (!onlyPublished || notice.isPublished),
      ),
      "createdAt",
    );

    return {
      data: paginate(filtered, limit, offset),
      total: filtered.length,
    };
  }

  const whereConditions: any[] = [isNull(notices.deletedAt)];
  if (onlyPublished) {
    whereConditions.push(eq(notices.isPublished, true));
  }

  const data = await db
    .select()
    .from(notices)
    .where(and(...whereConditions))
    .orderBy(desc(notices.createdAt))
    .limit(limit)
    .offset(offset);
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notices)
    .where(isNull(notices.deletedAt));

  return { data, total: countResult[0]?.count || 0 };
}

export async function getNoticeById(id: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.notices.find((notice) => notice.id === id && isActiveRecord(notice));
  }

  const result = await db
    .select()
    .from(notices)
    .where(and(eq(notices.id, id), isNull(notices.deletedAt)));
  return result.length > 0 ? result[0] : undefined;
}

export async function createNotice(data: typeof notices.$inferInsert) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const notice = {
        id: getNextLocalId(store, "notices"),
        title: data.title,
        content: data.content,
        createdBy: data.createdBy,
        targetRoles: data.targetRoles ?? [],
        targetClassIds: data.targetClassIds ?? null,
        attachmentUrls: data.attachmentUrls ?? null,
        isPublished: data.isPublished ?? false,
        publishedAt: toIso(data.publishedAt) ?? null,
        createdAt: currentTime,
        updatedAt: currentTime,
        deletedAt: null,
      };
      store.notices.push(notice);
      return { ...notice };
    });
  }

  return db.insert(notices).values(data);
}

export async function updateNotice(id: number, data: Partial<typeof notices.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const notice = store.notices.find((entry) => entry.id === id && isActiveRecord(entry));
      if (!notice) throw new Error("Notice not found");
      if (data.title !== undefined) notice.title = data.title;
      if (data.content !== undefined) notice.content = data.content;
      if (data.createdBy !== undefined) notice.createdBy = data.createdBy;
      if (data.targetRoles !== undefined) notice.targetRoles = data.targetRoles;
      if (data.targetClassIds !== undefined) notice.targetClassIds = data.targetClassIds;
      if (data.attachmentUrls !== undefined) notice.attachmentUrls = data.attachmentUrls;
      if (data.isPublished !== undefined) notice.isPublished = data.isPublished;
      if (data.publishedAt !== undefined) notice.publishedAt = toIso(data.publishedAt);
      if ((data as any).deletedAt !== undefined) notice.deletedAt = toIso((data as any).deletedAt);
      notice.updatedAt = nowIso();
      return { ...notice };
    });
  }

  return db.update(notices).set(data).where(eq(notices.id, id));
}

export async function getGradesByStudent(studentId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return sortByDateDesc(
      store.grades.filter((grade) => grade.studentId === studentId),
      "createdAt",
    );
  }

  return db
    .select()
    .from(grades)
    .where(eq(grades.studentId, studentId))
    .orderBy(desc(grades.createdAt));
}

export async function saveGrade(data: typeof grades.$inferInsert) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const existing = data.mockExamMonth
        ? store.grades.find(
            (grade) =>
              grade.studentId === data.studentId && grade.mockExamMonth === data.mockExamMonth,
          )
        : undefined;

      if (existing) {
        Object.assign(existing, data);
        existing.updatedAt = currentTime;
        return { ...existing };
      }

      const grade = {
        id: getNextLocalId(store, "grades"),
        studentId: data.studentId,
        mockExamMonth: data.mockExamMonth ?? null,
        korean: data.korean ?? null,
        english: data.english ?? null,
        math: data.math ?? null,
        science: data.science ?? null,
        social: data.social ?? null,
        schoolGrade: data.schoolGrade ?? null,
        schoolGradeType: data.schoolGradeType ?? null,
        createdAt: currentTime,
        updatedAt: currentTime,
      };
      store.grades.push(grade);
      return { ...grade };
    });
  }

  if (data.mockExamMonth) {
    const existing = await db
      .select()
      .from(grades)
      .where(
        and(eq(grades.studentId, data.studentId), eq(grades.mockExamMonth, data.mockExamMonth)),
      );

    if (existing.length > 0) {
      return db.update(grades).set(data).where(eq(grades.id, existing[0].id));
    }
  }

  return db.insert(grades).values(data);
}

export async function updateGrade(id: number, data: Partial<typeof grades.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const grade = store.grades.find((entry) => entry.id === id);
      if (!grade) throw new Error("Grade not found");
      Object.assign(grade, data);
      grade.updatedAt = nowIso();
      return { ...grade };
    });
  }

  return db.update(grades).set(data).where(eq(grades.id, id));
}

export async function getGradeStats(studentId: number) {
  const allGrades = await getGradesByStudent(studentId);
  const mockExams = allGrades
    .filter((grade) => grade.mockExamMonth !== null)
    .sort((left, right) => {
      const monthOrder = { "3": 1, "6": 2, "9": 3, "10": 4 };
      return (
        (monthOrder[left.mockExamMonth as keyof typeof monthOrder] || 0) -
        (monthOrder[right.mockExamMonth as keyof typeof monthOrder] || 0)
      );
    });
  const schoolGrades = allGrades.filter((grade) => grade.schoolGrade !== null);
  return { mockExams, schoolGrades };
}

export async function createExamSchedule(data: {
  examName: string;
  examDate: Date;
  examEndDate?: Date;
  subject?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const schedule = {
        id: getNextLocalId(store, "examSchedules"),
        examName: data.examName,
        examDate: toIso(data.examDate),
        examEndDate: toIso(data.examEndDate) ?? null,
        subject: data.subject ?? null,
        description: data.description ?? null,
        createdAt: currentTime,
        updatedAt: currentTime,
      };
      store.examSchedules.push(schedule);
      return { ...schedule };
    });
  }

  return db.insert(examSchedules).values(data);
}

export async function listExamSchedules() {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return sortByDateDesc(store.examSchedules, "examDate");
  }

  return db.select().from(examSchedules).orderBy(desc(examSchedules.examDate));
}

export async function updateExamSchedule(id: number, data: Partial<typeof examSchedules.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const schedule = store.examSchedules.find((entry) => entry.id === id);
      if (!schedule) throw new Error("Exam schedule not found");
      if (data.examName !== undefined) schedule.examName = data.examName;
      if (data.examDate !== undefined) schedule.examDate = toIso(data.examDate);
      if (data.examEndDate !== undefined) schedule.examEndDate = toIso(data.examEndDate);
      if (data.subject !== undefined) schedule.subject = data.subject ?? null;
      if (data.description !== undefined) schedule.description = data.description ?? null;
      schedule.updatedAt = nowIso();
      return { ...schedule };
    });
  }

  return db.update(examSchedules).set(data).where(eq(examSchedules.id, id));
}

export async function deleteExamSchedule(id: number) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      store.examSchedules = store.examSchedules.filter((entry) => entry.id !== id);
      return { success: true };
    });
  }

  return db.delete(examSchedules).where(eq(examSchedules.id, id));
}

export async function createAcademyEvent(data: {
  eventName: string;
  eventDate: Date;
  eventEndDate?: Date;
  eventType: "holiday" | "event" | "notice" | "other";
  description?: string;
}) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const event = {
        id: getNextLocalId(store, "academyEvents"),
        eventName: data.eventName,
        eventDate: toIso(data.eventDate),
        eventEndDate: toIso(data.eventEndDate) ?? null,
        eventType: data.eventType,
        description: data.description ?? null,
        createdAt: currentTime,
        updatedAt: currentTime,
      };
      store.academyEvents.push(event);
      return { ...event };
    });
  }

  return db.insert(academyEvents).values(data);
}

export async function listAcademyEvents() {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return sortByDateDesc(store.academyEvents, "eventDate");
  }

  return db.select().from(academyEvents).orderBy(desc(academyEvents.eventDate));
}

export async function updateAcademyEvent(id: number, data: Partial<typeof academyEvents.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const event = store.academyEvents.find((entry) => entry.id === id);
      if (!event) throw new Error("Academy event not found");
      if (data.eventName !== undefined) event.eventName = data.eventName;
      if (data.eventDate !== undefined) event.eventDate = toIso(data.eventDate);
      if (data.eventEndDate !== undefined) event.eventEndDate = toIso(data.eventEndDate);
      if (data.eventType !== undefined) event.eventType = data.eventType;
      if (data.description !== undefined) event.description = data.description ?? null;
      event.updatedAt = nowIso();
      return { ...event };
    });
  }

  return db.update(academyEvents).set(data).where(eq(academyEvents.id, id));
}

export async function deleteAcademyEvent(id: number) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      store.academyEvents = store.academyEvents.filter((entry) => entry.id !== id);
      return { success: true };
    });
  }

  return db.delete(academyEvents).where(eq(academyEvents.id, id));
}

export async function createTuitionPayment(data: {
  studentId: number;
  month: string;
  amount: string;
  paidAmount?: string;
  status?: "pending" | "paid" | "overdue";
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const currentTime = nowIso();
      const existing = store.tuitionPayments.find(
        (payment) => payment.studentId === data.studentId && payment.month === data.month,
      );

      if (existing) {
        existing.amount = data.amount;
        existing.paidAmount = data.paidAmount ?? existing.paidAmount ?? "0";
        existing.status = data.status ?? existing.status ?? "pending";
        existing.dueDate = toIso(data.dueDate) ?? null;
        existing.paidDate = toIso(data.paidDate) ?? null;
        existing.notes = data.notes ?? null;
        existing.updatedAt = currentTime;
        return { ...existing };
      }

      const payment = {
        id: getNextLocalId(store, "tuitionPayments"),
        studentId: data.studentId,
        month: data.month,
        amount: data.amount,
        paidAmount: data.paidAmount ?? "0",
        status: data.status ?? "pending",
        dueDate: toIso(data.dueDate) ?? null,
        paidDate: toIso(data.paidDate) ?? null,
        notes: data.notes ?? null,
        createdAt: currentTime,
        updatedAt: currentTime,
      };
      store.tuitionPayments.push(payment);
      return { ...payment };
    });
  }

  const existing = await db
    .select({ id: tuitionPayments.id })
    .from(tuitionPayments)
    .where(and(eq(tuitionPayments.studentId, data.studentId), eq(tuitionPayments.month, data.month)))
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(tuitionPayments)
      .set({
        amount: data.amount,
        paidAmount: data.paidAmount,
        status: data.status,
        dueDate: data.dueDate,
        paidDate: data.paidDate,
        notes: data.notes,
      })
      .where(eq(tuitionPayments.id, existing[0].id));
  }

  return db.insert(tuitionPayments).values([data]);
}

export async function getTuitionPaymentsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return sortByDateDesc(
      store.tuitionPayments.filter((payment) => payment.studentId === studentId),
      "month",
    );
  }

  return db
    .select()
    .from(tuitionPayments)
    .where(eq(tuitionPayments.studentId, studentId))
    .orderBy(desc(tuitionPayments.month));
}

export async function updateTuitionPayment(
  id: number,
  data: Partial<typeof tuitionPayments.$inferInsert>,
) {
  const db = await getDb();
  if (!db) {
    return updateLocalStore((store) => {
      const payment = store.tuitionPayments.find((entry) => entry.id === id);
      if (!payment) throw new Error("Tuition payment not found");
      if (data.studentId !== undefined) payment.studentId = data.studentId;
      if (data.month !== undefined) payment.month = data.month;
      if (data.amount !== undefined) payment.amount = data.amount;
      if (data.paidAmount !== undefined) payment.paidAmount = data.paidAmount;
      if (data.status !== undefined) payment.status = data.status;
      if (data.dueDate !== undefined) payment.dueDate = toIso(data.dueDate);
      if (data.paidDate !== undefined) payment.paidDate = toIso(data.paidDate);
      if (data.notes !== undefined) payment.notes = data.notes ?? null;
      payment.updatedAt = nowIso();
      return { ...payment };
    });
  }

  return db.update(tuitionPayments).set(data).where(eq(tuitionPayments.id, id));
}

export async function getTuitionPaymentsByMonth(month: string) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.tuitionPayments.filter((payment) => payment.month === month);
  }

  return db.select().from(tuitionPayments).where(eq(tuitionPayments.month, month));
}

export async function getOverduePayments() {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.tuitionPayments.filter((payment) => payment.status === "overdue");
  }

  return db.select().from(tuitionPayments).where(eq(tuitionPayments.status, "overdue"));
}
