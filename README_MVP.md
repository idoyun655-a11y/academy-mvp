# 학원 운영 통합 시스템 - MVP 버전

실행 가능한 최소 기능 완성 버전입니다.

## 🚀 빠른 시작

### 1. 설치 및 실행

```bash
# 프로젝트 디렉토리로 이동
cd /home/ubuntu/academy-system

# 의존성 설치
npm install
# 또는
pnpm install

# 개발 서버 실행
npm run dev
# 또는
pnpm dev
```

### 2. 브라우저에서 접속

```
http://localhost:3000
```

## 🔐 테스트 계정

로그인 페이지에서 다음 계정으로 로그인할 수 있습니다:

| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|---------|------|
| 관리자 | admin@test.com | admin123 | 학원 관리자 (모든 기능 접근) |
| 강사 | teacher@test.com | teacher123 | 강사 (관리자 기능 접근) |
| 학생1 | student1@test.com | student123 | 학생 (학생 기능만 접근) |
| 학생2 | student2@test.com | student123 | 학생 (학생 기능만 접근) |

## 📋 구현된 기능

### ✅ 관리자 기능

1. **학생 관리**
   - 학생 목록 조회
   - 학생 등록 (추가)
   - 학생 정보 수정
   - 학생 삭제

2. **반(수업) 관리**
   - 반 목록 조회
   - 반 등록
   - 반 정보 수정
   - 시간표 관리

3. **출결 관리**
   - 반별 출결 조회
   - 출석/지각/결석/조퇴 기록
   - 출결 현황 통계

4. **공지사항 관리**
   - 공지사항 목록 조회
   - 공지사항 등록
   - 공지사항 수정

5. **알림톡 설정**
   - 알림톡 템플릿 관리 (콘솔 로그 기반)

### ✅ 학생 기능

1. **홈 대시보드**
   - 수강 중인 반 목록
   - 최근 공지사항
   - 출석 현황

2. **시간표**
   - 주간 시간표 조회
   - 수업 상세 정보

3. **공지사항**
   - 공지사항 목록 조회
   - 공지사항 상세 보기

4. **내 정보**
   - 개인 정보 조회
   - 수강 정보 확인

## 🏗️ 프로젝트 구조

```
academy-system/
├── client/                    # 프론트엔드 (React + Tailwind)
│   ├── src/
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   ├── Login.tsx      # 로그인 페이지
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminStudents.tsx
│   │   │   ├── AdminClasses.tsx
│   │   │   ├── AdminAttendance.tsx
│   │   │   ├── AdminNotices.tsx
│   │   │   ├── StudentHome.tsx
│   │   │   ├── StudentSchedule.tsx
│   │   │   ├── StudentNotices.tsx
│   │   │   └── ...
│   │   ├── components/        # UI 컴포넌트
│   │   ├── lib/trpc.ts       # tRPC 클라이언트
│   │   └── App.tsx           # 라우팅
│   └── package.json
│
├── server/                    # 백엔드 (Express + tRPC)
│   ├── routers.ts            # API 라우터 (더미 데이터 포함)
│   ├── auth.ts               # JWT 인증
│   ├── db.ts                 # DB 쿼리 헬퍼
│   └── _core/                # 프레임워크 코드
│
├── drizzle/                   # DB 스키마
│   └── schema.ts
│
└── shared/                    # 공유 코드
    └── const.ts
```

## 🔄 API 엔드포인트

모든 API는 `/api/trpc` 경로 아래에 있습니다.

### 인증
- `auth.login` - 로그인
- `auth.me` - 현재 사용자 정보
- `auth.logout` - 로그아웃

### 학생 관리
- `students.list` - 학생 목록
- `students.getById` - 학생 상세
- `students.create` - 학생 등록
- `students.update` - 학생 수정
- `students.delete` - 학생 삭제

### 반 관리
- `classes.list` - 반 목록
- `classes.getById` - 반 상세
- `classes.create` - 반 등록
- `classes.update` - 반 수정

### 출결 관리
- `attendance.list` - 출결 조회
- `attendance.record` - 출결 기록

### 공지사항
- `notices.list` - 공지 목록
- `notices.getById` - 공지 상세
- `notices.create` - 공지 등록

### 알림톡
- `notifications.send` - 알림톡 발송 (콘솔 로그)

## 💾 데이터 저장

현재 MVP 버전은 **메모리 기반 더미 데이터**를 사용합니다:
- 서버 재시작 시 데이터 초기화
- 프로덕션에서는 실제 DB 연결 필요

## 🔔 알림톡 시스템

현재 구현 상태:
- ✅ 알림톡 발송 API 구현
- ✅ 콘솔 로그로 발송 흐름 표시
- ⏳ 실제 카카오 알림톡 연동 (향후)

**콘솔 로그 예시:**
```
[NOTIFICATION] 알림톡 발송:
  - 학생: 김철수 (student1@test.com)
  - 타입: attendance
  - 메시지: 오늘 수학 기초반 출석이 확인되었습니다.
  - 시간: 2024-02-12T10:30:00.000Z
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입스크립트 체크
npm run check

# 빌드
npm run build

# 프로덕션 실행
npm start

# 테스트
npm run test
```

## 📝 주요 기술 스택

- **프론트엔드**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **백엔드**: Express, tRPC 11, TypeScript
- **인증**: JWT (로컬 개발용)
- **상태 관리**: React Query (tRPC)
- **라우팅**: Wouter

## 🐛 알려진 제한사항

1. **메모리 기반 데이터**: 서버 재시작 시 초기화
2. **JWT 인증**: 프로덕션용 보안 강화 필요
3. **실제 DB 미연동**: SQLite/PostgreSQL 연동 필요
4. **알림톡**: 콘솔 로그만 구현 (실제 연동 필요)

## 🚀 다음 단계

1. 실제 데이터베이스 연동 (SQLite 또는 PostgreSQL)
2. 카카오 알림톡 API 연동
3. 파일 업로드 기능
4. 결제 시스템 통합
5. 모바일 앱 개발

## 📞 지원

문제가 발생하면:
1. 브라우저 콘솔 확인 (F12)
2. 서버 로그 확인
3. 테스트 계정 재확인

---

**마지막 업데이트**: 2024년 2월 12일
