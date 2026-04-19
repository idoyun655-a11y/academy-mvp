import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { classEnrollments, notificationLogs, students, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getNextLocalId, readLocalStore, updateLocalStore } from "./localStore";
import { listStudentOps, type StudentOpsSavedView } from "./studentOps";

export type SmsAudienceScope = "selected_students" | "saved_view" | "class" | "all_active";
export type SmsRecipientKind = "student" | "parent";

export type SmsAudienceInput = {
  scope: SmsAudienceScope;
  studentIds?: number[];
  savedView?: StudentOpsSavedView;
  classId?: number;
  recipientKinds: SmsRecipientKind[];
};

export type NoticeSmsAudienceInput = {
  title?: string;
  message: string;
  targetRoles?: string[];
  targetClassIds?: number[];
  recipientKinds?: SmsRecipientKind[];
};

type StudentAudienceRow = {
  id: number;
  userId: number;
  name: string;
  phone?: string | null;
  parentPhone?: string | null;
  parentName?: string | null;
  lifecycleStatus?: string | null;
  deletedAt?: string | Date | null;
};

type ParentUserRow = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  deletedAt?: string | Date | null;
};

type EnrollmentRow = {
  studentId: number;
  classId: number;
  status?: string | null;
  deletedAt?: string | Date | null;
};

type SmsRecipient = {
  kind: SmsRecipientKind;
  recipientUserId: number;
  phone: string;
  studentId: number;
  studentName: string;
  parentName?: string | null;
  userName?: string | null;
};

function isActiveRecord(record: { deletedAt?: string | Date | null } | undefined) {
  return Boolean(record) && !record?.deletedAt;
}

function compactPhone(phone?: string | null) {
  return typeof phone === "string" ? phone.trim() : "";
}

function uniqueBy<T>(items: T[], keyFactory: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFactory(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deriveRecipientKindsFromRoles(targetRoles?: string[]) {
  const normalizedRoles = Array.isArray(targetRoles) ? targetRoles : [];
  const recipientKinds = new Set<SmsRecipientKind>();

  if (normalizedRoles.length === 0) {
    recipientKinds.add("student");
    recipientKinds.add("parent");
    return Array.from(recipientKinds);
  }

  if (normalizedRoles.includes("student")) {
    recipientKinds.add("student");
  }
  if (normalizedRoles.includes("parent")) {
    recipientKinds.add("parent");
  }

  return Array.from(recipientKinds);
}

function getSmsProviderStatus() {
  const webhookUrl = process.env.SMS_WEBHOOK_URL?.trim();
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFromNumber = process.env.TWILIO_FROM_NUMBER?.trim();

  if (webhookUrl) {
    return {
      configured: true,
      provider: "webhook" as const,
      label: "Webhook",
    };
  }

  if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
    return {
      configured: true,
      provider: "twilio" as const,
      label: "Twilio",
    };
  }

  return {
    configured: false,
    provider: "none" as const,
    label: "Not configured",
  };
}

async function loadAudienceCollections() {
  const db = await getDb();

  if (!db) {
    const store = await readLocalStore();
    return {
      students: (store.students.filter((student) => isActiveRecord(student)) ??
        []) as StudentAudienceRow[],
      parents: (store.users.filter(
        (user) => isActiveRecord(user) && user.role === "parent" && user.isActive !== false,
      ) ?? []) as ParentUserRow[],
      enrollments: (store.classEnrollments.filter(
        (entry) =>
          isActiveRecord(entry) &&
          entry.status === "active",
      ) ?? []) as EnrollmentRow[],
    };
  }

  const [studentRows, parentRows, enrollmentRows] = await Promise.all([
    db
      .select({
        id: students.id,
        userId: students.userId,
        name: students.name,
        phone: students.phone,
        parentPhone: students.parentPhone,
        parentName: students.parentName,
        lifecycleStatus: students.lifecycleStatus,
        deletedAt: students.deletedAt,
      })
      .from(students)
      .where(isNull(students.deletedAt)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(and(eq(users.role, "parent"), isNull(users.deletedAt), eq(users.isActive, true))),
    db
      .select({
        studentId: classEnrollments.studentId,
        classId: classEnrollments.classId,
        status: classEnrollments.status,
        deletedAt: classEnrollments.deletedAt,
      })
      .from(classEnrollments)
      .where(and(isNull(classEnrollments.deletedAt), eq(classEnrollments.status, "active"))),
  ]);

  return {
    students: studentRows as StudentAudienceRow[],
    parents: parentRows as ParentUserRow[],
    enrollments: enrollmentRows as EnrollmentRow[],
  };
}

async function resolveAudienceStudents(input: SmsAudienceInput) {
  const collections = await loadAudienceCollections();
  let filteredStudents = collections.students.filter((student) => student.lifecycleStatus !== "ended");

  if (input.scope === "selected_students") {
    const selectedIds = new Set((input.studentIds ?? []).map(Number));
    filteredStudents = filteredStudents.filter((student) => selectedIds.has(student.id));
  } else if (input.scope === "class") {
    const classId = Number(input.classId ?? 0);
    if (!classId) {
      filteredStudents = [];
    } else {
      const studentIds = new Set(
        collections.enrollments
          .filter((entry) => entry.classId === classId)
          .map((entry) => entry.studentId),
      );
      filteredStudents = filteredStudents.filter((student) => studentIds.has(student.id));
    }
  } else if (input.scope === "saved_view") {
    const savedView = input.savedView ?? "all";
    const opsRows = await listStudentOps({
      limit: 2000,
      offset: 0,
      savedView,
      sortBy: "default",
      sortOrder: "asc",
    });
    const studentIds = new Set(opsRows.data.map((student) => Number(student.id)));
    filteredStudents = filteredStudents.filter((student) => studentIds.has(student.id));
  }

  return {
    students: filteredStudents,
    parents: collections.parents,
  };
}

async function resolveNoticeAudienceStudents(input: NoticeSmsAudienceInput) {
  const collections = await loadAudienceCollections();
  let filteredStudents = collections.students.filter((student) => student.lifecycleStatus !== "ended");

  const targetClassIds = Array.from(
    new Set(
      (input.targetClassIds ?? [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  if (targetClassIds.length > 0) {
    const studentIds = new Set(
      collections.enrollments
        .filter((entry) => targetClassIds.includes(entry.classId))
        .map((entry) => entry.studentId),
    );
    filteredStudents = filteredStudents.filter((student) => studentIds.has(student.id));
  }

  return {
    students: filteredStudents,
    parents: collections.parents,
    recipientKinds:
      input.recipientKinds && input.recipientKinds.length > 0
        ? input.recipientKinds
        : deriveRecipientKindsFromRoles(input.targetRoles),
  };
}

function buildSmsRecipients(
  studentsToNotify: StudentAudienceRow[],
  parentUsers: ParentUserRow[],
  recipientKinds: SmsRecipientKind[],
) {
  const recipients: SmsRecipient[] = [];

  for (const student of studentsToNotify) {
    const studentPhone = compactPhone(student.phone);
    const parentPhone = compactPhone(student.parentPhone);
    const matchedParentUser =
      parentUsers.find(
        (parentUser) =>
          (parentPhone && compactPhone(parentUser.phone) === parentPhone) ||
          (student.parentName &&
            parentUser.name &&
            student.parentName.trim() === String(parentUser.name).trim()),
      ) ?? null;

    if (recipientKinds.includes("student") && studentPhone) {
      recipients.push({
        kind: "student",
        recipientUserId: Number(student.userId ?? 0) || 0,
        phone: studentPhone,
        studentId: student.id,
        studentName: student.name,
        parentName: student.parentName ?? null,
        userName: student.name,
      });
    }

    if (recipientKinds.includes("parent") && parentPhone) {
      recipients.push({
        kind: "parent",
        recipientUserId: matchedParentUser?.id ?? 0,
        phone: parentPhone,
        studentId: student.id,
        studentName: student.name,
        parentName: student.parentName ?? matchedParentUser?.name ?? null,
        userName: matchedParentUser?.name ?? student.parentName ?? null,
      });
    }
  }

  return uniqueBy(recipients, (recipient) => `${recipient.kind}:${recipient.phone}`);
}

async function dispatchSmsMessage(recipient: SmsRecipient, message: string, title?: string) {
  const status = getSmsProviderStatus();

  if (!status.configured) {
    throw new Error("SMS provider is not configured.");
  }

  if (status.provider === "webhook") {
    const webhookUrl = process.env.SMS_WEBHOOK_URL!.trim();
    const webhookToken = process.env.SMS_WEBHOOK_TOKEN?.trim();
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
      },
      body: JSON.stringify({
        to: recipient.phone,
        body: message,
        title: title || null,
        recipientType: recipient.kind,
        recipientUserId: recipient.recipientUserId,
        studentId: recipient.studentId,
        studentName: recipient.studentName,
        parentName: recipient.parentName ?? null,
      }),
    });

    const payload = await response
      .json()
      .catch(async () => ({ raw: await response.text().catch(() => "") }));

    if (!response.ok) {
      throw new Error(
        typeof payload?.message === "string"
          ? payload.message
          : `Webhook SMS failed with status ${response.status}.`,
      );
    }

    return {
      provider: status.provider,
      externalId:
        payload?.messageId ??
        payload?.sid ??
        payload?.id ??
        null,
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER!.trim();
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: recipient.phone,
    From: fromNumber,
    Body: message,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const payload = await response
    .json()
    .catch(async () => ({ raw: await response.text().catch(() => "") }));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === "string"
        ? payload.message
        : `Twilio SMS failed with status ${response.status}.`,
    );
  }

  return {
    provider: status.provider,
    externalId: payload?.sid ?? null,
  };
}

async function persistNotificationLog(log: {
  recipientUserId: number;
  recipientPhone: string;
  status: "pending" | "sent" | "failed" | "bounced";
  content: string;
  errorMessage?: string | null;
  externalId?: string | null;
  sentAt?: Date | null;
}) {
  const db = await getDb();

  if (!db) {
    return updateLocalStore((store) => {
      const now = new Date().toISOString();
      store.notificationLogs.push({
        id: getNextLocalId(store, "notificationLogs"),
        templateId: 0,
        recipientUserId: log.recipientUserId,
        recipientPhone: log.recipientPhone,
        provider: "sms",
        status: log.status,
        content: log.content,
        errorMessage: log.errorMessage ?? null,
        externalId: log.externalId ?? null,
        sentAt: log.sentAt ? log.sentAt.toISOString() : null,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    });
  }

  await db.insert(notificationLogs).values({
    templateId: 0,
    recipientUserId: log.recipientUserId,
    recipientPhone: log.recipientPhone,
    provider: "sms",
    status: log.status,
    content: log.content,
    errorMessage: log.errorMessage ?? null,
    externalId: log.externalId ?? null,
    sentAt: log.sentAt ?? null,
  });
}

async function sendSmsToResolvedRecipients(
  recipients: SmsRecipient[],
  payload: { title?: string; message: string },
) {
  if (recipients.length === 0) {
    throw new Error("There are no recipients with phone numbers in the selected audience.");
  }

  let sentCount = 0;
  let failedCount = 0;
  const failures: Array<{ phone: string; reason: string }> = [];

  for (let index = 0; index < recipients.length; index += 5) {
    const chunk = recipients.slice(index, index + 5);
    const chunkResults = await Promise.all(
      chunk.map(async (recipient) => {
        try {
          const dispatchResult = await dispatchSmsMessage(recipient, payload.message, payload.title);
          await persistNotificationLog({
            recipientUserId: recipient.recipientUserId,
            recipientPhone: recipient.phone,
            status: "sent",
            content: payload.message,
            externalId: dispatchResult.externalId,
            sentAt: new Date(),
          });
          return { success: true as const };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown SMS error";
          await persistNotificationLog({
            recipientUserId: recipient.recipientUserId,
            recipientPhone: recipient.phone,
            status: "failed",
            content: payload.message,
            errorMessage: reason,
            sentAt: null,
          });
          return {
            success: false as const,
            phone: recipient.phone,
            reason,
          };
        }
      }),
    );

    chunkResults.forEach((result) => {
      if (result.success) {
        sentCount += 1;
        return;
      }

      failedCount += 1;
      failures.push({
        phone: result.phone,
        reason: result.reason,
      });
    });
  }

  return {
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    failures: failures.slice(0, 20),
  };
}

export async function getSmsStatus() {
  const provider = getSmsProviderStatus();
  return {
    ...provider,
    supportsLiveSend: provider.configured,
  };
}

export async function previewSmsAudience(input: SmsAudienceInput) {
  const { students: audienceStudents, parents } = await resolveAudienceStudents(input);
  const recipients = buildSmsRecipients(audienceStudents, parents, input.recipientKinds);
  const studentPhoneCount = recipients.filter((recipient) => recipient.kind === "student").length;
  const parentPhoneCount = recipients.filter((recipient) => recipient.kind === "parent").length;

  return {
    totalStudents: audienceStudents.length,
    totalRecipients: recipients.length,
    studentPhoneCount,
    parentPhoneCount,
    sampleRecipients: recipients.slice(0, 12).map((recipient) => ({
      kind: recipient.kind,
      phone: recipient.phone,
      studentName: recipient.studentName,
      userName: recipient.userName ?? null,
    })),
    providerStatus: await getSmsStatus(),
  };
}

export async function sendBulkSmsMessage(
  input: SmsAudienceInput & { title?: string; message: string },
) {
  const provider = getSmsProviderStatus();
  if (!provider.configured) {
    throw new Error("SMS provider is not configured. Set SMS_WEBHOOK_URL or Twilio variables first.");
  }

  const { students: audienceStudents, parents } = await resolveAudienceStudents(input);
  const recipients = buildSmsRecipients(audienceStudents, parents, input.recipientKinds);
  const sendResult = await sendSmsToResolvedRecipients(recipients, {
    title: input.title,
    message: input.message,
  });

  return {
    provider: provider.provider,
    requestedStudentCount: audienceStudents.length,
    recipientCount: sendResult.recipientCount,
    sentCount: sendResult.sentCount,
    failedCount: sendResult.failedCount,
    failures: sendResult.failures,
  };
}

export async function sendNoticeAudienceSms(input: NoticeSmsAudienceInput) {
  const provider = getSmsProviderStatus();
  if (!provider.configured) {
    throw new Error("SMS provider is not configured. Set SMS_WEBHOOK_URL or Twilio variables first.");
  }

  const { students: audienceStudents, parents, recipientKinds } =
    await resolveNoticeAudienceStudents(input);
  if (recipientKinds.length === 0) {
    throw new Error("This notice does not target student or parent recipients for SMS.");
  }

  const recipients = buildSmsRecipients(audienceStudents, parents, recipientKinds);
  const sendResult = await sendSmsToResolvedRecipients(recipients, {
    title: input.title,
    message: input.message,
  });

  return {
    provider: provider.provider,
    requestedStudentCount: audienceStudents.length,
    recipientKinds,
    recipientCount: sendResult.recipientCount,
    sentCount: sendResult.sentCount,
    failedCount: sendResult.failedCount,
    failures: sendResult.failures,
  };
}

export async function listNotificationLogs(input: { limit: number; offset: number }) {
  const db = await getDb();

  if (!db) {
    const store = await readLocalStore();
    const items = [...(store.notificationLogs ?? [])]
      .sort(
        (left, right) =>
          new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime(),
      )
      .slice(input.offset, input.offset + input.limit)
      .map((log) => {
        const user = (store.users ?? []).find((candidate) => candidate.id === log.recipientUserId);
        return {
          id: log.id,
          recipientUserId: log.recipientUserId,
          recipientName: user?.name ?? null,
          recipientPhone: log.recipientPhone,
          provider: log.provider,
          status: log.status,
          content: log.content,
          errorMessage: log.errorMessage ?? null,
          externalId: log.externalId ?? null,
          sentAt: log.sentAt ?? null,
          createdAt: log.createdAt ?? null,
        };
      });

    return {
      data: items,
      total: (store.notificationLogs ?? []).length,
      limit: input.limit,
      offset: input.offset,
    };
  }

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: notificationLogs.id,
        recipientUserId: notificationLogs.recipientUserId,
        recipientName: users.name,
        recipientPhone: notificationLogs.recipientPhone,
        provider: notificationLogs.provider,
        status: notificationLogs.status,
        content: notificationLogs.content,
        errorMessage: notificationLogs.errorMessage,
        externalId: notificationLogs.externalId,
        sentAt: notificationLogs.sentAt,
        createdAt: notificationLogs.createdAt,
      })
      .from(notificationLogs)
      .leftJoin(users, eq(users.id, notificationLogs.recipientUserId))
      .orderBy(desc(notificationLogs.createdAt))
      .limit(input.limit)
      .offset(input.offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(notificationLogs),
  ]);

  return {
    data: rows,
    total: Number(countRows[0]?.count ?? 0),
    limit: input.limit,
    offset: input.offset,
  };
}
