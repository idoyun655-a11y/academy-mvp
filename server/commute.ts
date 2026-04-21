import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { commuteLogs, students } from "../drizzle/schema";
import { getDb } from "./db";
import { getNextLocalId, readLocalStore, updateLocalStore } from "./localStore";

type ActiveStudentRecord = {
  id: number;
  name: string;
  attendancePin?: string | null;
  isActive?: boolean | null;
  deletedAt?: string | Date | null;
};

type CommuteLogRecord = {
  id: number;
  studentId: number;
  commuteDate: string;
  checkInAt?: string | Date | null;
  checkOutAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

function normalizeAttendancePin(attendancePin: string) {
  return attendancePin.trim();
}

export function isValidAttendancePin(attendancePin?: string | null) {
  return /^\d{4}$/.test(attendancePin ?? "");
}

function isActiveStudent(student: ActiveStudentRecord | undefined) {
  return Boolean(student) && !student?.deletedAt && student?.isActive !== false;
}

function toDate(value?: string | Date | null) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortLogsByLatest(left: CommuteLogRecord, right: CommuteLogRecord) {
  const leftTime =
    toDate(left.checkOutAt)?.getTime() ??
    toDate(left.checkInAt)?.getTime() ??
    toDate(left.createdAt)?.getTime() ??
    0;
  const rightTime =
    toDate(right.checkOutAt)?.getTime() ??
    toDate(right.checkInAt)?.getTime() ??
    toDate(right.createdAt)?.getTime() ??
    0;
  return rightTime - leftTime;
}

function buildFeedEntries(
  logs: Array<
    CommuteLogRecord & {
      studentName?: string | null;
      attendancePin?: string | null;
    }
  >,
) {
  return logs
    .flatMap((log) => {
      const items: Array<{
        id: string;
        logId: number;
        studentId: number;
        studentName: string;
        attendancePin: string | null;
        eventType: "check_in" | "check_out";
        eventAt: string | Date;
        commuteDate: string;
        isOnSite: boolean;
      }> = [];

      if (log.checkInAt) {
        items.push({
          id: `${log.id}-check-in`,
          logId: log.id,
          studentId: log.studentId,
          studentName: log.studentName || "학생",
          attendancePin: log.attendancePin ?? null,
          eventType: "check_in",
          eventAt: log.checkInAt,
          commuteDate: log.commuteDate,
          isOnSite: !log.checkOutAt,
        });
      }

      if (log.checkOutAt) {
        items.push({
          id: `${log.id}-check-out`,
          logId: log.id,
          studentId: log.studentId,
          studentName: log.studentName || "학생",
          attendancePin: log.attendancePin ?? null,
          eventType: "check_out",
          eventAt: log.checkOutAt,
          commuteDate: log.commuteDate,
          isOnSite: false,
        });
      }

      return items;
    })
    .sort((left, right) => {
      const leftTime = toDate(left.eventAt)?.getTime() ?? 0;
      const rightTime = toDate(right.eventAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    });
}

export function getCommuteTodayStatus(
  logs: Array<Pick<CommuteLogRecord, "commuteDate" | "checkInAt" | "checkOutAt">>,
) {
  const todayKey = formatDateKey(new Date());
  const todayLog = logs.find((log) => log.commuteDate === todayKey);

  if (!todayLog?.checkInAt) {
    return "not_arrived" as const;
  }

  if (todayLog.checkOutAt) {
    return "checked_out" as const;
  }

  return "checked_in" as const;
}

export async function getStudentByAttendancePin(attendancePin: string) {
  const normalizedPin = normalizeAttendancePin(attendancePin);
  if (!isValidAttendancePin(normalizedPin)) {
    return undefined;
  }

  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.students.find(
      (student) =>
        isActiveStudent(student) &&
        normalizeAttendancePin(student.attendancePin ?? "") === normalizedPin,
    );
  }

  const [student] = await db
    .select()
    .from(students)
    .where(
      and(eq(students.attendancePin, normalizedPin), isNull(students.deletedAt)),
    )
    .limit(1);
  return student;
}

export async function ensureAttendancePinAvailable(
  attendancePin: string,
  excludeStudentId?: number,
) {
  const normalizedPin = normalizeAttendancePin(attendancePin);
  if (!isValidAttendancePin(normalizedPin)) {
    throw new Error("출석번호는 숫자 4자리여야 합니다.");
  }

  const existing = await getStudentByAttendancePin(normalizedPin);
  if (existing && existing.id !== excludeStudentId) {
    throw new Error("이미 사용 중인 출석번호입니다.");
  }

  return normalizedPin;
}

export async function listCommuteLogsByStudent(studentId: number, limit = 60) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.commuteLogs
      .filter((log) => log.studentId === studentId)
      .sort(sortLogsByLatest)
      .slice(0, limit);
  }

  return db
    .select()
    .from(commuteLogs)
    .where(eq(commuteLogs.studentId, studentId))
    .orderBy(desc(commuteLogs.commuteDate), desc(commuteLogs.checkInAt), desc(commuteLogs.id))
    .limit(limit);
}

export async function listTodayCommuteLogs() {
  const todayKey = formatDateKey(new Date());
  const db = await getDb();

  if (!db) {
    const store = await readLocalStore();
    return store.commuteLogs
      .filter((log) => log.commuteDate === todayKey)
      .map((log) => {
        const student = store.students.find((item) => item.id === log.studentId);
        return {
          ...log,
          studentName: student?.name ?? "학생",
          attendancePin: student?.attendancePin ?? null,
        };
      })
      .sort(sortLogsByLatest);
  }

  return db
    .select({
      id: commuteLogs.id,
      studentId: commuteLogs.studentId,
      commuteDate: commuteLogs.commuteDate,
      checkInAt: commuteLogs.checkInAt,
      checkOutAt: commuteLogs.checkOutAt,
      createdAt: commuteLogs.createdAt,
      updatedAt: commuteLogs.updatedAt,
      studentName: students.name,
      attendancePin: students.attendancePin,
    })
    .from(commuteLogs)
    .innerJoin(students, eq(students.id, commuteLogs.studentId))
    .where(
      and(eq(commuteLogs.commuteDate, todayKey), isNull(students.deletedAt)),
    )
    .orderBy(desc(commuteLogs.checkInAt), desc(commuteLogs.id));
}

export async function getTodayCommuteFeed(limit = 80) {
  const logs = await listTodayCommuteLogs();
  return buildFeedEntries(logs).slice(0, limit);
}

export async function getTodayCommuteSummary() {
  const logs = await listTodayCommuteLogs();
  const todayCheckInCount = logs.filter((log) => Boolean(log.checkInAt)).length;
  const todayCheckOutCount = logs.filter((log) => Boolean(log.checkOutAt)).length;
  const onSiteCount = logs.filter((log) => Boolean(log.checkInAt) && !log.checkOutAt).length;

  return {
    todayCheckInCount,
    todayCheckOutCount,
    onSiteCount,
    pendingCheckoutCount: onSiteCount,
  };
}

export async function recordCommuteByPin(attendancePin: string) {
  const normalizedPin = normalizeAttendancePin(attendancePin);
  if (!isValidAttendancePin(normalizedPin)) {
    throw new Error("출석번호는 숫자 4자리여야 합니다.");
  }

  const student = await getStudentByAttendancePin(normalizedPin);
  if (!student || !isActiveStudent(student)) {
    throw new Error("등록되지 않은 출석번호입니다.");
  }

  const now = new Date();
  const todayKey = formatDateKey(now);
  const nowIso = now.toISOString();
  const db = await getDb();

  if (!db) {
    return updateLocalStore((store) => {
      const existing = store.commuteLogs.find(
        (log) => log.studentId === student.id && log.commuteDate === todayKey,
      );

      if (!existing) {
        const created = {
          id: getNextLocalId(store, "commuteLogs"),
          studentId: student.id,
          commuteDate: todayKey,
          checkInAt: nowIso,
          checkOutAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        store.commuteLogs.push(created);
        return {
          success: true,
          eventType: "check_in" as const,
          studentId: student.id,
          studentName: student.name,
          attendancePin: normalizedPin,
          eventAt: created.checkInAt,
          message: `${student.name} 등원 처리`,
        };
      }

      if (!existing.checkOutAt) {
        existing.checkOutAt = nowIso;
        existing.updatedAt = nowIso;
        return {
          success: true,
          eventType: "check_out" as const,
          studentId: student.id,
          studentName: student.name,
          attendancePin: normalizedPin,
          eventAt: existing.checkOutAt,
          message: `${student.name} 하원 처리`,
        };
      }

      throw new Error("오늘 하원까지 이미 완료되었습니다.");
    });
  }

  const [existing] = await db
    .select()
    .from(commuteLogs)
    .where(
      and(eq(commuteLogs.studentId, student.id), eq(commuteLogs.commuteDate, todayKey)),
    )
    .limit(1);

  if (!existing) {
    await db.insert(commuteLogs).values({
      studentId: student.id,
      commuteDate: todayKey,
      checkInAt: now,
      checkOutAt: null,
    });

    return {
      success: true,
      eventType: "check_in" as const,
      studentId: student.id,
      studentName: student.name,
      attendancePin: normalizedPin,
      eventAt: now,
      message: `${student.name} 등원 처리`,
    };
  }

  if (!existing.checkOutAt) {
    await db
      .update(commuteLogs)
      .set({
        checkOutAt: now,
        updatedAt: now,
      })
      .where(eq(commuteLogs.id, existing.id));

    return {
      success: true,
      eventType: "check_out" as const,
      studentId: student.id,
      studentName: student.name,
      attendancePin: normalizedPin,
      eventAt: now,
      message: `${student.name} 하원 처리`,
    };
  }

  throw new Error("오늘 하원까지 이미 완료되었습니다.");
}
