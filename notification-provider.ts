/**
 * 알림톡 Provider Abstraction
 * 향후 다른 알림 서비스로 쉽게 교체할 수 있도록 추상화된 구조
 */

export interface NotificationMessage {
  recipientPhone: string;
  recipientName?: string;
  templateId?: string;
  content: string;
  variables?: Record<string, string | number>;
}

export interface NotificationSendResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface NotificationProvider {
  name: string;
  send(message: NotificationMessage): Promise<NotificationSendResult>;
}

/**
 * 카카오 알림톡 Provider
 * 실제 구현에서는 카카오 API를 호출합니다.
 */
export class KakaoTalkProvider implements NotificationProvider {
  name = "kakao_talk";
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = "https://api.kakaoalim.com") {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    try {
      console.log(`[KakaoTalk] Sending message to ${message.recipientPhone}`);
      console.log(`[KakaoTalk] Content: ${message.content}`);

      // Mock 응답
      return {
        success: true,
        externalId: `kakao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      console.error(`[KakaoTalk] Error sending message:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * SMS Provider
 * 카카오 알림톡 실패 시 SMS로 대체
 */
export class SMSProvider implements NotificationProvider {
  name = "sms";
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = "https://api.sms.com") {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    try {
      console.log(`[SMS] Sending message to ${message.recipientPhone}`);
      console.log(`[SMS] Content: ${message.content}`);

      // Mock 응답
      return {
        success: true,
        externalId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      console.error(`[SMS] Error sending message:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Email Provider
 */
export class EmailProvider implements NotificationProvider {
  name = "email";
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = "https://api.email.com") {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    try {
      console.log(`[Email] Sending message to ${message.recipientPhone}`);
      console.log(`[Email] Content: ${message.content}`);

      // Mock 응답
      return {
        success: true,
        externalId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      console.error(`[Email] Error sending message:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * 알림 서비스 (Provider 추상화)
 */
export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();
  private defaultProvider: string = "kakao_talk";

  constructor() {
    const kakaoApiKey = process.env.KAKAO_ALIM_API_KEY || "test-key";
    const smsApiKey = process.env.SMS_API_KEY || "test-key";
    const emailApiKey = process.env.EMAIL_API_KEY || "test-key";

    this.registerProvider(new KakaoTalkProvider(kakaoApiKey));
    this.registerProvider(new SMSProvider(smsApiKey));
    this.registerProvider(new EmailProvider(emailApiKey));
  }

  registerProvider(provider: NotificationProvider) {
    this.providers.set(provider.name, provider);
  }

  setDefaultProvider(providerName: string) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider '${providerName}' not found`);
    }
    this.defaultProvider = providerName;
  }

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider '${this.defaultProvider}' not found`);
    }
    return provider.send(message);
  }

  async sendWithProvider(providerName: string, message: NotificationMessage): Promise<NotificationSendResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }
    return provider.send(message);
  }

  async sendWithFallback(message: NotificationMessage, providerNames: string[]): Promise<NotificationSendResult> {
    for (const providerName of providerNames) {
      const result = await this.sendWithProvider(providerName, message);
      if (result.success) {
        return result;
      }
    }
    return {
      success: false,
      error: "All providers failed",
    };
  }
}

export const notificationService = new NotificationService();
