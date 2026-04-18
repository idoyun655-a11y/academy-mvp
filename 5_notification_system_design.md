# 학원 운영 통합 시스템: 알림톡 시스템 상세 설계

본 문서는 학원 운영 통합 시스템의 자동 알림톡 발송 시스템을 상세히 설계합니다. 특정 메시징 서비스에 종속되지 않는 Provider Abstraction 구조를 채택하여 유연성과 확장성을 확보하며, 카카오 알림톡 연동을 중심으로 구체적인 템플릿 변수 예시와 발송 플로우를 제시합니다. 에러 처리, 재시도 로직, 발송 이력 관리 등 안정적인 운영을 위한 방안도 포함합니다.

## 1. 알림톡 시스템 개요

알림톡 시스템은 학원 운영 중 발생하는 다양한 이벤트(예: 수업 시작, 결제일 도래, 공지사항 등록)에 대해 학생 및 학부모에게 자동으로 알림 메시지를 발송하는 역할을 합니다. 이를 통해 학원과 사용자 간의 소통을 원활하게 하고, 중요한 정보를 적시에 전달하여 운영 효율성과 사용자 만족도를 높입니다.

### 1.1. 주요 기능

*   **자동 발송**: 특정 이벤트 발생 시 사전 정의된 템플릿에 따라 자동으로 알림톡 발송.
*   **수동 발송**: 관리자가 특정 대상에게 직접 알림톡 발송.
*   **템플릿 관리**: 관리자 페이지에서 알림톡 템플릿 생성, 수정, 삭제 및 변수 설정.
*   **발송 대상 선택**: 전체, 반별, 개별 학생/학부모 등 유연한 발송 대상 지정.
*   **메시지 변수 치환**: 템플릿 내 동적 변수(학생명, 반명, 시간 등)를 실제 데이터로 치환하여 발송.
*   **발송 이력 관리**: 발송된 알림톡의 성공/실패 여부 및 상세 이력 기록.
*   **에러 처리 및 재시도**: 발송 실패 시 재시도 로직 및 에러 알림.
*   **Provider Abstraction**: 특정 메시징 서비스(예: 카카오 알림톡)에 종속되지 않는 유연한 구조.

## 2. Provider Abstraction 구조

알림톡 시스템은 메시징 서비스 제공자(Provider)에 대한 추상화 계층을 두어, 향후 다른 문자/알림 서비스(예: SMS, 푸시 알림, 다른 알림톡 서비스)로의 확장을 용이하게 합니다. 핵심은 `NotificationService` 인터페이스와 이를 구현하는 `KakaoTalkService`와 같은 구체적인 서비스 클래스입니다.

### 2.1. 인터페이스 정의

`INotificationService` 인터페이스는 모든 알림 서비스 제공자가 구현해야 할 표준 메서드를 정의합니다.

```typescript
// 백엔드 (Node.js 또는 Python) 예시
interface INotificationService {
  send(templateCode: string, recipient: string, variables: Record<string, string>): Promise<NotificationResult>;
  sendBulk(templateCode: string, recipients: string[], variables: Record<string, string>): Promise<NotificationResult[]>;
  // 템플릿 관리 관련 메서드도 포함 가능
  // getTemplate(templateCode: string): Promise<NotificationTemplate>;
  // createTemplate(template: NotificationTemplate): Promise<NotificationTemplate>;
}

interface NotificationResult {
  success: boolean;
  recipient: string;
  messageId?: string;
  errorMessage?: string;
}

// 템플릿 변수 구조 예시
interface NotificationTemplate {
  code: string;
  name: string;
  content: string; // 예: 안녕하세요 #{학생명}님, #{반명} 수업이 #{수업시간}에 시작됩니다.
  requiredVariables: string[]; // 예: ['학생명', '반명', '수업시간']
  providerTemplateId?: string; // 카카오 알림톡 템플릿 ID 등
}
```

### 2.2. 카카오 알림톡 서비스 구현체 예시

`KakaoTalkService`는 `INotificationService` 인터페이스를 구현하며, 실제 카카오 알림톡 API와 연동하는 로직을 포함합니다.

```typescript
// 백엔드 (Node.js 또는 Python) 예시
class KakaoTalkService implements INotificationService {
  private kakaoApiConfig: any; // 카카오 API 연동 설정

  constructor(config: any) {
    this.kakaoApiConfig = config;
  }

  async send(templateCode: string, recipient: string, variables: Record<string, string>): Promise<NotificationResult> {
    try {
      // 템플릿 코드와 변수를 사용하여 카카오 알림톡 메시지 구성
      const template = await this.getTemplateFromDB(templateCode); // DB에서 템플릿 정보 조회
      let messageContent = template.content;
      for (const key in variables) {
        messageContent = messageContent.replace(new RegExp(key, 'g'), variables[key]);
      }

      // 실제 카카오 알림톡 API 호출 로직
      const response = await callKakaoTalkApi({
        template_id: template.providerTemplateId,
        receiver_number: recipient,
        message: messageContent,
        // ... 기타 카카오 API 파라미터
      });

      if (response.success) {
        return { success: true, recipient, messageId: response.messageId };
      }
      return { success: false, recipient, errorMessage: response.errorMessage };
    } catch (error: any) {
      return { success: false, recipient, errorMessage: error.message };
    }
  }

  async sendBulk(templateCode: string, recipients: string[], variables: Record<string, string>): Promise<NotificationResult[]> {
    // 여러 수신자에게 일괄 발송하는 로직 (카카오 API의 일괄 발송 기능 활용 또는 개별 발송 반복)
    const results: NotificationResult[] = [];
    for (const recipient of recipients) {
      results.push(await this.send(templateCode, recipient, variables));
    }
    return results;
  }

  private async getTemplateFromDB(templateCode: string): Promise<NotificationTemplate> {
    // 데이터베이스에서 템플릿 정보를 조회하는 로직
    // 예시: SELECT * FROM notification_templates WHERE code = templateCode
    return { 
      code: templateCode, 
      name: '수업 시작 알림', 
      content: '안녕하세요 #{학생명}님, #{반명} 수업이 #{수업시간}에 시작됩니다.',
      requiredVariables: ['#{학생명}', '#{반명}', '#{수업시간}'],
      providerTemplateId: 'KA_CLASS_REMINDER_001' // 카카오 알림톡에 등록된 템플릿 ID
    };
  }
}
```

### 2.3. Provider 선택 및 주입

애플리케이션은 런타임에 어떤 `INotificationService` 구현체를 사용할지 결정하고 주입(Dependency Injection)합니다. 이를 통해 설정 변경만으로 다른 메시징 서비스로 전환할 수 있습니다.

```typescript
// 백엔드 (Node.js 또는 Python) 예시
// 환경 변수 또는 설정 파일에 따라 서비스 인스턴스 생성
const notificationService: INotificationService = new KakaoTalkService(process.env.KAKAO_API_CONFIG);

// 서비스 사용 예시
notificationService.send(
  'KA_CLASS_REMINDER',
  '010-1234-5678',
  { '#{학생명}': '김철수', '#{반명}': '중등 영어 A반', '#{수업시간}': '19:00' }
);
```

## 3. 알림톡 발송 플로우

알림톡 발송은 크게 자동 발송과 수동 발송으로 나뉩니다.

### 3.1. 자동 발송 플로우

1.  **이벤트 발생**: 시스템 내에서 알림톡 발송을 트리거하는 이벤트 발생 (예: 수업 등록, 출결 기록, 공지사항 등록).
2.  **이벤트 리스너/스케줄러**: 이벤트 리스너가 이벤트를 감지하거나, 스케줄러가 주기적으로 특정 조건을 확인 (예: 수업 시작 1시간 전).
3.  **메시지 생성 요청**: 백엔드 서비스는 `NotificationService`를 통해 알림톡 발송을 요청합니다. 이때, `templateCode`, `recipient` (수신자 전화번호), `variables` (템플릿 변수)를 전달합니다.
4.  **템플릿 조회 및 변수 치환**: `NotificationService`는 데이터베이스에서 `templateCode`에 해당하는 템플릿을 조회하고, `variables`를 사용하여 메시지 내용을 완성합니다.
5.  **외부 API 호출**: `NotificationService`는 구성된 메시지 내용을 바탕으로 카카오 알림톡 API를 호출합니다.
6.  **발송 결과 처리**: 카카오 알림톡 API의 응답을 받아 발송 성공/실패 여부를 확인합니다.
7.  **발송 이력 저장**: 발송 결과 및 상세 정보를 `kakao_message_logs` 테이블에 기록합니다.
8.  **실패 시 재시도**: 발송 실패 시, 정의된 재시도 정책에 따라 일정 시간 후 재시도를 수행합니다.

### 3.2. 수동 발송 플로우

1.  **관리자 요청**: 관리자가 관리자 웹 대시보드에서 알림톡 수동 발송 기능을 사용합니다.
2.  **발송 정보 입력**: 관리자는 `템플릿 선택`, `발송 대상 선택` (전체, 반별, 개별), `변수 값 입력` (템플릿에 따라), `발송 시점` (즉시, 예약) 등을 입력합니다.
3.  **메시지 생성 요청**: 관리자 웹은 백엔드 API (`POST /notifications/send-kakao`)를 호출하여 알림톡 발송을 요청합니다.
4.  **백엔드 처리**: 자동 발송 플로우의 4단계부터 8단계와 동일하게 처리됩니다.

## 4. 템플릿 관리

관리자 웹 대시보드에서 알림톡 템플릿을 생성, 수정, 삭제할 수 있는 기능을 제공합니다. 템플릿은 `notification_templates` 테이블에 저장되며, 각 템플릿은 고유한 `template_code`를 가집니다.

### 4.1. 템플릿 관리 화면 (와이어프레임)

*   **목표**: 알림톡 템플릿을 생성, 조회, 수정, 삭제.
*   **레이아웃**: 좌측 사이드바, 상단 헤더, 메인 콘텐츠 영역. 메인 콘텐츠는 템플릿 목록, 템플릿 상세/등록 폼으로 구성.
*   **주요 UI 요소**: 
    *   **템플릿 목록**: 테이블 또는 카드형 리스트. `템플릿 코드`, `템플릿 이름`, `등록일`.
    *   **액션 버튼**: `새 템플릿 작성` (Primary 버튼).
    *   **템플릿 상세/등록 폼**: 모달 또는 별도 페이지. `템플릿 코드`, `템플릿 이름`, `메시지 내용` (변수 포함), `필수 변수 목록`, `카카오 알림톡 템플릿 ID` 등 입력 필드.

## 5. 카카오 알림톡 템플릿 변수 예시

카카오 알림톡 템플릿은 메시지 내용에 동적으로 치환될 수 있는 변수를 포함할 수 있습니다. 변수는 `#{변수명}` 형식으로 사용됩니다. 다음은 5가지 이상의 템플릿 변수 예시입니다.

1.  **수업 시작 알림**: `#{학생명}`님, `#{반명}` 수업이 `#{수업시간}`에 시작됩니다. 늦지 않게 등원해주세요.
    *   **변수**: `#{학생명}`, `#{반명}`, `#{수업시간}`
2.  **결제일 도래 알림**: `#{학생명}` 학부모님, `#{반명}` 수강료 `#{결제금액}`원의 결제일이 `#{결제예정일}`입니다. 확인 부탁드립니다.
    *   **변수**: `#{학생명}`, `#{반명}`, `#{결제금액}`, `#{결제예정일}`
3.  **미납 안내**: `#{학생명}` 학부모님, `#{반명}` 수강료 `#{미납금액}`원이 미납되었습니다. 빠른 시일 내 납부 부탁드립니다.
    *   **변수**: `#{학생명}`, `#{반명}`, `#{미납금액}`
4.  **출결 결과 알림**: `#{학생명}`님, 오늘 `#{반명}` 수업에 `#{출결상태}` 처리되었습니다. (비고: `#{비고내용}`)
    *   **변수**: `#{학생명}`, `#{반명}`, `#{출결상태}`, `#{비고내용}`
5.  **공지사항 등록 알림**: `#{학생명}`님, 새로운 공지사항이 등록되었습니다. [공지 제목: `#{공지제목}`] 학원 앱/웹에서 확인해주세요.
    *   **변수**: `#{학생명}`, `#{공지제목}`
6.  **상담 일정 알림**: `#{학생명}` 학부모님, `#{상담일시}`에 `#{상담내용}` 상담이 예정되어 있습니다. 늦지 않게 참석 부탁드립니다.
    *   **변수**: `#{학생명}`, `#{상담일시}`, `#{상담내용}`

## 6. 에러 처리 및 재시도 로직

알림톡 발송은 외부 서비스에 의존하므로, 네트워크 오류, API 제한, 잘못된 수신자 정보 등으로 인해 실패할 수 있습니다. 안정적인 시스템 운영을 위해 다음과 같은 에러 처리 및 재시도 로직을 구현합니다.

*   **즉각적인 에러 감지**: `NotificationService`는 외부 API 호출 시 발생하는 에러를 즉각적으로 감지하고, `NotificationResult`에 에러 메시지를 포함하여 반환합니다.
*   **발송 이력에 에러 기록**: 발송 실패 시, `kakao_message_logs` 테이블에 `status`를 `FAILED`로 기록하고 `error_message` 필드에 상세 에러 내용을 저장합니다.
*   **재시도 정책**: 일시적인 네트워크 문제 등으로 인한 실패의 경우, 지수 백오프(Exponential Backoff) 전략을 사용하여 일정 시간 간격으로 최대 N회까지 재시도를 수행합니다. (예: 1분 후, 5분 후, 15분 후 재시도).
*   **관리자 알림**: 재시도 후에도 최종적으로 발송에 실패한 경우, 관리자에게 알림(예: 내부 슬랙 알림, 관리자 대시보드에 표시)을 보내 수동 확인 및 조치를 요청합니다.
*   **데드 레터 큐 (Dead Letter Queue, DLQ)**: 처리할 수 없는 메시지나 반복적인 실패 메시지는 DLQ로 이동시켜 추후 분석 및 수동 처리를 가능하게 합니다.

## 7. 발송 이력 및 로깅

모든 알림톡 발송 시도 및 결과는 `kakao_message_logs` 테이블에 기록됩니다. 이는 발송 성공 여부 확인, 문제 발생 시 원인 분석, 통계 자료 활용 등에 사용됩니다.

*   **`kakao_message_logs` 테이블**: DB 스키마 설계 문서(`4_db_schema_api_spec.md`)에 정의된 테이블을 활용하여 발송 이력을 저장합니다.
*   **상세 로깅**: 백엔드 애플리케이션 로그에는 알림톡 발송 요청, 외부 API 호출, 응답, 에러 발생 시 스택 트레이스 등 상세 정보를 기록하여 디버깅 및 문제 해결에 활용합니다.
*   **관리자 액션 기록**: 관리자가 수동으로 알림톡을 발송하거나 템플릿을 수정하는 경우, `created_by`, `updated_by` 필드를 통해 어떤 관리자가 어떤 작업을 수행했는지 기록합니다. 이는 감사(Audit) 목적으로 활용될 수 있습니다.

---
