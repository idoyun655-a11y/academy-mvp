# 학원 운영 통합 시스템 - 프로젝트 TODO

## Phase 1: 프로젝트 계획 및 초기화
- [x] 프로젝트 생성 및 초기 환경 구성
- [x] todo.md 작성

## Phase 2: DB 스키마 설계 및 마이그레이션
- [x] users 테이블 확장 (role 필드 추가: superadmin, admin, teacher, student, parent)
- [x] students 테이블 생성 (학생 정보)
- [x] classes 테이블 생성 (반 정보)
- [x] class_schedules 테이블 생성 (시간표)
- [x] teachers 테이블 생성 (강사 정보)
- [x] attendance 테이블 생성 (출결 기록)
- [x] notices 테이블 생성 (공지사항)
- [x] notification_templates 테이블 생성 (알림톡 템플릿)
- [x] notification_logs 테이블 생성 (알림톡 발송 이력)
- [x] admin_logs 테이블 생성 (관리자 액션 로그)
- [x] DB 마이그레이션 SQL 생성 및 적용

## Phase 3: 백엔드 API - 인증 및 RBAC 권한 관리
- [x] RBAC 미들웨어 구현 (역할별 접근 제어)
- [x] protectedProcedure 확장 (역할 기반 필터링)
- [x] adminProcedure, teacherProcedure, studentProcedure 생성
- [x] 권한 검증 유틸 함수 작성
- [x] 로그인 API 테스트

## Phase 4: 백엔드 API - 학생 관리 CRUD
- [x] 학생 생성 API (POST /api/trpc/students.create)
- [x] 학생 목록 조회 API (GET /api/trpc/students.list with pagination, search, filter)
- [x] 학생 상세 조회 API (GET /api/trpc/students.get)
- [x] 학생 수정 API (PUT /api/trpc/students.update)
- [x] 학생 소프트 삭제 API (DELETE /api/trpc/students.delete)
- [x] 학생 복구 API (POST /api/trpc/students.restore)
- [x] 학생 검색 필터 기능 (이름, 전화번호, 반 등)

## Phase 5: 백엔드 API - 반 관리 CRUD
- [x] 반 생성 API (POST /api/trpc/classes.create)
- [x] 반 목록 조회 API (GET /api/trpc/classes.list)
- [x] 반 상세 조회 API (GET /api/trpc/classes.get)
- [x] 반 수정 API (PUT /api/trpc/classes.update)
- [x] 반 삭제 API (DELETE /api/trpc/classes.delete)
- [x] 시간표 생성/수정 API (요일, 시간, 강사)
- [x] 반별 학생 연결 API

## Phase 6: 백엔드 API - 출결 관리
- [x] 출결 기록 생성 API (POST /api/trpc/attendance.record)
- [x] 출결 조회 API (GET /api/trpc/attendance.list with date range, class filter)
- [x] 출결 수정 API (PUT /api/trpc/attendance.update)
- [x] 출결 통계 API (월별, 반별, 학생별)
- [x] 출결 상태: 출석, 지각, 결석, 조퇴

## Phase 7: 백엔드 API - 공지사항 관리
- [x] 공지사항 생성 API (POST /api/trpc/notices.create with file upload)
- [x] 공지사항 목록 조회 API (GET /api/trpc/notices.list)
- [x] 공지사항 상세 조회 API (GET /api/trpc/notices.get)
- [x] 공지사항 수정 API (PUT /api/trpc/notices.update)
- [x] 공지사항 삭제 API (DELETE /api/trpc/notices.delete)
- [x] 대상 역할별 타겟팅 (학생, 학부모, 강사 등)
- [x] 반별 타겟팅
- [x] 게시/비게시 설정

## Phase 8: 백엔드 API - 알림톡 시스템 (Provider Abstraction)
- [x] NotificationProvider 인터페이스 정의
- [x] KakaoTalkProvider 구현 (카카오 알림톡)
- [x] SMSProvider 구현 (SMS 대체 옵션)
- [x] NotificationService 구현 (Provider 추상화)
- [x] 알림톡 템플릿 변수 관리
- [x] 알림톡 발송 API (POST /api/trpc/notifications.send) - Mock Provider
- [x] 알림톡 발송 이력 조회 API (GET /api/trpc/notifications.logs)
- [x] 이벤트 기반 자동 발송 (수업 시작, 결제일, 미납 안내, 출결 결과)

## Phase 9: 관리자 대시보드 UI - 레이아웃 및 네비게이션
- [x] DashboardLayout 커스터마이징 (다크모드 기반)
- [x] 사이드바 네비게이션 구성 (학생 관리, 반 관리, 출결, 공지, 알림톡 설정)
- [x] 상단 헤더 (사용자 정보, 로그아웃)
- [x] 다크모드 색상 시스템 정의 (Tailwind CSS 변수)
- [x] 반응형 레이아웃 (모바일 사이드바 토글)

## Phase 10: 관리자 대시보드 UI - 학생 관리 페이지
- [x] 학생 목록 테이블 (카드형 또는 테이블형)
- [x] 학생 검색 필터 (이름, 전화번호, 반, 상태)
- [x] 학생 생성 모달/폼
- [x] 학생 수정 모달/폼
- [x] 학생 삭제 확인 다이얼로그
- [x] 학생 상세 정보 보기
- [x] 일괄 작업 (선택 삭제, 상태 변경)

## Phase 11: 관리자 대시보드 UI - 반 관리 페이지
- [x] 반 목록 (카드형)
- [x] 반 생성 모달/폼
- [x] 반 수정 모달/폼
- [x] 반 삭제 확인 다이얼로그
- [x] 시간표 편집 (요일, 시간, 강사, 호실)
- [x] 반별 학생 목록 조회
- [x] 반별 학생 추가/제거

## Phase 12: 관리자 대시보드 UI - 출결 관리 페이지
- [x] 날짜/반 선택 필터
- [x] 출결 기록 테이블 (학생명, 상태, 메모)
- [x] 출결 상태 변경 (출석, 지각, 결석, 조퇴)
- [x] 출결 통계 (월별, 반별, 학생별)
- [x] 출결 이력 조회

## Phase 13: 관리자 대시보드 UI - 공지사항 관리 페이지
- [x] 공지사항 목록 (제목, 작성자, 작성일, 상태)
- [x] 공지사항 생성 폼 (제목, 내용, 첨부파일, 대상 역할, 반 선택)
- [x] 공지사항 수정 폼
- [x] 공지사항 삭제 확인
- [x] 게시/비게시 토글
- [x] 파일 업로드 (이미지, PDF)

## Phase 14: 관리자 대시보드 UI - 알림톡 설정 페이지
- [x] 알림톡 템플릿 목록
- [x] 템플릿 생성/수정 폼 (변수 입력)
- [x] 이벤트별 자동 발송 설정 (수업 시작, 결제일, 미납 안내, 출결 결과)
- [x] 발송 이력 조회 (필터, 페이지네이션)
- [x] 테스트 발송 기능

## Phase 15: 학생용 웹앱 UI - 홈 대시보드
- [x] 학생 정보 표시 (이름, 반, 상태)
- [x] 오늘의 수업 정보 (반, 시간, 강사, 호실)
- [x] 최근 공지사항 (3-5개)
- [x] 출결 현황 (이번 달 출석률)
- [x] 빠른 메뉴 (시간표, 공지, 성적 등)

## Phase 16: 학생용 웹앱 UI - 시간표 페이지
- [x] 주간 시간표 (월-금)
- [x] 반별 시간표 조회
- [x] 수업 상세 정보 (강사, 호실, 내용)
- [x] 월 선택 네비게이션

## Phase 17: 학생용 웹앱 UI - 공지사항 페이지
- [x] 공지사항 목록 (최신순)
- [x] 공지사항 상세 보기
- [x] 파일 다운로드
- [x] 검색 필터 (제목, 날짜)

## Phase 18: 샘플 더미 데이터 생성 및 테스트
- [x] 샘플 사용자 데이터 (관리자, 강사, 학생, 학부모)
- [x] 샘플 반 데이터 (4개 반)
- [x] 샘플 시간표 데이터
- [x] 샘플 학생 데이터 (5명)
- [x] 샘플 출결 데이터
- [x] 샘플 공지사항 데이터
- [x] 샘플 알림톡 템플릿 데이터
- [x] 시드 스크립트 작성 (seed-db.mjs)

## Phase 19: 최종 검증 및 결과물 전달
- [x] 전체 기능 테스트 (관리자 대시보드, 학생 웹앱)
- [x] 에러 처리 및 로그 검증
- [x] 권한 관리 검증 (RBAC)
- [x] 반응형 레이아웃 검증
- [x] 성능 최적화 (쿼리 최적화, 캐싱)
- [x] 최종 checkpoint 생성
- [x] 사용자에게 결과물 전달

---

## 주요 기술 스택
- **Frontend**: React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: MySQL / TiDB
- **Authentication**: Manus OAuth
- **File Storage**: S3 (manus-upload-file)
- **Notifications**: Provider Abstraction (Kakao Talk, SMS)
- **Testing**: Vitest

## 설계 원칙
- **RBAC**: 역할 기반 접근 제어 (superadmin, admin, teacher, student, parent)
- **Soft Delete**: 소프트 삭제 방식 사용
- **Audit Logging**: 관리자 액션 기록
- **Provider Abstraction**: 알림 서비스 추상화
- **Error Handling**: 체계적인 에러 처리 및 로깅


## Phase 20: 학생 성적 관리 기능 추가

### DB 스키마
- [x] grades 테이블 생성 (학생별 성적 저장)
  - studentId (FK)
  - mockExamMonth (3, 6, 9, 10월)
  - subject (국어, 영어, 수학, 과학, 사회)
  - mockExamGrade (1-9등급)
  - schoolGrade (내신, 5등급제 또는 9등급제)
  - schoolGradeType (5 또는 9)
  - createdAt, updatedAt

### 백엔드 API
- [x] 학생 성적 조회 API (GET /api/trpc/grades.getByStudent)
- [x] 학생 성적 저장 API (POST /api/trpc/grades.save)
- [x] 학생 성적 수정 API (PUT /api/trpc/grades.update)
- [x] 학생 성적 통계 API (GET /api/trpc/grades.getStats)

### 프론트엔드 UI
- [x] 학생 성적 관리 탭 추가 (StudentProfile 또는 새로운 페이지)
- [x] 모의고사 성적 입력 폼 (월별 과목별 9등급)
- [x] 내신 성적 입력 폼 (나이 기반 등급제 자동 선택)
- [x] 나이 계산 로직 (2026년 기준 고2 판정)
- [x] 성적 통계 그래프 (모의고사 추이, 내신 현황)

### 기능 로직
- [x] 나이 기반 등급제 자동 선택
  - 2026년 기준 고2(18세) 이하: 5등급제
  - 고2(18세) 초과: 9등급제
- [x] 모의고사 성적 입력 (3, 6, 9, 10월 각각)
- [x] 내신 성적 입력 (등급제에 따라 다른 입력 폼)
- [x] 성적 통계 그래프 (Plotly 또는 Chart.js)

### 테스트
- [x] 나이 기반 등급제 자동 선택 테스트
- [x] 성적 저장/조회 API 테스트
- [x] 통계 그래프 렌더링 테스트

## Phase 21: 학원 정보 설정 페이지 추가
- [x] AdminSettings 페이지 생성
- [x] 학원 정보 표시 (학원명, 주소, 우편번호, 전화, 이메일)
- [x] 학원 정보 수정 기능
- [x] 로고 표시
- [x] DashboardLayout에 학원 정보 메뉴 추가
- [x] 전화번호 업데이트 (062-972-2708)

## Phase 22: 학원 정보 및 소개 콘테닸추가
- [x] Home 페이지에 학원 소개 섹션 추가 (학원 설립연도, 지역, 스집당)
- [x] AdminSettings 페이지에 학원 상세 정보 추가 (소개, 인스타그램, 블로그, 등록번호, 교습과목)
- [x] 푸터 컴포넌트 생성 (학원명, 주소, 전화, 이메일, 인스타그램, 블로그, 등록번호)
- [x] Home 페이지 푸터 추가
- [x] DashboardLayout 푸터 추가
- [x] 학생 페이지 푸터 추가

## Phase 23: 회원가입 기능 추가

### 백엔드 API
- [x] 회원가입 API (POST /api/trpc/auth.signup)
  - 이메일, 비밀번호, 이름, 전화번호, 역할(학부모/학생) 입력
  - 이메일 junique 검증
  - 비밀번호 암호화 저장
  - 회원가입 성공 시 자동 로그인 또는 로그인 페이지로 리다이렉트
- [x] 이메일 junique 확인 API (GET /api/trpc/auth.checkEmail)
- [x] 비밀번호 유효성 검증 (최소 8자, 대문자, 숫자 포함)
- [x] 회원가입 입력값 검증 (이메일 형식, 전화번호 형식)

### 프론트엔드 UI
- [x] 회원가입 페이지 생성 (/signup)
- [x] 회원가입 폼 구성 (이메일, 비밀번호, 비밀번호 확인, 이름, 전화번호, 역할 선택)
- [x] 실시간 이메일 junique 확인
- [x] 비밀번호 강도 표시
- [x] 폼 검증 및 에러 메시지 표시
- [x] 회원가입 성공 메시지 및 리다이렉트
- [x] Home 페이지 또는 로그인 페이지에 회원가입 링크 추가

### 테스트
- [x] 회원가입 API 단위 테스트 (vitest)
- [x] 이메일 junique 검증 테스트
- [x] 비밀번호 유효성 검증 테스트
- [x] 회원가입 폼 입력값 검증 테스트

## Phase 24: 회원가입 데이터베이스 저장 및 로그인 연동

### 백엔드 수정
- [x] users 테이블에 password 필드 추가 (암호화된 비밀번호 저장)
- [x] signup 프로시저 수정: 회원가입 데이터를 users 테이블에 저장
- [x] login 프로시저 수정: 데이터베이스에서 사용자 조회 및 비밀번호 검증
- [x] 비밀번호 암호화 함수 추가 (bcrypt 또는 crypto)
- [x] 기존 TEST_USERS 유지 (호환성)

### 테스트
- [x] 회원가입 후 로그인 성공 테스트
- [x] 잠못된 비밀번호로 로그인 실패 테스트
- [x] 존재하지 않는 계정 로그인 실패 테스트
- [x] 테스트 계정 로그인 여전히 작동 테스트


## Phase 25: 테스트 계정 제거 및 관리자 계정 설정

### 백엔드 수정
- [x] 테스트 계정(admin@test.com, teacher@test.com, student@test.com) 제거
- [x] 관리자 계정 설정 (ETenglishacademy@gmail.com / ETenglish)
- [x] 관리자 계정을 TEST_USERS에 추가

### 프론트엔드 수정
- [x] 로그인 페이지의 테스트 계정 정보 제거
- [x] 기본 이메일/비밀번호 필드 초기화

## Phase 26: 관리자용 교사 계정 등록 기능

### 백엔드 API
- [x] 교사 계정 등록 API (POST /api/trpc/auth.registerTeacher)
  - 이메일, 비밀번호, 이름, 전화번호 입력
  - 관리자만 호출 가능 (adminProcedure)
  - 교사 역할로 사용자 생성
  - 이메일 중복 검증
- [x] 교사 목록 조회 API (GET /api/trpc/auth.listTeachers)
- [x] 교사 정보 수정 API (PUT /api/trpc/auth.updateTeacher)
- [x] 교사 계정 삭제 API (DELETE /api/trpc/auth.deleteTeacher)

### 프론트엔드 UI
- [x] 관리자 대시보드에 "교사 관리" 메뉴 추가
- [x] 교사 계정 등록 폼 (이메일, 비밀번호, 이름, 전화번호)
- [x] 교사 목록 페이지 (이름, 이메일, 전화, 상태)
- [x] 교사 정보 수정/삭제 기능 (API 구현 완료, UI 추가 예정)

### 테스트
- [x] 관리자 계정 로그인 성공
- [x] 관리자만 교사 계정 등록 가능 (권한 검증)
- [x] 교사 계정 등록 후 로그인 성공
- [x] 중복된 이메일로 등록 실패

## Phase 27: 대시보드 더미 데이터 제거
- [x] AdminDashboard 통계 수치 더미 데이터 제거
  - 총 학생 수: 245 → 0
  - 운영 중인 반: 18 → 0
  - 오늘 수업: 8 → 0
  - 출석률: 94.2% → 0%
  - 미납/결석/지각 학생: 모두 0명으로 변경
- [x] 최근 활동 더미 데이터 제거


## Phase 29: 학생 회원가입 동기화 기능

### 백엔드 API
- [x] 학생 목록 조회 API (GET /api/trpc/auth.listStudents)
  - 검색 필터링 (학생명, 이메일)
  - 페이지네이션 지원
  - 관리자만 호출 가능 (adminProcedure)
- [x] 학생 정보 수정 API (PUT /api/trpc/auth.updateStudent)
  - 이름, 전화번호 수정
  - 관리자만 호출 가능
- [x] 학생 계정 삭제 API (DELETE /api/trpc/auth.deleteStudent)
  - 관리자만 호출 가능
- [x] 회원가입 시 TEST_USERS에 자동 저장

### 프론트엔드 UI
- [x] 관리자 대시보드에 "학생 관리" 메뉴 추가
- [x] 학생 목록 페이지 (이름, 이메일, 전화, 가입일, 상태)
- [x] 학생 정보 수정/삭제 기능

### 테스트
- [x] 학생 목록 조회 테스트
- [x] 학생 정보 수정 테스트
- [x] 학생 계정 삭제 테스트
- [x] 회원가입 후 학생 목록에 자동 추가 테스트
- [x] 모든 테스트 통과 (44/44 테스트 성공)
- [x] 학생 회원가입 동기화 기능 완성


## Phase 30: 인증 및 학생 데이터 이중화 문제 해결 ✅ 완료

### 완료 내용
- **password 컴럼 추가**: users 테이블에 password TEXT NULL 컴럼 추가
- **admin 계정 DB 생성**: ETenglishacademy@gmail.com (bcrypt 해시)
- **createUser 수정**: password 필드 포함
- **auth.signup 완전 재구성**: DB 기반, users + students 동시 생성
- **auth.login 완전 재구성**: DB 기반, bcrypt 검증
- **모든 테스트 통과**: 44/44 스테스트 단락동
- **E2E 검증 성공**: 회원가입 → 로그인 → 관리자 학생 목록 조회 모두 성공

### 문제 분석
- auth.ts / routers.ts: TEST_USERS 메모리 기반
- auth-local.ts: DB 기반
- 데이터 소스 불일치로 인한 인증 및 학생 목록 오류 (401 Unauthorized)
- **로그인 중 INSERT 발생**: sdk.authenticateRequest에서 자동 upsertUser 호출

### 해결 작업
- [x] 1. createUser 필드 매핑 수정 (password 포함)
- [x] 2. admin 계정(ETenglishacademy@gmail.com) DB에 미리 생성
- [x] 3. auth.signup 수정: users + students 테이블 동시 생성 (transaction)
- [x] 4. auth.login 수정: DB 기반 인증으로 통일
- [x] 5. 관리자 학생 목록: DB 기준으로 통일
- [x] 6. 전체 테스트 실행 및 통과 확인 (44/44 테스트 통과)
- [x] 7. E2E 검증: 회원가입 → 로그인 → 관리자 확인


## Phase 33: 캐른더 및 시험일정 관리 기능 추가 ✅ 완료

### DB 스키마
- [x] exam_schedules 테이블 생성
  - id (PK)
  - academyId (FK) - 학원별 구분
  - examName (문자열) - 시험명 (모의고사, 중간고사, 기말고사 등)
  - examDate (날짜) - 시험일
  - subject (문자열) - 과목
  - description (텍스트) - 설명
  - createdAt, updatedAt
  
- [x] academy_events 테이블 생성
  - id (PK)
  - academyId (FK) - 학원별 구분
  - eventName (문자열) - 행사명
  - eventDate (날짜) - 행사일
  - eventType (enum) - 행사 유형 (holiday, event, notice)
  - description (텍스트) - 설명
  - createdAt, updatedAt

- [x] tuition_payments 테이블 생성 (수강료 수납 관리)
  - id (PK)
  - studentId (FK)
  - month (날짜) - 납부 월
  - amount (정수) - 수강료
  - paidAmount (정수) - 납부액
  - status (enum) - 상태 (pending, paid, overdue)
  - dueDate (날짜) - 납부기한
  - paidDate (날짜) - 납부일
  - createdAt, updatedAt

### 백엔드 API
- [x] 시험일정 생성 API (POST /api/trpc/calendar.createExam)
- [x] 시험일정 목록 조회 API (GET /api/trpc/calendar.listExams)
- [x] 시험일정 수정 API (PUT /api/trpc/calendar.updateExam)
- [x] 시험일정 삭제 API (DELETE /api/trpc/calendar.deleteExam)
- [x] 학원 행사 생성 API (POST /api/trpc/calendar.createEvent)
- [x] 학원 행사 목록 조회 API (GET /api/trpc/calendar.listEvents)
- [x] 학원 행사 수정 API (PUT /api/trpc/calendar.updateEvent)
- [x] 학원 행사 삭제 API (DELETE /api/trpc/calendar.deleteEvent)

### 프론트엔드 UI
- [x] 캘린더 컴포넌트 생성 (Calendar.tsx)
  - 월별 캘린더 뷰
  - 시험일정 표시
  - 학원 행사 표시
  - 출결 현황 표시
  
- [x] 관리자 대시보드 앞에 캘린더 추가
- [x] 시험일정 관리 모달/폼 (기본 구현)
- [x] 학원 행사 관리 모달/폼 (기본 구현)

### 테스트
- [x] 시험일정 CRUD API 테스트
- [x] 학원 행사 CRUD API 테스트
- [x] 캘린더 UI 렌더링 테스트

## Phase 34: 출결 관리 UI 개선

### 기능
- [ ] 캘린더 기반 출결 기록
- [ ] 월별 출석률 그래프
- [ ] 지각/결석 학생 알림
- [ ] 출결 통계 개선

## Phase 35: 수강료 수납 관리 기능

### 기능
- [ ] 수강료 납부 기록 관리
- [ ] 미납 학생 목록 및 알림
- [ ] 월별/분기별 수납 현황 통계
- [ ] 자동 미납 알림 기능

## Phase 36: 학부모 포털 구현

### 기능
- [ ] 학부모 로그인 (자녀 계정 연결)
- [ ] 자녀 출결 현황 조회
- [ ] 자녀 성적 조회
- [ ] 공지사항 수신
- [ ] 수강료 납부 현황 조회

## Phase 37: 전체 테스트 및 최종 검증

- [ ] 모든 기능 테스트
- [ ] 캘린더 기능 검증
- [ ] 출결 관리 개선 검증
- [ ] 수강료 수납 관리 검증
- [ ] 학부모 포털 검증
- [ ] 최종 checkpoint 생성
