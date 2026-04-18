import { COOKIE_NAME } from "@shared/const";

export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

function isHttps() {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function setBrowserSessionCookie(token: string) {
  if (typeof document === "undefined" || !token) return;

  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (isHttps()) {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}

export function clearBrowserSessionCookie() {
  if (typeof document === "undefined") return;

  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "SameSite=Lax",
  ];

  if (isHttps()) {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}

export function syncBrowserSessionFromStorage() {
  if (typeof window === "undefined") return;

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) return;

  setBrowserSessionCookie(token);
}
