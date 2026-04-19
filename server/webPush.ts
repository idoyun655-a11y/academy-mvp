import webpush from "web-push";
import {
  deleteWebPushSubscription,
  getNoticeById,
  getNoticeRecipientsForDelivery,
  getWebPushSubscriptionsByUserIds,
  upsertWebPushSubscription,
} from "./db";

type SupportedPortalRole = "student" | "parent";

type SerializedPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function getWebPushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    (process.env.DEFAULT_ADMIN_EMAIL
      ? `mailto:${process.env.DEFAULT_ADMIN_EMAIL.trim()}`
      : "");

  return {
    publicKey,
    privateKey,
    subject,
    configured: Boolean(publicKey && privateKey && subject),
  };
}

let configuredOnce = false;

function ensureWebPushConfigured() {
  const config = getWebPushConfig();
  if (!config.configured) {
    throw new Error("Web push is not configured");
  }

  if (!configuredOnce) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    configuredOnce = true;
  }

  return config;
}

function trimNoticeBody(content: string) {
  const normalized = String(content || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 137)}...`;
}

export function getWebPushStatus() {
  const config = getWebPushConfig();
  return {
    configured: config.configured,
    publicKey: config.publicKey || null,
    requiresPwaInstallOnIos: true,
  };
}

export async function savePortalWebPushSubscription(params: {
  userId: number;
  role: SupportedPortalRole;
  subscription: SerializedPushSubscription;
  userAgent?: string | null;
  deviceLabel?: string | null;
}) {
  ensureWebPushConfigured();

  const endpoint = params.subscription.endpoint?.trim();
  const p256dh = params.subscription.keys?.p256dh?.trim();
  const auth = params.subscription.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription");
  }

  await upsertWebPushSubscription({
    userId: params.userId,
    endpoint,
    p256dh,
    auth,
    userAgent: params.userAgent ?? null,
    deviceLabel: params.deviceLabel ?? params.role,
  });

  return { success: true };
}

export async function removePortalWebPushSubscription(params: {
  userId: number;
  endpoint: string;
}) {
  await deleteWebPushSubscription(params.userId, params.endpoint);
  return { success: true };
}

export async function sendNoticeWebPush(noticeId: number) {
  const config = getWebPushConfig();
  if (!config.configured) {
    return {
      enabled: false,
      sentCount: 0,
      failedCount: 0,
    };
  }

  ensureWebPushConfigured();

  const notice = await getNoticeById(noticeId);
  if (!notice || !notice.isPublished) {
    return {
      enabled: true,
      sentCount: 0,
      failedCount: 0,
    };
  }

  const recipients = await getNoticeRecipientsForDelivery(noticeId);
  if (recipients.length === 0) {
    return {
      enabled: true,
      sentCount: 0,
      failedCount: 0,
    };
  }

  const subscriptions = await getWebPushSubscriptionsByUserIds(
    recipients.map((recipient) => recipient.userId),
  );
  if (subscriptions.length === 0) {
    return {
      enabled: true,
      sentCount: 0,
      failedCount: 0,
    };
  }

  const recipientRouteMap = new Map<number, string>();
  recipients.forEach((recipient) => {
    recipientRouteMap.set(recipient.userId, recipient.route);
  });

  let sentCount = 0;
  let failedCount = 0;
  const body = trimNoticeBody(notice.content);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const payload = JSON.stringify({
          title: notice.title,
          body,
          noticeId: notice.id,
          url: recipientRouteMap.get(subscription.userId) || "/",
        });

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sentCount += 1;
      } catch (error: any) {
        failedCount += 1;
        const statusCode = Number(error?.statusCode ?? 0);
        if (statusCode === 404 || statusCode === 410) {
          await deleteWebPushSubscription(subscription.userId, subscription.endpoint);
        }
      }
    }),
  );

  return {
    enabled: true,
    sentCount,
    failedCount,
  };
}
