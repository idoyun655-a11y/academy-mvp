# 학원 운영 통합 시스템 (Academy System) - 최종 실행 가능 버전

## 📋 프로젝트 개요

학원의 학생, 반, 출결, 공지사항, 성적을 통합으로 관리하는 웹 기반 시스템입니다.

**기술 스택:**
- Frontend: React 19 + Tailwind CSS 4 + TypeScript
- Backend: Express 4 + tRPC 11 + MySQL
- Database: MySQL (TiDB)
- Auth: Manus OAuth

---

## 🚀 빠른 시작 (5분)

### 1. 환경 설정

```bash
# 프로젝트 디렉토리 이동
cd academy-system

# 패키지 설치
pnpm install

# 환경 변수 설정 (.env.local 파일 생성)
# 아래 내용을 .env.local 파일에 추가:
DATABASE_URL=mysql://user:password@localhost:3306/academy
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

### 2. 데이터베이스 초기화

```bash
# DB 마이그레이션 실행
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# 샘플 데이터 생성
pnpm seed
```

### 3. 개발 서버 실행

```bash
# 개발 서버 시작 (자동으로 http://localhost:3000 열림)
pnpm dev
```

---

## 🔐 테스트 계정

모든 테스트 계정의 비밀번호는 **OAuth 기반**이므로 실제 로그인 시 Manus 계정이 필요합니다.

**데모용 테스트 계정 정보:**

| 역할 | 이메일 | 이름 | 권한 |
|------|--------|------|------|
| 관리자 | admin@academy.com | 김관리자 | 모든 기능 접근 |
| 강사 | teacher1@academy.com | 박강사 | 반, 출결, 성적 관리 |
| 학생 | student1@academy.com | 김철수 | 시간표, 공지, 성적 조회 |

---

## 📱 주요 기능

### 관리자 대시보드 (`/admin`)

#### 1. 학생 관리
- **기능**: 학생 등록, 조회, 수정, 삭제
- **폼 필드**: 이름, 이메일, 전화번호, 보호자정보, 주소
- **접근**: 관리자만 가능

#### 2. 반 관리
- **기능**: 반 등록, 조회, 수정, 삭제
- **폼 필드**: 반명, 과목, 강사, 요일, 시간, 정원, 호실
- **접근**: 관리자만 가능

#### 3. 출결 관리
- **기능**: 출결 기록 저장, 조회, 수정
- **상태**: 출석, 지각, 결석, 조퇴
- **필터**: 날짜, 반별 필터링
- **접근**: 관리자, 강사 가능

#### 4. 공지사항 관리
- **기능**: 공지 작성, 조회, 수정, 삭제
- **대상**: 전체, 학생, 강사, 관리자
- **상태**: 게시/미게시 토글
- **접근**: 관리자만 가능

#### 5. 성적 관리
- **기능**: 학생 성적 입력, 조회, 통계
- **모의고사**: 3월, 6월, 9월, 10월 (과목별 9등급)
- **내신**: 나이 기반 자동 등급제 선택
  - 2026년 기준 고2(18세) 이하: 5등급제
  - 고2(18세) 초과: 9등급제
- **통계**: 과목별 평균 등급 그래프
- **접근**: 관리자, 강사만 입력 가능

### 학생 웹앱 (`/student`)

#### 1. 학생 홈
- 개인정보 표시
- 오늘의 수업 정보
- 최근 공지사항
- 빠른 메뉴 (시간표, 공지, 출석, 내정보)

#### 2. 시간표
- 주간 시간표 조회
- 반별 수업 정보 (강사, 호실, 내용)

#### 3. 공지사항
- 공지사항 목록 조회
- 상세 내용 확인

#### 4. 출석 현황
- 월별 출석률 통계
- 출석 기록 조회
- 상태별 색상 구분

#### 5. 내정보
- 개인정보 조회 및 수정
- 보호자정보 조회
- 수강 반 정보 조회
- 성적 조회 (읽기 전용)

---

## 📁 프로젝트 구조

```
academy-system/
├── client/                      # 프론트엔드
│   ├── src/
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── Home.tsx        # 소개 페이지
│   │   │   ├── Login.tsx       # 로그인
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminStudents.tsx
│   │   │   ├── AdminClasses.tsx
│   │   │   ├── AdminAttendance.tsx
│   │   │   ├── AdminNotices.tsx
│   │   │   ├── AdminGrades.tsx
│   │   │   ├── StudentHome.tsx
│   │   │   ├── StudentSchedule.tsx
│   │   │   ├── StudentNotices.tsx
│   │   │   ├── StudentAttendance.tsx
│   │   │   └── StudentProfile.tsx
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── common/
│   │   │       └── CommonComponents.tsx
│   │   ├── lib/trpc.ts         # tRPC 클라이언트
│   │   ├── styles/
│   │   │   └── design-system.ts
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/
│   ├── routers.ts              # tRPC 라우터 (API)
│   ├── db.ts                   # DB 헬퍼 함수
│   ├── seed-db.mjs             # 샘플 데이터 생성
│   └── _core/                  # 프레임워크 코어
├── drizzle/
│   ├── schema.ts               # DB 스키마
│   └── migrations/             # DB 마이그레이션
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README_FINAL.md             # 이 파일
```

---

## 🔧 설정 파일 설명

### package.json
- 프로젝트 의존성 관리
- 스크립트: `dev`, `build`, `preview`, `seed`, `test`

### tsconfig.json
- TypeScript 컴파일 설정
- 경로 매핑: `@/` → `client/src/`

### vite.config.ts
- Vite 번들러 설정
- 개발 서버 포트: 3000
- API 프록시: `/api` → `http://localhost:3000`

### .env.local
- 환경 변수 (로컬 개발용)
- 프로덕션 배포 시 서버 환경 변수로 설정

---

## 📊 API 목록 (tRPC)

### 학생 관리
- `students.list` - 학생 목록 조회 (페이지네이션, 검색)
- `students.get` - 학생 상세 조회
- `students.create` - 학생 생성 (관리자만)
- `students.update` - 학생 수정 (관리자만)
- `students.delete` - 학생 삭제 (관리자만)

### 반 관리
- `classes.list` - 반 목록 조회
- `classes.get` - 반 상세 조회
- `classes.create` - 반 생성 (관리자만)
- `classes.update` - 반 수정 (관리자만)
- `classes.delete` - 반 삭제 (관리자만)

### 출결 관리
- `attendance.list` - 출결 기록 조회 (필터링)
- `attendance.record` - 출결 기록 저장 (관리자, 강사)
- `attendance.update` - 출결 기록 수정 (관리자, 강사)

### 공지사항
- `notices.list` - 공지사항 목록 조회
- `notices.get` - 공지사항 상세 조회
- `notices.create` - 공지사항 생성 (관리자만)
- `notices.update` - 공지사항 수정 (관리자만)
- `notices.delete` - 공지사항 삭제 (관리자만)

### 성적 관리
- `grades.list` - 학생 성적 조회
- `grades.save` - 성적 저장 (관리자, 강사)
- `grades.update` - 성적 수정 (관리자, 강사)
- `grades.getStats` - 성적 통계 조회

### 인증
- `auth.me` - 현재 사용자 정보
- `auth.logout` - 로그아웃

---

## 🎨 디자인 시스템

### 색상 팔레트 (Dark Mode)
- **배경**: `#0a0e27` (primary), `#1a1f3a` (secondary)
- **텍스트**: `#ffffff` (primary), `#b0b8d4` (secondary)
- **상태**: 성공 `#10b981`, 에러 `#ef4444`, 경고 `#f59e0b`

### 컴포넌트
- **Button**: primary, secondary, danger 3가지 variant
- **Card**: default, elevated, glass 3가지 variant
- **Badge**: success, error, warning, info 4가지 variant
- **Input**: 통일된 스타일 (border, focus state)

---

## 🧪 테스트 및 검증

### 기능 검증 체크리스트

- [ ] 로그인 (관리자/강사/학생)
- [ ] 학생 CRUD (생성, 조회, 수정, 삭제)
- [ ] 반 관리 (생성, 조회, 수정, 삭제)
- [ ] 출결 기록 (저장, 조회, 수정)
- [ ] 공지사항 (작성, 조회, 수정, 삭제)
- [ ] 성적 관리 (입력, 조회, 통계)
- [ ] 권한 관리 (역할별 접근 제어)
- [ ] 반응형 레이아웃 (모바일/태블릿/PC)

### 실행 검증 명령어

```bash
# 1. 설치
npm install

# 2. 시드 데이터 생성
npm run seed

# 3. 개발 서버 실행
npm run dev

# 4. 로그인 테스트
# 브라우저에서 http://localhost:3000 접속
# admin@academy.com으로 로그인

# 5. 각 기능 테스트
# - 학생 관리: /admin/students
# - 반 관리: /admin/classes
# - 출결 관리: /admin/attendance
# - 공지 관리: /admin/notices
# - 성적 관리: /admin/grades
```

---

## ⚠️ 알려진 제한사항

### 현재 미구현 기능
1. **파일 업로드**: 공지사항에 첨부파일 업로드 기능 미구현
2. **알림톡 실제 발송**: Mock provider 기반 (실제 발송 X)
3. **고급 통계**: 월별/반별 상세 통계 미구현
4. **학생 복구**: 삭제된 학생 복구 기능 미구현

### 환경 요구사항
- Node.js 18+
- MySQL 8.0+
- 최신 브라우저 (Chrome, Firefox, Safari, Edge)

### 브라우저 호환성
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ IE 11 (지원 안 함)

---

## 📞 문제 해결

### 데이터베이스 연결 오류
```
Error: Cannot find module 'better-sqlite3'
```
**해결**: MySQL 드라이버 설치 확인
```bash
pnpm install mysql2
```

### 포트 3000 이미 사용 중
```bash
# 다른 포트로 실행
pnpm dev -- --port 3001
```

### 로그인 실패
- Manus OAuth 설정 확인
- `VITE_APP_ID` 환경 변수 확인
- 브라우저 쿠키 설정 확인

---

## 📝 개발 가이드

### 새로운 페이지 추가

1. `client/src/pages/NewPage.tsx` 생성
2. `client/src/App.tsx`에 라우트 추가
3. API 필요 시 `server/routers.ts`에 라우터 추가

### 새로운 API 추가

1. `server/routers.ts`에 라우터 추가
2. `server/db.ts`에 DB 헬퍼 함수 추가 (필요시)
3. 클라이언트에서 `trpc.newRouter.useQuery()` 사용

### 스타일 수정

1. `client/src/styles/design-system.ts`에서 색상/간격 수정
2. 또는 컴포넌트에서 `style={{ ... }}` 직접 적용

---

## 🚢 배포

### Manus 플랫폼 배포

1. 프로젝트 루트에서 checkpoint 생성
2. Management UI의 "Publish" 버튼 클릭
3. 커스텀 도메인 설정 (선택사항)

### 외부 호스팅 (Railway, Render 등)

```bash
# 빌드
npm run build

# 프로덕션 환경 변수 설정
# .env 파일에 DATABASE_URL, JWT_SECRET 등 설정

# 시작
npm start
```

---

## 📚 참고 자료

- [tRPC 공식 문서](https://trpc.io)
- [Tailwind CSS 문서](https://tailwindcss.com)
- [React 공식 문서](https://react.dev)
- [Drizzle ORM 문서](https://orm.drizzle.team)

---

## 📄 라이선스

이 프로젝트는 개인/교육용 목적으로 제작되었습니다.

---

**최종 업데이트**: 2026년 4월 12일
**버전**: 1.0.0 (MVP)
