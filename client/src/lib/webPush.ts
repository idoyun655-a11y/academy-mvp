function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function isWebPushSupported() {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    window.isSecureContext
  );
}

export function isIosLikeDevice() {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerPushServiceWorker() {
  if (!isWebPushSupported()) {
    throw new Error("Web push is not supported in this browser.");
  }

  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    return navigator.serviceWorker.ready;
  }

  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function getExistingPushSubscription() {
  if (!isWebPushSupported()) return null;
  const registration = await registerPushServiceWorker();
  return registration.pushManager.getSubscription();
}

export async function ensurePushSubscription(publicKey: string) {
  const registration = await registerPushServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export async function removePushSubscription() {
  const existing = await getExistingPushSubscription();
  if (!existing) return null;
  const endpoint = existing.endpoint;
  await existing.unsubscribe();
  return endpoint;
}
