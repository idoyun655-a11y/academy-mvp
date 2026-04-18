/**
 * 알림톡 시스템 v2 - 실서비스 수준 고도화
 * 
 * 특징:
 * - Provider Abstraction 패턴
 * - 여러 Provider 지원 (Mock, Kakao, SMS)
 * - 자동 재시도 로직
 * - 발송 로그 저장
 * - 이벤트 기반 자동 발송
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { notificationLogs } from "../drizzle/schema";

// ============================================================================
// 타입 정의
// ============================================================================

export type NotificationProvider = "mock" | "kakao" | "sms";

export type NotificationEventType =
  | "signup"           // 회원가입 완료
  | "class_start"      // 수업 시작 전
  | "payment_due"      // 결제일 도래
  | "payment_overdue"  // 미납 안내
  | "attendance"       // 출결 결과
  | "schedule"         // 상담 일정
  | "notice";          // 공지 등록

export interface NotificationTemplate {
  id: string;
  name: string;
  eventType: NotificationEventType;
  provider: NotificationProvider;
  templateCode: string;
  title: string;
  message: string;
  variables: string[]; // 템플릿 변수 목록
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPayload {
  recipientId: number;
  recipientPhone: string;
  recipientName: string;
  eventType: NotificationEventType;
  variables: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: NotificationProvider;
  timestamp: Date;
  retryCount?: number;
}

// ============================================================================
// Provider 인터페이스
// ============================================================================

export interface INotificationProvider {
  name: NotificationProvider;
  send(payload: NotificationPayload, template: NotificationTemplate): Promise<NotificationResult>;
  validate(): Promise<boolean>;
  getStatus(): Promise<{ connected: boolean; lastError?: string }>;
}

// ============================================================================
// Mock Provider (개발용)
// ============================================================================

export class MockNotificationProvider implements INotificationProvider {
  name: NotificationProvider = "mock";

  async send(payload: NotificationPayload, template: NotificationTemplate): Promise<NotificationResult> {
    console.log("[NOTIFICATION - MOCK]");
    console.log(`  Event: ${payload.eventType}`);
    console.log(`  Recipient: ${payload.recipientName} (${payload.recipientPhone})`);
    console.log(`  Template: ${template.name}`);
    console.log(`  Message: ${this.interpolateTemplate(template.message, payload.variables)}`);
    console.log(`  Variables:`, payload.variables);
    console.log("");

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      provider: "mock",
      timestamp: new Date(),
    };
  }

  async validate(): Promise<boolean> {
    return true;
  }

  async getStatus() {
    return { connected: true };
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return result;
  }
}

// ============================================================================
// Kakao AlimTalk Provider
// ============================================================================

export class KakaoNotificationProvider implements INotificationProvider {
  name: NotificationProvider = "kakao";
  private apiKey: string;
  private apiUrl: string = "https://kapi.kakao.com/v2/user/me";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KAKAO_ALIMTALK_API_KEY || "";
  }

  async send(payload: NotificationPayload, template: NotificationTemplate): Promise<NotificationResult> {
    if (!this.apiKey) {
      console.warn("[KAKAO] API 키가 설정되지 않았습니다. Mock 모드로 전환합니다.");
      return new MockNotificationProvider().send(payload, template);
    }

    try {
      const message = this.interpolateTemplate(template.message, payload.variables);

      // 실제 Kakao API 호출 (예시)
      const response = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          template_object: JSON.stringify({
            object_type: "text",
            text: message,
            link: {
              web_url: "https://academy.example.com",
              mobile_web_url: "https://academy.example.com",
            },
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Kakao API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("[KAKAO] 알림톡 발송 성공");
      console.log(`  Recipient: ${payload.recipientName}`);
      console.log(`  Message ID: ${data.result_id}`);

      return {
        success: true,
        messageId: data.result_id,
        provider: "kakao",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[KAKAO] 알림톡 발송 실패:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "kakao",
        timestamp: new Date(),
      };
    }
  }

  async validate(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getStatus() {
    const connected = await this.validate();
    return {
      connected,
      lastError: connected ? undefined : "API 키가 유효하지 않습니다",
    };
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return result;
  }
}

// ============================================================================
// SMS Provider
// ============================================================================

export class SMSNotificationProvider implements INotificationProvider {
  name: NotificationProvider = "sms";
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.SMS_API_KEY || "";
    this.apiUrl = apiUrl || process.env.SMS_API_URL || "https://api.sms-provider.com/send";
  }

  async send(payload: NotificationPayload, template: NotificationTemplate): Promise<NotificationResult> {
    if (!this.apiKey) {
      console.warn("[SMS] API 키가 설정되지 않았습니다. Mock 모드로 전환합니다.");
      return new MockNotificationProvider().send(payload, template);
    }

    try {
      const message = this.interpolateTemplate(template.message, payload.variables);

      // SMS 길이 제한 (한글 기준 90자)
      const truncatedMessage = message.length > 90 ? message.substring(0, 87) + "..." : message;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: payload.recipientPhone,
          message: truncatedMessage,
          type: "SMS",
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS API 오류: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("[SMS] SMS 발송 성공");
      console.log(`  Recipient: ${payload.recipientPhone}`);
      console.log(`  Message: ${truncatedMessage}`);

      return {
        success: true,
        messageId: data.messageId,
        provider: "sms",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[SMS] SMS 발송 실패:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "sms",
        timestamp: new Date(),
      };
    }
  }

  async validate(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getStatus() {
    return {
      connected: !!this.apiKey,
      lastError: this.apiKey ? undefined : "API 키가 설정되지 않았습니다",
    };
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return result;
  }
}

// ============================================================================
// 알림톡 서비스
// ============================================================================

export class NotificationService {
  private providers: Map<NotificationProvider, INotificationProvider>;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5초

  constructor() {
    this.providers = new Map();
    this.registerProvider("mock", new MockNotificationProvider());
    this.registerProvider("kakao", new KakaoNotificationProvider());
    this.registerProvider("sms", new SMSNotificationProvider());
  }

  /**
   * Provider 등록
   */
  registerProvider(name: NotificationProvider, provider: INotificationProvider): void {
    this.providers.set(name, provider);
    console.log(`[NOTIFICATION] Provider 등록: ${name}`);
  }

  /**
   * 알림톡 발송
   */
  async send(payload: NotificationPayload, template: NotificationTemplate): Promise<NotificationResult> {
    const provider = this.providers.get(template.provider);

    if (!provider) {
      console.error(`[NOTIFICATION] Provider를 찾을 수 없습니다: ${template.provider}`);
      return {
        success: false,
        error: `Provider를 찾을 수 없습니다: ${template.provider}`,
        provider: template.provider,
        timestamp: new Date(),
      };
    }

    let result: NotificationResult | null = null;
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
        result = await provider.send(payload, template);

        if (result.success) {
          // 발송 로그 저장
          await this.logNotification(payload, template, result);
          return result;
        }

        retryCount++;
        if (retryCount < this.maxRetries) {
          console.log(`[NOTIFICATION] 재시도 ${retryCount}/${this.maxRetries - 1}...`);
          await this.delay(this.retryDelay);
        }
      } catch (error) {
        console.error(`[NOTIFICATION] 발송 오류:`, error);
        retryCount++;
      }
    }

    // 모든 재시도 실패
    if (result) {
      result.retryCount = retryCount;
      await this.logNotification(payload, template, result);
      return result;
    }

    return {
      success: false,
      error: "모든 재시도 실패",
      provider: template.provider,
      timestamp: new Date(),
      retryCount,
    };
  }

  /**
   * 이벤트 기반 자동 발송
   */
  async sendByEvent(
    eventType: NotificationEventType,
    payload: NotificationPayload
  ): Promise<NotificationResult[]> {
    const db = await getDb();
    if (!db) {
      console.warn("[NOTIFICATION] DB를 사용할 수 없습니다");
      return [];
    }

    // 해당 이벤트의 템플릿 조회
    const templates = await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.eventType, eventType))
      .limit(10);

    const results: NotificationResult[] = [];

    for (const template of templates) {
      const result = await this.send(payload, {
        id: template.id,
        name: template.templateName,
        eventType: template.eventType as NotificationEventType,
        provider: template.provider as NotificationProvider,
        templateCode: template.templateCode,
        title: template.title,
        message: template.message,
        variables: JSON.parse(template.variables || "[]"),
        enabled: template.enabled,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Provider 상태 확인
   */
  async checkProviderStatus(): Promise<Record<string, { connected: boolean; lastError?: string }>> {
    const status: Record<string, { connected: boolean; lastError?: string }> = {};

    for (const [name, provider] of this.providers) {
      status[name] = await provider.getStatus();
    }

    return status;
  }

  /**
   * 발송 로그 저장
   */
  private async logNotification(
    payload: NotificationPayload,
    template: NotificationTemplate,
    result: NotificationResult
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      await db.insert(notificationLogs).values({
        recipientId: payload.recipientId,
        recipientPhone: payload.recipientPhone,
        recipientName: payload.recipientName,
        eventType: payload.eventType,
        templateName: template.name,
        templateCode: template.templateCode,
        title: template.title,
        message: template.message,
        variables: JSON.stringify(payload.variables),
        provider: result.provider,
        messageId: result.messageId || null,
        status: result.success ? "success" : "failed",
        error: result.error || null,
        sentAt: new Date(),
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("[NOTIFICATION] 로그 저장 실패:", error);
    }
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// 싱글톤 인스턴스
// ============================================================================

export const notificationService = new NotificationService();

// ============================================================================
// 사용 예시
// ============================================================================

/*
// 1. 직접 발송
const result = await notificationService.send(
  {
    recipientId: 1,
    recipientPhone: "010-1234-5678",
    recipientName: "김철수",
    eventType: "attendance",
    variables: {
      studentName: "김철수",
      className: "수학 기초반",
      date: "2024-02-12",
      status: "출석",
    },
  },
  {
    id: "template-1",
    name: "출결 결과 알림",
    eventType: "attendance",
    provider: "kakao",
    templateCode: "ATTENDANCE_RESULT",
    title: "출결 결과",
    message: "{{studentName}}님의 {{className}} 출결 결과: {{status}} ({{date}})",
    variables: ["studentName", "className", "date", "status"],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
);

// 2. 이벤트 기반 자동 발송
const results = await notificationService.sendByEvent("attendance", {
  recipientId: 1,
  recipientPhone: "010-1234-5678",
  recipientName: "김철수",
  eventType: "attendance",
  variables: {
    studentName: "김철수",
    className: "수학 기초반",
    date: "2024-02-12",
    status: "출석",
  },
});

// 3. Provider 상태 확인
const status = await notificationService.checkProviderStatus();
console.log(status);
// {
//   mock: { connected: true },
//   kakao: { connected: false, lastError: "API 키가 유효하지 않습니다" },
//   sms: { connected: false, lastError: "API 키가 설정되지 않았습니다" }
// }
*/
