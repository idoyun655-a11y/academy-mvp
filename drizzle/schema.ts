import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  datetime,
  tinyint,
  json,
  longtext,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for RBAC (Role-Based Access Control).
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  password: text("password").notNull().default(""),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["superadmin", "admin", "teacher", "student", "parent"]).default("student").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Students table: 학생 정보
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  parentPhone: varchar("parentPhone", { length: 20 }),
  parentName: varchar("parentName", { length: 100 }),
  schoolLevel: mysqlEnum("schoolLevel", ["elementary", "middle", "high", "other"])
    .default("other")
    .notNull(),
  gradeLevel: int("gradeLevel"),
  lifecycleStatus: mysqlEnum("lifecycleStatus", ["active", "on_hold", "leaving", "ended"])
    .default("active")
    .notNull(),
  followUpStatus: mysqlEnum("followUpStatus", ["none", "needs_contact", "scheduled", "done"])
    .default("none")
    .notNull(),
  followUpDueDate: datetime("followUpDueDate"),
  dateOfBirth: datetime("dateOfBirth"),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Teachers table: 강사 정보
 */
export const teachers = mysqlTable("teachers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 100 }),
  bio: text("bio"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;

/**
 * Classes table: 반(수업) 정보
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  capacity: int("capacity").default(20).notNull(),
  room: varchar("room", { length: 50 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * ClassSchedules table: 반별 시간표
 * 요일별 수업 시간 정보
 */
export const classSchedules = mysqlTable("classSchedules", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  dayOfWeek: tinyint("dayOfWeek").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassSchedule = typeof classSchedules.$inferSelect;
export type InsertClassSchedule = typeof classSchedules.$inferInsert;

/**
 * ClassEnrollments table: 학생-반 연결
 */
export const classEnrollments = mysqlTable("classEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "inactive", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = typeof classEnrollments.$inferInsert;

/**
 * Attendance table: 출결 기록
 */
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  attendanceDate: datetime("attendanceDate").notNull(),
  status: mysqlEnum("status", ["present", "late", "absent", "early_leave"]).notNull(),
  notes: text("notes"),
  recordedBy: int("recordedBy"), // User ID of admin/teacher who recorded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

/**
 * Notices table: 공지사항
 */
export const notices = mysqlTable("notices", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: longtext("content").notNull(),
  createdBy: int("createdBy").notNull(), // User ID of admin/teacher
  targetRoles: json("targetRoles").notNull(), // JSON array of roles: ["student", "parent", "teacher"]
  targetClassIds: json("targetClassIds"), // JSON array of class IDs, null means all
  attachmentUrls: json("attachmentUrls"), // JSON array of file URLs
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;

/**
 * NotificationTemplates table: 알림톡 템플릿
 * Provider Abstraction을 위한 템플릿 저장소
 */
export const notificationTemplates = mysqlTable("notificationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  provider: mysqlEnum("provider", ["kakao_talk", "sms", "email"]).default("kakao_talk").notNull(),
  templateId: varchar("templateId", { length: 100 }), // Provider-specific template ID
  title: varchar("title", { length: 255 }),
  content: longtext("content").notNull(),
  variables: json("variables").notNull(), // JSON array of variable names: ["studentName", "className", "date"]
  eventType: mysqlEnum("eventType", [
    "class_start",
    "payment_due",
    "unpaid_notice",
    "attendance_result",
    "notice_published",
    "custom"
  ]).default("custom").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;

/**
 * NotificationLogs table: 알림톡 발송 이력
 */
export const notificationLogs = mysqlTable("notificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  recipientUserId: int("recipientUserId").notNull(),
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(),
  provider: mysqlEnum("provider", ["kakao_talk", "sms", "email"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  content: longtext("content").notNull(),
  errorMessage: text("errorMessage"),
  externalId: varchar("externalId", { length: 255 }), // Provider-specific message ID
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * WebPushSubscriptions table: 기기별 웹 푸시 구독 저장
 */
export const webPushSubscriptions = mysqlTable("webPushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  deviceLabel: varchar("deviceLabel", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type WebPushSubscription = typeof webPushSubscriptions.$inferSelect;
export type InsertWebPushSubscription = typeof webPushSubscriptions.$inferInsert;

/**
 * AdminLogs table: 관리자 액션 로그
 * 감사 추적(Audit Trail)을 위한 로그 기록
 */
export const adminLogs = mysqlTable("adminLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(), // User ID of admin/teacher
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create_student", "update_attendance", "delete_notice"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "student", "class", "attendance", "notice"
  entityId: int("entityId").notNull(),
  oldValues: json("oldValues"), // JSON of previous values
  newValues: json("newValues"), // JSON of new values
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

/**
 * Payments table: 수강료 결제 정보
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  classId: int("classId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  dueDate: datetime("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;


/**
 * Grades table: 학생 성적 관리
 * 모의고사 성적 (3, 6, 9, 10월)과 내신 성적 (5등급제 또는 9등급제)
 */
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  // 모의고사 성적
  mockExamMonth: mysqlEnum("mockExamMonth", ["3", "6", "9", "10"]),
  korean: tinyint("korean"),
  english: tinyint("english"),
  math: tinyint("math"),
  science: tinyint("science"),
  social: tinyint("social"),
  // 내신 성적
  schoolGrade: tinyint("schoolGrade"),
  schoolGradeType: mysqlEnum("schoolGradeType", ["5", "9"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;


/**
 * ExamSchedules table: 시험일정 관리
 * 모의고사, 중간고사, 기말고사 등 시험일정 저장
 */
export const examSchedules = mysqlTable("examSchedules", {
  id: int("id").autoincrement().primaryKey(),
  examName: varchar("examName", { length: 100 }).notNull(), // 모의고사, 중간고사, 기말고사 등
  examDate: datetime("examDate").notNull(), // 시작일
  examEndDate: datetime("examEndDate"), // 종료일 (기간 설정 시)
  subject: varchar("subject", { length: 100 }), // 과목 (국어, 영어, 수학 등)
  description: text("description"), // 설명
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExamSchedule = typeof examSchedules.$inferSelect;
export type InsertExamSchedule = typeof examSchedules.$inferInsert;

/**
 * AcademyEvents table: 학원 행사 및 이벤트
 * 휴원일, 행사, 공지사항 등을 캘린더에 표시
 */
export const academyEvents = mysqlTable("academyEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 100 }).notNull(), // 행사명
  eventDate: datetime("eventDate").notNull(), // 시작일
  eventEndDate: datetime("eventEndDate"), // 종료일 (기간 설정 시)
  eventType: mysqlEnum("eventType", ["holiday", "event", "notice", "other"]).default("other").notNull(),
  description: text("description"), // 설명
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademyEvent = typeof academyEvents.$inferSelect;
export type InsertAcademyEvent = typeof academyEvents.$inferInsert;

/**
 * TuitionPayments table: 수강료 수납 관리
 * 학생별 월별 수강료 납부 현황
 */
export const tuitionPayments = mysqlTable("tuitionPayments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 수강료
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0").notNull(), // 납부액
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  dueDate: datetime("dueDate"), // 납부기한
  paidDate: datetime("paidDate"), // 실제 납부일
  notes: text("notes"), // 메모
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TuitionPayment = typeof tuitionPayments.$inferSelect;
export type InsertTuitionPayment = typeof tuitionPayments.$inferInsert;
