const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
const KAKAO_SDK_INTEGRITY =
  "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J";

const kakaoJavascriptKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";
const kakaoShareUrl = import.meta.env.VITE_KAKAO_SHARE_URL?.trim() ?? "";

type KakaoLink = {
  mobileWebUrl: string;
  webUrl: string;
};

type KakaoShareOptions = {
  objectType: "text";
  text: string;
  link: KakaoLink;
  buttonTitle?: string;
};

type KakaoSdk = {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (options: KakaoShareOptions) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export type KakaoNoticeShareDraft = {
  title: string;
  content: string;
  url?: string;
};

let kakaoLoadPromise: Promise<KakaoSdk> | null = null;

function getResolvedShareUrl(url?: string) {
  if (url?.trim()) return url.trim();
  if (kakaoShareUrl) return kakaoShareUrl;
  if (typeof window !== "undefined") return `${window.location.origin}/login`;
  return "";
}

function ensureKakaoInitialized(kakao: KakaoSdk) {
  if (!kakaoJavascriptKey) {
    throw new Error("카카오 JavaScript 키가 설정되지 않았습니다.");
  }

  if (!kakao.isInitialized()) {
    kakao.init(kakaoJavascriptKey);
  }

  return kakao;
}

function buildKakaoSharePayload(draft: KakaoNoticeShareDraft): KakaoShareOptions {
  const shareUrl = getResolvedShareUrl(draft.url);
  const text = `[학원 공지] ${draft.title}\n\n${draft.content.trim()}`;

  return {
    objectType: "text",
    text,
    link: {
      mobileWebUrl: shareUrl,
      webUrl: shareUrl,
    },
    buttonTitle: "학원 사이트 열기",
  };
}

function waitForExistingScript(existingScript: HTMLScriptElement) {
  return new Promise<KakaoSdk>((resolve, reject) => {
    const resolveKakao = () => {
      if (!window.Kakao) {
        reject(new Error("카카오 SDK를 찾지 못했습니다."));
        return;
      }

      try {
        resolve(ensureKakaoInitialized(window.Kakao));
      } catch (error) {
        reject(error);
      }
    };

    existingScript.addEventListener("load", resolveKakao, { once: true });
    existingScript.addEventListener(
      "error",
      () => reject(new Error("카카오 SDK를 불러오지 못했습니다.")),
      { once: true },
    );
  });
}

async function loadKakaoSdk() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("브라우저 환경에서만 카카오 공유를 사용할 수 있습니다.");
  }

  if (!kakaoJavascriptKey) {
    throw new Error("카카오 JavaScript 키가 설정되지 않았습니다.");
  }

  if (window.Kakao) {
    return ensureKakaoInitialized(window.Kakao);
  }

  if (kakaoLoadPromise) {
    return kakaoLoadPromise;
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
  if (existingScript) {
    kakaoLoadPromise = waitForExistingScript(existingScript).finally(() => {
      kakaoLoadPromise = null;
    });
    return kakaoLoadPromise;
  }

  kakaoLoadPromise = new Promise<KakaoSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.dataset.kakaoSdk = "true";
    script.integrity = KAKAO_SDK_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (!window.Kakao) {
        reject(new Error("카카오 SDK가 로드되었지만 객체를 찾지 못했습니다."));
        return;
      }

      try {
        resolve(ensureKakaoInitialized(window.Kakao));
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => {
      reject(new Error("카카오 SDK를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  }).finally(() => {
    kakaoLoadPromise = null;
  });

  return kakaoLoadPromise;
}

export function isKakaoShareConfigured() {
  return Boolean(kakaoJavascriptKey);
}

export async function preloadKakaoShareSdk() {
  if (!isKakaoShareConfigured()) return null;
  return loadKakaoSdk();
}

export function isKakaoShareReady() {
  return Boolean(window.Kakao && kakaoJavascriptKey);
}

export function openKakaoNoticeShare(draft: KakaoNoticeShareDraft) {
  if (typeof window === "undefined") {
    throw new Error("브라우저 환경에서만 카카오 공유를 사용할 수 있습니다.");
  }

  if (!window.Kakao) {
    throw new Error("카카오 공유 SDK가 아직 준비되지 않았습니다.");
  }

  const kakao = ensureKakaoInitialized(window.Kakao);
  kakao.Share.sendDefault(buildKakaoSharePayload(draft));
}

export async function shareNoticeViaKakao(draft: KakaoNoticeShareDraft) {
  const kakao = await loadKakaoSdk();
  kakao.Share.sendDefault(buildKakaoSharePayload(draft));
}
