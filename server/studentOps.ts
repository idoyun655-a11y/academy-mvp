import { and, eq, inArray, isNull } from "drizzle-orm";
import { classes, classEnrollments, commuteLogs, students, tuitionPayments } from "../drizzle/schema";
import {
  getDb,
  getStudentEnrollmentIds,
  syncStudentEnrollments,
  updateStudent,
} from "./db";
import { getCommuteTodayStatus } from "./commute";
import { readLocalStore } from "./localStore";

export type StudentOpsSavedView =
  | "all"
  | "unclassified"
  | "elementary"
  | "middle"
  | "high"
  | "unassigned_class"
  | "overdue"
  | "pending_checkout"
  | "follow_up"
  | "on_hold"
  | "leaving";

export type StudentOpsSchoolLevel = "elementary" | "middle" | "high" | "other";
export type StudentOpsLifecycleStatus = "active" | "on_hold" | "leaving" | "ended";
export type StudentOpsFollowUpStatus = "none" | "needs_contact" | "scheduled" | "done";
export type StudentOpsSortBy = "default" | "name" | "gradeLevel" | "updatedAt" | "createdAt";
export type StudentOpsSortOrder = "asc" | "desc";
export type StudentOpsCommuteStatus = "not_arrived" | "checked_in" | "checked_out";

export type StudentOpsListInput = {
  limit: number;
  offset: number;
  search?: string;
  savedView?: StudentOpsSavedView;
  schoolLevel?: StudentOpsSchoolLevel;
  gradeLevel?: number;
  classId?: number;
  lifecycleStatus?: StudentOpsLifecycleStatus;
  followUpStatus?: StudentOpsFollowUpStatus;
  sortBy?: StudentOpsSortBy;
  sortOrder?: StudentOpsSortOrder;
};

export type StudentOpsBulkUpdateInput = {
  studentIds: number[];
  lifecycleStatus?: StudentOpsLifecycleStatus;
  schoolLevel?: StudentOpsSchoolLevel;
  gradeLevel?: number | null;
  followUpStatus?: StudentOpsFollowUpStatus;
  followUpDueDate?: Date | null;
  classIds?: number[];
  classSyncMode?: "replace" | "add" | "remove";
};

type StudentRecord = {
  id: number;
  userId: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  attendancePin?: string | null;
  schoolName?: string | null;
  parentPhone?: string | null;
  parentName?: string | null;
  schoolLevel?: StudentOpsSchoolLevel | null;
  gradeLevel?: number | null;
  lifecycleStatus?: StudentOpsLifecycleStatus | null;
  followUpStatus?: StudentOpsFollowUpStatus | null;
  followUpDueDate?: string | Date | null;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
};

type ClassRecord = {
  id: number;
  name: string;
};

type EnrollmentRecord = {
  classId: number;
  studentId: number;
  status?: string | null;
  deletedAt?: string | Date | null;
};

type CommuteRecord = {
  studentId: number;
  commuteDate: string;
  checkInAt?: string | Date | null;
  checkOutAt?: string | Date | null;
};

type TuitionRecord = {
  studentId: number;
  status: "pending" | "paid" | "overdue";
  dueDate?: string | Date | null;
  paidDate?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  month?: string | null;
};

type StudentOpsItem = ReturnType<typeof buildStudentOpsItem>;

const DEFAULT_STUDENT_META = {
  schoolLevel: "other" as StudentOpsSchoolLevel,
  gradeLevel: null as number | null,
  lifecycleStatus: "active" as StudentOpsLifecycleStatus,
  followUpStatus: "none" as StudentOpsFollowUpStatus,
  followUpDueDate: null as string | Date | null,
};

const SCHOOL_LEVEL_ORDER: Record<StudentOpsSchoolLevel, number> = {
  elementary: 0,
  middle: 1,
  high: 2,
  other: 3,
};

function isActiveRecord(record: { deletedAt?: string | Date | null } | undefined) {
  return Boolean(record) && !record?.deletedAt;
}

function normalizeStudent(student: StudentRecord) {
  return {
    ...student,
    attendancePin: student.attendancePin ?? null,
    schoolName: student.schoolName ?? null,
    schoolLevel: student.schoolLevel ?? DEFAULT_STUDENT_META.schoolLevel,
    gradeLevel: student.gradeLevel ?? DEFAULT_STUDENT_META.gradeLevel,
    lifecycleStatus: student.lifecycleStatus ?? DEFAULT_STUDENT_META.lifecycleStatus,
    followUpStatus: student.followUpStatus ?? DEFAULT_STUDENT_META.followUpStatus,
    followUpDueDate: student.followUpDueDate ?? DEFAULT_STUDENT_META.followUpDueDate,
  };
}

function toDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function getLatestDate(values: Array<string | Date | null | undefined>) {
  let latest: Date | null = null;

  values.forEach((value) => {
    const date = toDate(value);
    if (!date) return;
    if (!latest || date > latest) latest = date;
  });

  return latest;
}

function getLastPaymentStatus(payments: TuitionRecord[]) {
  if (payments.length === 0) return null;

  const latest = [...payments].sort((left, right) => {
    const leftDate = getLatestDate([
      left.paidDate,
      left.dueDate,
      left.updatedAt,
      left.createdAt,
      left.month ? `${left.month}-01` : null,
    ]);
    const rightDate = getLatestDate([
      right.paidDate,
      right.dueDate,
      right.updatedAt,
      right.createdAt,
      right.month ? `${right.month}-01` : null,
    ]);
    return (rightDate?.getTime() ?? 0) - (leftDate?.getTime() ?? 0);
  })[0];

  return latest?.status ?? null;
}

function matchesSavedView(item: StudentOpsItem, savedView: StudentOpsSavedView) {
  if (savedView === "all") return true;
  if (savedView === "unclassified") {
    return item.schoolLevel === "other" || item.gradeLevel === null;
  }
  if (savedView === "elementary" || savedView === "middle" || savedView === "high") {
    return item.schoolLevel === savedView;
  }
  if (savedView === "unassigned_class") {
    return item.lifecycleStatus !== "ended" && item.activeClassCount === 0;
  }
  if (savedView === "overdue") {
    return item.hasOverduePayment;
  }
  if (savedView === "pending_checkout") {
    return item.lifecycleStatus !== "ended" && item.commuteStatus === "checked_in";
  }
  if (savedView === "follow_up") {
    return item.followUpRequired;
  }
  if (savedView === "on_hold") {
    return item.lifecycleStatus === "on_hold";
  }
  if (savedView === "leaving") {
    return item.lifecycleStatus === "leaving";
  }
  return true;
}

function matchesSearch(item: StudentOpsItem, search?: string) {
  if (!search) return true;
  const keyword = search.trim().toLowerCase();
  if (!keyword) return true;

  const fields = [
    item.name,
    item.email,
    item.phone,
    item.attendancePin,
    item.schoolName,
    item.parentName,
    item.parentPhone,
    item.notes,
    ...item.activeClassNames,
  ];

  return fields
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .some((value) => value.toLowerCase().includes(keyword));
}

function formatGradeLabel(schoolLevel: StudentOpsSchoolLevel, gradeLevel: number | null) {
  if (!gradeLevel) return "미분류";
  if (schoolLevel === "elementary") return `초${gradeLevel}`;
  if (schoolLevel === "middle") return `중${gradeLevel}`;
  if (schoolLevel === "high") return `고${gradeLevel}`;
  return `${gradeLevel}학년`;
}

function buildStudentOpsItem(
  student: ReturnType<typeof normalizeStudent>,
  activeClassIds: number[],
  activeClassNames: string[],
  commuteRows: CommuteRecord[],
  paymentRows: TuitionRecord[],
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasOverduePayment = paymentRows.some((row) => {
    if (row.status === "overdue") return true;
    if (row.status !== "pending") return false;
    const dueDate = toDate(row.dueDate);
    return Boolean(dueDate && dueDate < today);
  });

  const lastCheckInAt = getLatestDate(commuteRows.map((row) => row.checkInAt));
  const lastCheckOutAt = getLatestDate(commuteRows.map((row) => row.checkOutAt));
  const followUpRequired =
    student.followUpStatus === "needs_contact" || student.followUpStatus === "scheduled";

  return {
    ...student,
    schoolLevel: student.schoolLevel as StudentOpsSchoolLevel,
    gradeLevel: student.gradeLevel as number | null,
    lifecycleStatus: student.lifecycleStatus as StudentOpsLifecycleStatus,
    followUpStatus: student.followUpStatus as StudentOpsFollowUpStatus,
    activeClassIds,
    activeClassCount: activeClassNames.length,
    activeClassNames,
    hasOverduePayment,
    followUpRequired,
    commuteStatus: getCommuteTodayStatus(commuteRows),
    lastCheckInAt,
    lastCheckOutAt,
    lastPaymentStatus: getLastPaymentStatus(paymentRows),
    gradeLabel: formatGradeLabel(
      student.schoolLevel as StudentOpsSchoolLevel,
      student.gradeLevel as number | null,
    ),
  };
}

function sortStudentOpsItems(
  items: StudentOpsItem[],
  sortBy: StudentOpsSortBy = "default",
  sortOrder: StudentOpsSortOrder = "asc",
) {
  const direction = sortOrder === "desc" ? -1 : 1;

  return [...items].sort((left, right) => {
    let comparison = 0;

    if (sortBy === "name") {
      comparison = left.name.localeCompare(right.name, "ko");
    } else if (sortBy === "gradeLevel") {
      comparison = (left.gradeLevel ?? 99) - (right.gradeLevel ?? 99);
    } else if (sortBy === "updatedAt") {
      comparison =
        (toDate(left.updatedAt)?.getTime() ?? 0) - (toDate(right.updatedAt)?.getTime() ?? 0);
    } else if (sortBy === "createdAt") {
      comparison =
        (toDate(left.createdAt)?.getTime() ?? 0) - (toDate(right.createdAt)?.getTime() ?? 0);
    } else {
      comparison =
        SCHOOL_LEVEL_ORDER[left.schoolLevel] - SCHOOL_LEVEL_ORDER[right.schoolLevel];

      if (comparison === 0) {
        comparison = (left.gradeLevel ?? 99) - (right.gradeLevel ?? 99);
      }
      if (comparison === 0) {
        comparison = left.name.localeCompare(right.name, "ko");
      }
    }

    if (comparison !== 0) return comparison * direction;
    return left.id - right.id;
  });
}

function buildStudentOpsItemsFromCollections(
  studentRows: Array<ReturnType<typeof normalizeStudent>>,
  classRows: ClassRecord[],
  enrollmentRows: EnrollmentRecord[],
  commuteRows: CommuteRecord[],
  paymentRows: TuitionRecord[],
) {
  const classNameMap = new Map(classRows.map((row) => [row.id, row.name]));
  const enrollmentsByStudent = new Map<number, number[]>();
  const commuteByStudent = new Map<number, CommuteRecord[]>();
  const paymentsByStudent = new Map<number, TuitionRecord[]>();

  enrollmentRows.forEach((row) => {
    const existing = enrollmentsByStudent.get(row.studentId) ?? [];
    existing.push(row.classId);
    enrollmentsByStudent.set(row.studentId, existing);
  });

  commuteRows.forEach((row) => {
    const existing = commuteByStudent.get(row.studentId) ?? [];
    existing.push(row);
    commuteByStudent.set(row.studentId, existing);
  });

  paymentRows.forEach((row) => {
    const existing = paymentsByStudent.get(row.studentId) ?? [];
    existing.push(row);
    paymentsByStudent.set(row.studentId, existing);
  });

  return studentRows.map((student) => {
    const activeClassIds = Array.from(new Set(enrollmentsByStudent.get(student.id) ?? [])).sort(
      (left, right) => left - right,
    );
    const activeClassNames = uniqueSorted(
      activeClassIds
        .map((classId) => classNameMap.get(classId) ?? null)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    );

    return buildStudentOpsItem(
      student,
      activeClassIds,
      activeClassNames,
      commuteByStudent.get(student.id) ?? [],
      paymentsByStudent.get(student.id) ?? [],
    );
  });
}

async function loadStudentOpsItems() {
  const db = await getDb();

  if (!db) {
    const store = await readLocalStore();
    const activeStudents = store.students
      .filter((student) => isActiveRecord(student))
      .map((student) => normalizeStudent(student));
    const activeClasses = store.classes.filter((item) => isActiveRecord(item)) as ClassRecord[];
    const activeEnrollments = store.classEnrollments.filter(
      (item) => item.status === "active" && isActiveRecord(item),
    ) as EnrollmentRecord[];
    const commuteRows = store.commuteLogs as CommuteRecord[];
    const paymentRows = store.tuitionPayments as TuitionRecord[];

    return buildStudentOpsItemsFromCollections(
      activeStudents,
      activeClasses,
      activeEnrollments,
      commuteRows,
      paymentRows,
    );
  }

  const studentRows = (await db
    .select()
    .from(students)
    .where(isNull(students.deletedAt))) as StudentRecord[];

  if (studentRows.length === 0) return [];

  const studentIds = studentRows.map((student) => student.id);
  const [classRows, enrollmentRows, commuteRows, paymentRows] = await Promise.all([
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(isNull(classes.deletedAt)),
    db
      .select({
        classId: classEnrollments.classId,
        studentId: classEnrollments.studentId,
        status: classEnrollments.status,
        deletedAt: classEnrollments.deletedAt,
      })
      .from(classEnrollments)
      .where(
        and(
          inArray(classEnrollments.studentId, studentIds),
          isNull(classEnrollments.deletedAt),
          eq(classEnrollments.status, "active"),
        ),
      ),
    db
      .select({
        studentId: commuteLogs.studentId,
        commuteDate: commuteLogs.commuteDate,
        checkInAt: commuteLogs.checkInAt,
        checkOutAt: commuteLogs.checkOutAt,
      })
      .from(commuteLogs)
      .where(inArray(commuteLogs.studentId, studentIds)),
    db
      .select({
        studentId: tuitionPayments.studentId,
        status: tuitionPayments.status,
        dueDate: tuitionPayments.dueDate,
        paidDate: tuitionPayments.paidDate,
        createdAt: tuitionPayments.createdAt,
        updatedAt: tuitionPayments.updatedAt,
        month: tuitionPayments.month,
      })
      .from(tuitionPayments)
      .where(inArray(tuitionPayments.studentId, studentIds)),
  ]);

  return buildStudentOpsItemsFromCollections(
    studentRows.map((student) => normalizeStudent(student)),
    classRows as ClassRecord[],
    enrollmentRows as EnrollmentRecord[],
    commuteRows as CommuteRecord[],
    paymentRows as TuitionRecord[],
  );
}

export async function listStudentOps(input: StudentOpsListInput) {
  const items = await loadStudentOpsItems();
  const filtered = items.filter((item) => {
    if (!matchesSearch(item, input.search)) return false;
    if (input.savedView && !matchesSavedView(item, input.savedView)) return false;
    if (input.schoolLevel && item.schoolLevel !== input.schoolLevel) return false;
    if (input.gradeLevel !== undefined && item.gradeLevel !== input.gradeLevel) return false;
    if (input.classId !== undefined && !item.activeClassIds.includes(input.classId)) return false;
    if (input.lifecycleStatus && item.lifecycleStatus !== input.lifecycleStatus) return false;
    if (input.followUpStatus && item.followUpStatus !== input.followUpStatus) return false;
    return true;
  });

  const sorted = sortStudentOpsItems(filtered, input.sortBy, input.sortOrder);

  return {
    data: sorted.slice(input.offset, input.offset + input.limit),
    total: sorted.length,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function getStudentOpsSummary() {
  const items = await loadStudentOpsItems();

  const savedViews = {
    all: items.length,
    unclassified: items.filter((item) => matchesSavedView(item, "unclassified")).length,
    elementary: items.filter((item) => matchesSavedView(item, "elementary")).length,
    middle: items.filter((item) => matchesSavedView(item, "middle")).length,
    high: items.filter((item) => matchesSavedView(item, "high")).length,
    unassignedClass: items.filter((item) => matchesSavedView(item, "unassigned_class")).length,
    overdue: items.filter((item) => matchesSavedView(item, "overdue")).length,
    pendingCheckout: items.filter((item) => matchesSavedView(item, "pending_checkout")).length,
    followUp: items.filter((item) => matchesSavedView(item, "follow_up")).length,
    onHold: items.filter((item) => matchesSavedView(item, "on_hold")).length,
    leaving: items.filter((item) => matchesSavedView(item, "leaving")).length,
  };

  const lifecycleCounts = {
    active: items.filter((item) => item.lifecycleStatus === "active").length,
    onHold: items.filter((item) => item.lifecycleStatus === "on_hold").length,
    leaving: items.filter((item) => item.lifecycleStatus === "leaving").length,
    ended: items.filter((item) => item.lifecycleStatus === "ended").length,
  };

  const gradeDistribution = Array.from(
    items.reduce((map, item) => {
      const key = `${item.schoolLevel}:${item.gradeLevel ?? "none"}`;
      const existing = map.get(key) ?? {
        schoolLevel: item.schoolLevel,
        gradeLevel: item.gradeLevel,
        count: 0,
      };
      existing.count += 1;
      map.set(key, existing);
      return map;
    }, new Map<string, { schoolLevel: StudentOpsSchoolLevel; gradeLevel: number | null; count: number }>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => {
      const schoolDiff = SCHOOL_LEVEL_ORDER[left.schoolLevel] - SCHOOL_LEVEL_ORDER[right.schoolLevel];
      if (schoolDiff !== 0) return schoolDiff;
      return (left.gradeLevel ?? 99) - (right.gradeLevel ?? 99);
    });

  return {
    savedViews,
    lifecycleCounts,
    gradeDistribution,
  };
}

export async function bulkUpdateStudentOps(input: StudentOpsBulkUpdateInput) {
  const studentIds = Array.from(new Set(input.studentIds));
  const hasLifecycleStatus = Object.prototype.hasOwnProperty.call(input, "lifecycleStatus");
  const hasSchoolLevel = Object.prototype.hasOwnProperty.call(input, "schoolLevel");
  const hasGradeLevel = Object.prototype.hasOwnProperty.call(input, "gradeLevel");
  const hasFollowUpStatus = Object.prototype.hasOwnProperty.call(input, "followUpStatus");
  const hasFollowUpDueDate = Object.prototype.hasOwnProperty.call(input, "followUpDueDate");
  const hasClassIds = Array.isArray(input.classIds);

  for (const studentId of studentIds) {
    const updatePayload: Record<string, unknown> = {};

    if (hasLifecycleStatus) updatePayload.lifecycleStatus = input.lifecycleStatus ?? "active";
    if (hasSchoolLevel) updatePayload.schoolLevel = input.schoolLevel ?? "other";
    if (hasGradeLevel) updatePayload.gradeLevel = input.gradeLevel ?? null;
    if (hasFollowUpStatus) updatePayload.followUpStatus = input.followUpStatus ?? "none";
    if (hasFollowUpDueDate) updatePayload.followUpDueDate = input.followUpDueDate ?? null;

    if (Object.keys(updatePayload).length > 0) {
      await updateStudent(studentId, updatePayload as any);
    }

    if (hasClassIds) {
      const currentClassIds = await getStudentEnrollmentIds(studentId);
      const requestedClassIds = Array.from(new Set(input.classIds ?? []));
      let nextClassIds = requestedClassIds;

      if (input.classSyncMode === "add") {
        nextClassIds = Array.from(new Set([...currentClassIds, ...requestedClassIds]));
      } else if (input.classSyncMode === "remove") {
        const requestedSet = new Set(requestedClassIds);
        nextClassIds = currentClassIds.filter((classId) => !requestedSet.has(classId));
      }

      await syncStudentEnrollments(studentId, nextClassIds);
    }
  }

  return {
    success: true,
    updatedCount: studentIds.length,
  };
}
