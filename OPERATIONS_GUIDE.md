# 📊 운영 가이드 - 로그, 에러 처리, 모니터링

실서비스 운영에 필요한 로깅, 에러 처리, 모니터링 구조를 설명합니다.

## 📝 로그 시스템

### 로그 레벨

| 레벨 | 설명 | 예시 |
|------|------|------|
| **ERROR** | 심각한 오류 | DB 연결 실패, 결제 오류 |
| **WARN** | 경고 | 재시도 실패, 권한 없음 |
| **INFO** | 일반 정보 | 로그인, API 호출 |
| **DEBUG** | 디버그 정보 | 변수 값, 함수 호출 |

### 로그 구조

```json
{
  "timestamp": "2024-02-12T10:30:00.000Z",
  "level": "INFO",
  "service": "auth",
  "action": "login",
  "userId": 1,
  "email": "admin@test.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "success",
  "duration": 245,
  "metadata": {
    "loginMethod": "email",
    "deviceType": "desktop"
  }
}
```

### 로그 저장 위치

```
logs/
├── app.log              # 전체 로그
├── error.log            # 에러만
├── access.log           # API 접근 로그
├── auth.log             # 인증 로그
├── notification.log     # 알림톡 로그
└── admin-actions.log    # 관리자 액션 로그
```

## 🔐 관리자 액션 로그

### 기록 대상

모든 관리자 액션을 기록합니다:

```javascript
// 학생 관리
- 학생 등록
- 학생 정보 수정
- 학생 삭제

// 반 관리
- 반 등록
- 반 정보 수정
- 반 삭제

// 출결 관리
- 출석 기록
- 출석 수정
- 출석 삭제

// 공지 관리
- 공지 등록
- 공지 수정
- 공지 삭제

// 권한 관리
- 사용자 권한 변경
- 사용자 비활성화

// 시스템
- 설정 변경
- 백업 실행
```

### 로그 기록 예시

```javascript
// 학생 추가
{
  timestamp: "2024-02-12T10:30:00.000Z",
  adminId: 1,
  adminName: "관리자",
  action: "student.create",
  targetId: 123,
  targetName: "김철수",
  changes: {
    name: "김철수",
    email: "kim@test.com",
    phone: "010-1234-5678"
  },
  status: "success",
  ip: "192.168.1.1"
}

// 학생 정보 수정
{
  timestamp: "2024-02-12T10:35:00.000Z",
  adminId: 1,
  adminName: "관리자",
  action: "student.update",
  targetId: 123,
  targetName: "김철수",
  changes: {
    phone: {
      before: "010-1234-5678",
      after: "010-9999-9999"
    }
  },
  status: "success",
  ip: "192.168.1.1"
}

// 출석 기록
{
  timestamp: "2024-02-12T14:00:00.000Z",
  adminId: 1,
  adminName: "관리자",
  action: "attendance.record",
  targetId: 123,
  targetName: "김철수",
  metadata: {
    classId: 5,
    className: "수학 기초반",
    date: "2024-02-12",
    status: "present"
  },
  status: "success",
  ip: "192.168.1.1"
}
```

## ⚠️ 에러 처리

### 에러 분류

| 타입 | HTTP 코드 | 설명 | 예시 |
|------|----------|------|------|
| **Validation** | 400 | 입력값 오류 | 이메일 형식 오류 |
| **Unauthorized** | 401 | 인증 필요 | 토큰 없음 |
| **Forbidden** | 403 | 권한 없음 | 관리자 권한 필요 |
| **Not Found** | 404 | 리소스 없음 | 학생 ID 없음 |
| **Conflict** | 409 | 중복 | 이메일 중복 |
| **Server Error** | 500 | 서버 오류 | DB 연결 실패 |

### 에러 응답 형식

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "details": {
      "email": "유효한 이메일 형식이 아닙니다",
      "phone": "전화번호는 필수입니다"
    },
    "timestamp": "2024-02-12T10:30:00.000Z",
    "requestId": "req-abc123"
  }
}
```

### 에러 처리 코드

```typescript
// 입력값 검증
if (!email || !email.includes("@")) {
  throw new ValidationError("유효한 이메일을 입력하세요");
}

// 권한 확인
if (user.role !== "admin") {
  throw new ForbiddenError("관리자 권한이 필요합니다");
}

// DB 오류 처리
try {
  await db.insert(students).values(data);
} catch (error) {
  logger.error("Student creation failed", { error, data });
  throw new ServerError("학생 등록에 실패했습니다");
}

// 재시도 로직
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000); // 지수 백오프
    }
  }
}
```

## 📊 모니터링

### 주요 메트릭

```javascript
// 성능
- API 응답 시간 (평균, P95, P99)
- DB 쿼리 시간
- 페이지 로드 시간

// 가용성
- 서버 가동 시간
- API 성공률
- 에러율

// 비즈니스
- 일일 활성 사용자
- 로그인 성공률
- 알림톡 발송 성공률
- 결제 성공률
```

### 모니터링 대시보드

```
┌─────────────────────────────────────────────────────────┐
│ 학원 관리 시스템 - 운영 대시보드                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 시스템 상태                                              │
│ ├─ 서버: 정상 (가동 시간: 45일)                         │
│ ├─ DB: 정상 (응답 시간: 12ms)                           │
│ └─ API: 정상 (성공률: 99.8%)                            │
│                                                          │
│ 실시간 통계 (오늘)                                       │
│ ├─ 활성 사용자: 125명                                   │
│ ├─ API 호출: 15,234건                                   │
│ ├─ 에러: 28건 (0.18%)                                   │
│ └─ 알림톡 발송: 342건 (성공: 340건)                     │
│                                                          │
│ 최근 에러                                                │
│ ├─ [ERROR] DB 연결 타임아웃 (2024-02-12 10:15)         │
│ └─ [WARN] 알림톡 발송 실패 - 재시도 중 (2024-02-12)    │
│                                                          │
│ 알림                                                     │
│ └─ 메모리 사용량 85% (임계값: 80%)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔍 문제 해결

### 일반적인 문제

#### 1. 로그인 실패

```
증상: 사용자가 로그인할 수 없음
원인 분석:
1. 로그 확인: logs/auth.log
2. JWT 토큰 검증
3. DB 사용자 데이터 확인
4. 권한 설정 확인

해결:
- 토큰 만료 시간 확인
- 사용자 계정 활성화 상태 확인
- 브라우저 캐시 삭제
```

#### 2. 알림톡 발송 실패

```
증상: 알림톡이 발송되지 않음
원인 분석:
1. logs/notification.log 확인
2. Provider 상태 확인
3. API 키 유효성 확인
4. 수신자 전화번호 형식 확인

해결:
- API 키 재설정
- Provider를 Mock으로 변경하여 테스트
- 전화번호 형식 검증
- 재시도 로직 실행
```

#### 3. 데이터베이스 느림

```
증상: API 응답이 느림
원인 분석:
1. 쿼리 성능 분석
2. 인덱스 확인
3. 동시 연결 수 확인
4. 디스크 공간 확인

해결:
- 인덱스 추가
- 쿼리 최적화
- 연결 풀 크기 조정
- 디스크 정리
```

### 로그 분석 팁

```bash
# 에러 로그만 확인
grep "ERROR" logs/app.log

# 특정 시간대 로그
grep "2024-02-12T10:" logs/app.log

# 사용자별 액션 로그
grep "userId: 1" logs/admin-actions.log

# 실패한 알림톡
grep "status.*failed" logs/notification.log

# 로그 통계
wc -l logs/*.log
```

## 🚨 알림 설정

### 알림 조건

| 조건 | 심각도 | 액션 |
|------|--------|------|
| 에러율 > 5% | 🔴 심각 | 즉시 알림 |
| API 응답 시간 > 5초 | 🟠 경고 | 알림 |
| 메모리 사용량 > 80% | 🟠 경고 | 알림 |
| DB 연결 실패 | 🔴 심각 | 즉시 알림 |
| 알림톡 발송 실패 > 10% | 🟡 주의 | 알림 |

### 알림 채널

```
- 이메일: admin@academy.example.com
- SMS: 010-1234-5678
- Slack: #academy-alerts
- 대시보드: 실시간 표시
```

## 📋 운영 체크리스트

### 일일

- [ ] 에러 로그 확인
- [ ] 시스템 상태 확인
- [ ] 알림톡 발송 현황 확인
- [ ] 사용자 피드백 확인

### 주간

- [ ] 성능 메트릭 분석
- [ ] 백업 상태 확인
- [ ] 보안 로그 검토
- [ ] 관리자 액션 로그 검토

### 월간

- [ ] 전체 시스템 점검
- [ ] 성능 최적화
- [ ] 보안 업데이트
- [ ] 용량 계획

## 🔐 보안 로깅

### 기록 대상

```
- 모든 로그인 시도 (성공/실패)
- 권한 변경
- 민감한 데이터 접근
- 시스템 설정 변경
- 대량 데이터 다운로드
```

### 로그 보안

```
- 로그 파일 암호화
- 접근 권한 제한 (관리자만)
- 정기적 백업
- 감사 추적 (Audit Trail)
```

---

**마지막 업데이트**: 2024년 2월 12일
