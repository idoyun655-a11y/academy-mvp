import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import {
  classEnrollments,
  classSchedules,
  classes,
  commuteLogs,
  grades,
  notices,
  students,
  tuitionPayments,
  users,
  type User,
} from "../drizzle/schema";
import { getTodayCommuteFeed, getTodayCommuteSummary, getCommuteTodayStatus } from "./commute";
import { getCommuteLogsByStudent, getDb, getStudentById, getStudentByUserId } from "./db";
import { readLocalStore } from "./localStore";
import { getStudentOpsSummary } from "./studentOps";

const MOCK_EXAM_ORDER: Record<string, number> = {
  "3": 1,
  "6": 2,
  "9": 3,
  "10": 4,
};

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return value ? [value] : [];
    }
  }

  return [];
}

function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item) && item > 0);
      }
    } catch {
      const single = Number(value);
      return Number.isFinite(single) && single > 0 ? [single] : [];
    }
  }

  return [];
}

function formatActivityTime(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString();
}

function isActiveRecord(record: { deletedAt?: string | Date | null } | undefined) {
  return Boolean(record) && !record?.deletedAt;
}

function sortDesc<T extends Record<string, any>>(items: T[], key: keyof T) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left[key] ?? 0).getTime();
    const rightTime = new Date(right[key] ?? 0).getTime();
    return rightTime - leftTime;
  });
}

function getLatestDate(values: Array<string | Date | null | undefined>) {
  let latest: Date | null = null;

  values.forEach((value) => {
    if (!value) return;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return;
    if (!latest || date > latest) latest = date;
  });

  return latest;
}

function normalizeCommuteRecords(records: Array<any>) {
  const sorted = [...records].sort((left, right) => {
    const leftTime =
      new Date(left.checkOutAt ?? left.checkInAt ?? left.createdAt ?? 0).getTime();
    const rightTime =
      new Date(right.checkOutAt ?? right.checkInAt ?? right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });

  return {
    records: sorted.map((record) => ({
      ...record,
      status: record.checkOutAt ? "checked_out" : record.checkInAt ? "checked_in" : "not_arrived",
    })),
    summary: {
      total: sorted.length,
    },
    todayStatus: getCommuteTodayStatus(sorted),
    latestCheckInAt: getLatestDate(sorted.map((record) => record.checkInAt)),
    latestCheckOutAt: getLatestDate(sorted.map((record) => record.checkOutAt)),
  };
}

async function getLinkedStudentsForUser(user: User) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();

    if (user.role === "student") {
      const ownStudent =
        store.students.find((student) => isActiveRecord(student) && student.userId === user.id) ??
        store.students.find(
          (student) =>
            isActiveRecord(student) &&
            student.email &&
            user.email &&
            student.email.toLowerCase() === user.email.toLowerCase(),
        );
      return ownStudent ? [ownStudent] : [];
    }

    if (user.role === "parent") {
      return store.students
        .filter((student) => {
          if (!isActiveRecord(student)) return false;
          if (user.phone && student.parentPhone === user.phone) return true;
          if (user.name && student.parentName === user.name) return true;
          return false;
        })
        .sort((left, right) => String(left.name).localeCompare(String(right.name)));
    }

    return [];
  }

  if (user.role === "student") {
    const ownStudent = await getStudentByUserId(user.id);
    if (ownStudent) return [ownStudent];

    if (user.email) {
      return db
        .select()
        .from(students)
        .where(and(eq(students.email, user.email), isNull(students.deletedAt)))
        .limit(1);
    }

    return [];
  }

  if (user.role === "parent") {
    if (user.phone) {
      return db
        .select()
        .from(students)
        .where(and(isNull(students.deletedAt), eq(students.parentPhone, user.phone)))
        .orderBy(asc(students.name));
    }

    if (user.name) {
      return db
        .select()
        .from(students)
        .where(and(isNull(students.deletedAt), eq(students.parentName, user.name)))
        .orderBy(asc(students.name));
    }

    return [];
  }

  return [];
}

async function getLocalStudentPortalSnapshot(studentId: number, viewerRoles: string[]) {
  const store = await readLocalStore();
  const student = store.students.find((item) => item.id === studentId && isActiveRecord(item));
  if (!student) return null;

  const activeEnrollments = store.classEnrollments.filter(
    (item) => item.studentId === studentId && item.status === "active" && isActiveRecord(item),
  );

  const classMap = new Map<number, any>();
  for (const enrollment of activeEnrollments) {
    const classItem = store.classes.find(
      (candidate) => candidate.id === enrollment.classId && isActiveRecord(candidate),
    );
    if (!classItem) continue;

    if (!classMap.has(classItem.id)) {
      const teacher = store.users.find((user) => user.id === classItem.teacherId);
      classMap.set(classItem.id, {
        id: classItem.id,
        name: classItem.name,
        subject: classItem.subject,
        room: classItem.room,
        teacherName: teacher?.name ?? null,
        schedules: [],
      });
    }

    const schedules = store.classSchedules
      .filter((schedule) => schedule.classId === classItem.id)
      .sort((left, right) => {
        if (left.dayOfWeek !== right.dayOfWeek) return left.dayOfWeek - right.dayOfWeek;
        return String(left.startTime).localeCompare(String(right.startTime));
      });

    classMap.get(classItem.id).schedules = schedules.map((schedule) => ({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));
  }

  const commuteRows = sortDesc(
    store.commuteLogs.filter((item) => item.studentId === studentId),
    "commuteDate",
  ).slice(0, 60);

  const visibleNoticeRows = sortDesc(
    store.notices.filter((notice) => isActiveRecord(notice) && notice.isPublished),
    "createdAt",
  ).slice(0, 20);

  const noticesForViewer = visibleNoticeRows
    .filter((notice) => {
      const targetRoles = toStringArray(notice.targetRoles);
      const targetClassIds = toNumberArray((notice as any).targetClassIds);
      const matchesRole =
        targetRoles.length === 0 ? true : viewerRoles.some((role) => targetRoles.includes(role));
      const matchesClass =
        targetClassIds.length === 0
          ? true
          : activeEnrollments.some((enrollment) => targetClassIds.includes(enrollment.classId));

      return matchesRole && matchesClass;
    })
    .map((notice) => ({
      ...notice,
      targetRoles: toStringArray(notice.targetRoles),
      targetClassIds: toNumberArray((notice as any).targetClassIds),
      attachmentUrls: toStringArray(notice.attachmentUrls),
    }));

  const gradeRows = sortDesc(
    store.grades.filter((grade) => grade.studentId === studentId),
    "createdAt",
  );

  const mockExams = gradeRows
    .filter((grade) => grade.mockExamMonth)
    .sort(
      (left, right) =>
        (MOCK_EXAM_ORDER[left.mockExamMonth || ""] || 99) -
        (MOCK_EXAM_ORDER[right.mockExamMonth || ""] || 99),
    );

  const latestSchoolGrade = gradeRows.find((grade) => grade.schoolGrade !== null) ?? null;
  const paymentRows = sortDesc(
    store.tuitionPayments.filter((payment) => payment.studentId === studentId),
    "month",
  ).slice(0, 12);

  return {
    student,
    summary: {
      totalClasses: classMap.size,
      totalNotices: noticesForViewer.length,
      pendingPayments: paymentRows.filter((payment) => payment.status !== "paid").length,
      latestSchoolGrade: latestSchoolGrade?.schoolGrade ?? null,
    },
    classes: Array.from(classMap.values()),
    commute: normalizeCommuteRecords(commuteRows),
    notices: noticesForViewer,
    grades: {
      mockExams,
      latestSchoolGrade,
    },
    payments: paymentRows,
    syncedAt: new Date(),
  };
}

async function getDbStudentPortalSnapshot(studentId: number, viewerRoles: string[]) {
  const db = await getDb();
  if (!db) return null;

  const student = await getStudentById(studentId);
  if (!student) return null;

  const classRows = await db
    .select({
      classId: classes.id,
      className: classes.name,
      subject: classes.subject,
      room: classes.room,
      teacherName: users.name,
      scheduleId: classSchedules.id,
      dayOfWeek: classSchedules.dayOfWeek,
      startTime: classSchedules.startTime,
      endTime: classSchedules.endTime,
    })
    .from(classEnrollments)
    .innerJoin(classes, and(eq(classEnrollments.classId, classes.id), isNull(classes.deletedAt)))
    .leftJoin(classSchedules, eq(classSchedules.classId, classes.id))
    .leftJoin(users, eq(users.id, classes.teacherId))
    .where(and(eq(classEnrollments.studentId, studentId), isNull(classEnrollments.deletedAt)))
    .orderBy(asc(classes.name), asc(classSchedules.dayOfWeek), asc(classSchedules.startTime));

  const classMap = new Map<number, any>();
  for (const row of classRows) {
    if (!classMap.has(row.classId)) {
      classMap.set(row.classId, {
        id: row.classId,
        name: row.className,
        subject: row.subject,
        room: row.room,
        teacherName: row.teacherName ?? null,
        schedules: [],
      });
    }

    if (row.scheduleId) {
      classMap.get(row.classId).schedules.push({
        id: row.scheduleId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      });
    }
  }

  const commuteRows = await getCommuteLogsByStudent(studentId, 60);

  const visibleNoticeRows = await db
    .select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      targetRoles: notices.targetRoles,
      targetClassIds: notices.targetClassIds,
      attachmentUrls: notices.attachmentUrls,
      createdAt: notices.createdAt,
      publishedAt: notices.publishedAt,
      isPublished: notices.isPublished,
    })
    .from(notices)
    .where(and(isNull(notices.deletedAt), eq(notices.isPublished, true)))
    .orderBy(desc(notices.createdAt))
    .limit(20);

  const noticesForViewer = visibleNoticeRows
    .filter((notice) => {
      const targetRoles = toStringArray(notice.targetRoles);
      const targetClassIds = toNumberArray((notice as any).targetClassIds);
      const matchesRole =
        targetRoles.length === 0 ? true : viewerRoles.some((role) => targetRoles.includes(role));
      const matchesClass =
        targetClassIds.length === 0
          ? true
          : Array.from(classMap.keys()).some((classId) => targetClassIds.includes(classId));

      return matchesRole && matchesClass;
    })
    .map((notice) => ({
      ...notice,
      targetRoles: toStringArray(notice.targetRoles),
      targetClassIds: toNumberArray((notice as any).targetClassIds),
      attachmentUrls: toStringArray(notice.attachmentUrls),
    }));

  const gradeRows = await db
    .select()
    .from(grades)
    .where(eq(grades.studentId, studentId))
    .orderBy(desc(grades.createdAt));

  const mockExams = gradeRows
    .filter((grade) => grade.mockExamMonth)
    .sort(
      (left, right) =>
        (MOCK_EXAM_ORDER[left.mockExamMonth || ""] || 99) -
        (MOCK_EXAM_ORDER[right.mockExamMonth || ""] || 99),
    );

  const latestSchoolGrade = gradeRows.find((grade) => grade.schoolGrade !== null) ?? null;

  const paymentRows = await db
    .select()
    .from(tuitionPayments)
    .where(eq(tuitionPayments.studentId, studentId))
    .orderBy(desc(tuitionPayments.month))
    .limit(12);

  return {
    student,
    summary: {
      totalClasses: classMap.size,
      totalNotices: noticesForViewer.length,
      pendingPayments: paymentRows.filter((payment) => payment.status !== "paid").length,
      latestSchoolGrade: latestSchoolGrade?.schoolGrade ?? null,
    },
    classes: Array.from(classMap.values()),
    commute: normalizeCommuteRecords(commuteRows),
    notices: noticesForViewer,
    grades: {
      mockExams,
      latestSchoolGrade,
    },
    payments: paymentRows,
    syncedAt: new Date(),
  };
}

export async function getStudentPortalSnapshot(studentId: number, viewerRoles: string[] = ["student"]) {
  const db = await getDb();
  if (!db) {
    return getLocalStudentPortalSnapshot(studentId, viewerRoles);
  }

  return getDbStudentPortalSnapshot(studentId, viewerRoles);
}

export async function getLinkedPortalSnapshots(user: User) {
  const linkedStudents = await getLinkedStudentsForUser(user);
  const viewerRoles = user.role === "parent" ? ["parent", "student"] : [user.role];

  const snapshots = await Promise.all(
    linkedStudents.map((student) => getStudentPortalSnapshot(student.id, viewerRoles)),
  );

  return snapshots.filter(Boolean);
}

export async function getAdminDashboardSnapshot() {
  const studentOpsSummary = await getStudentOpsSummary();
  const commuteSummary = await getTodayCommuteSummary();
  const commuteFeed = await getTodayCommuteFeed(6);
  const db = await getDb();

  if (!db) {
    const store = await readLocalStore();
    const activeStudents = store.students.filter((student) => isActiveRecord(student));
    const activeClasses = store.classes.filter((classItem) => isActiveRecord(classItem));
    const activeNotices = store.notices.filter((notice) => isActiveRecord(notice) && notice.isPublished);
    const overduePayments = store.tuitionPayments.filter((payment) => payment.status === "overdue");
    const pendingPayments = store.tuitionPayments.filter((payment) => payment.status === "pending");

    const recentNotices = sortDesc(store.notices.filter((notice) => isActiveRecord(notice)), "createdAt")
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        createdAt: item.createdAt,
        isPublished: item.isPublished,
      }));

    const recentActivities = [
      ...commuteFeed.map((item) => ({
        id: item.id,
        type: "commute",
        title: `${item.studentName} ${item.eventType === "check_in" ? "등원" : "하원"}`,
        detail: item.attendancePin ? `출석번호 ${item.attendancePin}` : "출석번호 미등록",
        time: formatActivityTime(item.eventAt),
      })),
      ...recentNotices.map((item) => ({
        id: `notice-${item.id}`,
        type: "notice",
        title: item.title,
        detail: item.isPublished ? "게시 완료" : "임시 저장",
        time: formatActivityTime(item.createdAt),
      })),
    ]
      .sort((left, right) => right.time.localeCompare(left.time))
      .slice(0, 8);

    return {
      kpis: {
        totalStudents: activeStudents.length,
        totalClasses: activeClasses.length,
        todayCheckInCount: commuteSummary.todayCheckInCount,
        todayCheckOutCount: commuteSummary.todayCheckOutCount,
        onSiteCount: commuteSummary.onSiteCount,
        publishedNotices: activeNotices.length,
        overduePayments: overduePayments.length,
      },
      recentActivities,
      alerts: {
        pendingPayments: pendingPayments.length,
        pendingCheckoutCount: commuteSummary.pendingCheckoutCount,
      },
      studentQueues: {
        unclassified: studentOpsSummary.savedViews.unclassified,
        unassignedClass: studentOpsSummary.savedViews.unassignedClass,
        overdue: studentOpsSummary.savedViews.overdue,
        pendingCheckout: studentOpsSummary.savedViews.pendingCheckout,
        followUp: studentOpsSummary.savedViews.followUp,
        leaving: studentOpsSummary.savedViews.leaving,
      },
      syncedAt: new Date(),
    };
  }

  const [studentCountRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(isNull(students.deletedAt));
  const [classCountRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(classes)
    .where(isNull(classes.deletedAt));
  const [noticeCountRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notices)
    .where(and(isNull(notices.deletedAt), eq(notices.isPublished, true)));
  const [overdueCountRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tuitionPayments)
    .where(eq(tuitionPayments.status, "overdue"));
  const [pendingPaymentRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tuitionPayments)
    .where(eq(tuitionPayments.status, "pending"));

  const recentNotices = await db
    .select({
      id: notices.id,
      title: notices.title,
      createdAt: notices.createdAt,
      isPublished: notices.isPublished,
    })
    .from(notices)
    .where(isNull(notices.deletedAt))
    .orderBy(desc(notices.createdAt))
    .limit(5);

  const recentActivities = [
    ...commuteFeed.map((item) => ({
      id: item.id,
      type: "commute",
      title: `${item.studentName} ${item.eventType === "check_in" ? "등원" : "하원"}`,
      detail: item.attendancePin ? `출석번호 ${item.attendancePin}` : "출석번호 미등록",
      time: formatActivityTime(item.eventAt),
    })),
    ...recentNotices.map((item) => ({
      id: `notice-${item.id}`,
      type: "notice",
      title: item.title,
      detail: item.isPublished ? "게시 완료" : "임시 저장",
      time: formatActivityTime(item.createdAt),
    })),
  ]
    .sort((left, right) => right.time.localeCompare(left.time))
    .slice(0, 8);

  return {
    kpis: {
      totalStudents: Number(studentCountRow?.count) || 0,
      totalClasses: Number(classCountRow?.count) || 0,
      todayCheckInCount: commuteSummary.todayCheckInCount,
      todayCheckOutCount: commuteSummary.todayCheckOutCount,
      onSiteCount: commuteSummary.onSiteCount,
      publishedNotices: Number(noticeCountRow?.count) || 0,
      overduePayments: Number(overdueCountRow?.count) || 0,
    },
    recentActivities,
    alerts: {
      pendingPayments: Number(pendingPaymentRow?.count) || 0,
      pendingCheckoutCount: commuteSummary.pendingCheckoutCount,
    },
    studentQueues: {
      unclassified: studentOpsSummary.savedViews.unclassified,
      unassignedClass: studentOpsSummary.savedViews.unassignedClass,
      overdue: studentOpsSummary.savedViews.overdue,
      pendingCheckout: studentOpsSummary.savedViews.pendingCheckout,
      followUp: studentOpsSummary.savedViews.followUp,
      leaving: studentOpsSummary.savedViews.leaving,
    },
    syncedAt: new Date(),
  };
}
