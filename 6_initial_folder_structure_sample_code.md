# 학원 운영 통합 시스템: 초기 폴더 구조 및 샘플 코드 제시

본 문서는 학원 운영 통합 시스템의 초기 개발을 위한 폴더 구조와 핵심 기능에 대한 샘플 코드를 제시합니다. 프로젝트의 확장성과 유지보수성을 고려하여 모듈화된 구조를 제안하며, 백엔드와 프론트엔드를 분리하여 관리합니다. 샘플 코드는 주요 기능의 구현 방향을 보여주며, 실제 개발 시에는 더 많은 로직과 예외 처리가 추가되어야 합니다.

## 1. 프로젝트 폴더 구조

프로젝트는 크게 백엔드 (`backend`), 관리자 웹 (`admin-web`), 학생/학부모 웹앱 (`student-web`), 학원 소개 사이트 (`landing-page`)로 구성됩니다. 각 애플리케이션은 독립적인 폴더를 가지며, 공통으로 사용될 수 있는 타입 정의나 유틸리티 등은 `shared` 폴더에 위치할 수 있습니다.

```
academy-system/
├── backend/                    # 백엔드 API 서버 (Node.js + Express/NestJS or Python + FastAPI)
│   ├── src/                    # 소스 코드
│   │   ├── auth/               # 인증 및 권한 관리 모듈
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.middleware.ts
│   │   ├── users/              # 사용자 관리 모듈 (학생, 강사, 학부모 포함)
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.model.ts
│   │   ├── students/           # 학생 관련 비즈니스 로직
│   │   │   ├── students.controller.ts
│   │   │   ├── students.service.ts
│   │   │   └── students.model.ts
│   │   ├── classes/            # 반/수업 관리 모듈
│   │   │   ├── classes.controller.ts
│   │   │   ├── classes.service.ts
│   │   │   └── classes.model.ts
│   │   ├── attendance/         # 출결 관리 모듈
│   │   │   ├── attendance.controller.ts
│   │   │   ├── attendance.service.ts
│   │   │   └── attendance.model.ts
│   │   ├── notices/            # 공지 관리 모듈
│   │   │   ├── notices.controller.ts
│   │   │   ├── notices.service.ts
│   │   │   └── notices.model.ts
│   │   ├── notifications/      # 알림톡 발송 모듈 (Provider Abstraction)
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── providers/      # 알림 서비스 제공자 구현체
│   │   │   │   ├── kakao.provider.ts
│   │   │   │   └── sms.provider.ts
│   │   │   └── interfaces.ts   # INotificationService 인터페이스 정의
│   │   ├── config/             # 환경 설정
│   │   ├── utils/              # 유틸리티 함수
│   │   ├── middlewares/        # 공통 미들웨어 (로깅, 에러 처리)
│   │   ├── app.ts              # 메인 애플리케이션 파일
│   │   └── server.ts           # 서버 시작 파일
│   ├── tests/                  # 테스트 코드
│   ├── .env.example            # 환경 변수 예시
│   ├── package.json            # Node.js 프로젝트 설정
│   └── tsconfig.json           # TypeScript 설정
├── admin-web/                  # 관리자 웹 프론트엔드 (React + TypeScript + TailwindCSS)
│   ├── public/                 # 정적 파일
│   ├── src/                    # 소스 코드
│   │   ├── assets/             # 이미지, 아이콘 등
│   │   ├── components/         # 재사용 가능한 UI 컴포넌트
│   │   │   ├── common/         # 공통 컴포넌트 (버튼, 입력창, 카드 등)
│   │   │   ├── layout/         # 레이아웃 관련 컴포넌트 (Sidebar, Header)
│   │   │   └── auth/           # 인증 관련 컴포넌트 (LoginForm)
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── auth/           # 로그인 페이지
│   │   │   │   └── LoginPage.tsx
│   │   │   ├── dashboard/      # 대시보드 페이지
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── students/       # 학생 관리 페이지
│   │   │   │   ├── StudentListPage.tsx
│   │   │   │   └── StudentDetailPage.tsx
│   │   │   ├── classes/        # 반/수업 관리 페이지
│   │   │   │   └── ClassListPage.tsx
│   │   │   ├── attendance/     # 출결 관리 페이지
│   │   │   │   └── AttendancePage.tsx
│   │   │   └── notices/        # 공지 관리 페이지
│   │   │       └── NoticeListPage.tsx
│   │   ├── services/           # API 호출 로직
│   │   ├── hooks/              # 커스텀 React Hooks
│   │   ├── contexts/           # React Context API
│   │   ├── types/              # TypeScript 타입 정의
│   │   ├── utils/              # 프론트엔드 유틸리티
│   │   ├── App.tsx             # 메인 앱 컴포넌트
│   │   ├── main.tsx            # 엔트리 파일
│   │   └── index.css           # 전역 스타일
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── student-web/                # 학생/학부모 반응형 웹앱 (React + TypeScript + TailwindCSS)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── timetable/
│   │   │   └── notices/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── landing-page/               # 학원 소개 및 접속용 공식 사이트 (React + TypeScript + TailwindCSS)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   └── contact/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── shared/                     # 백엔드/프론트엔드 공통 타입 정의 등
│   ├── types/                  # 공통 TypeScript 타입 정의
│   │   ├── user.ts
│   │   ├── student.ts
│   │   └── ...
│   └── utils/                  # 공통 유틸리티
├── .gitignore
├── README.md
└── package.json                # 모노레포 관리용 (선택 사항, pnpm workspace 등)
```

## 2. 샘플 코드

### 2.1. 백엔드 샘플 코드 (Node.js + Express + TypeScript)

#### 2.1.1. `backend/src/auth/auth.controller.ts` (로그인 API)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { accessToken, user } = await this.authService.login(email, password);
      res.status(200).json({ accessToken, user });
    } catch (error) {
      next(error); // 에러 미들웨어로 전달
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user는 인증 미들웨어에서 설정됨
      const user = req.user; 
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
```

#### 2.1.2. `backend/src/auth/auth.service.ts` (인증 로직)

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../users/users.model';
import { CustomError } from '../middlewares/error.middleware';

export class AuthService {
  async login(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new CustomError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new CustomError(401, 'Invalid credentials');
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
```

#### 2.1.3. `backend/src/middlewares/auth.middleware.ts` (JWT 인증 미들웨어)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './error.middleware';
import { UserModel } from '../users/users.model';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any; // 또는 User 타입 정의
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new CustomError(401, 'User not found');
    }

    req.user = user; // 요청 객체에 사용자 정보 추가
    next();
  } catch (error) {
    next(new CustomError(401, 'Invalid or expired token'));
  }
};
```

#### 2.1.4. `backend/src/middlewares/rbac.middleware.ts` (RBAC 권한 미들웨어)

```typescript
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './error.middleware';

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(new CustomError(403, 'Access denied. No role information.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new CustomError(403, 'Access denied. Insufficient permissions.'));
    }

    next();
  };
};
```

#### 2.1.5. `backend/src/students/students.controller.ts` (학생 관리 CRUD 예시)

```typescript
import { Request, Response, NextFunction } from 'express';
import { StudentService } from './students.service';
import { rbacMiddleware } from '../middlewares/rbac.middleware';

export class StudentController {
  constructor(private studentService: StudentService) {}

  // 학생 목록 조회 (관리자, 슈퍼관리자, 강사만 가능)
  async getAllStudents(req: Request, res: Response, next: NextFunction) {
    try {
      rbacMiddleware(['SUPER_ADMIN', 'ACADEMY_ADMIN', 'TEACHER'])(req, res, async () => {
        const students = await this.studentService.findAll();
        res.status(200).json(students);
      });
    } catch (error) {
      next(error);
    }
  }

  // 학생 등록 (관리자, 슈퍼관리자만 가능)
  async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      rbacMiddleware(['SUPER_ADMIN', 'ACADEMY_ADMIN'])(req, res, async () => {
        const studentData = req.body;
        const newStudent = await this.studentService.create(studentData, req.user.id);
        res.status(201).json(newStudent);
      });
    } catch (error) {
      next(error);
    }
  }

  // 학생 상세 조회 (모든 사용자 가능, 본인 정보는 학생/학부모도 가능)
  async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.id;
      const student = await this.studentService.findById(studentId);

      if (!student) {
        throw new CustomError(404, 'Student not found');
      }

      // 학생 본인 또는 학부모가 자신의 정보를 조회하는 경우 허용
      if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
        throw new CustomError(403, 'Access denied. You can only view your own information.');
      }
      if (req.user.role === 'PARENT' && student.parentId !== req.user.id) {
        throw new CustomError(403, 'Access denied. You can only view your child\'s information.');
      }

      res.status(200).json(student);
    } catch (error) {
      next(error);
    }
  }

  // 학생 정보 수정 (관리자, 슈퍼관리자만 가능)
  async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      rbacMiddleware(['SUPER_ADMIN', 'ACADEMY_ADMIN'])(req, res, async () => {
        const studentId = req.params.id;
        const updateData = req.body;
        const updatedStudent = await this.studentService.update(studentId, updateData, req.user.id);
        res.status(200).json(updatedStudent);
      });
    } catch (error) {
      next(error);
    }
  }

  // 학생 삭제 (관리자, 슈퍼관리자만 가능)
  async deleteStudent(req: Request, res: Response, next: NextFunction) {
    try {
      rbacMiddleware(['SUPER_ADMIN', 'ACADEMY_ADMIN'])(req, res, async () => {
        const studentId = req.params.id;
        await this.studentService.delete(studentId, req.user.id);
        res.status(204).send();
      });
    } catch (error) {
      next(error);
    }
  }
}
```

#### 2.1.6. `backend/src/notifications/interfaces.ts` (알림 서비스 인터페이스)

```typescript
// shared/types/notification.ts 또는 backend/src/notifications/interfaces.ts

export interface NotificationResult {
  success: boolean;
  recipient: string; // 수신자 (전화번호 등)
  messageId?: string; // 발송 성공 시 메시지 ID
  errorMessage?: string; // 발송 실패 시 에러 메시지
}

export interface NotificationTemplate {
  code: string; // 템플릿 고유 코드 (예: KA_CLASS_REMINDER)
  name: string; // 템플릿 이름
  content: string; // 템플릿 내용 (변수 포함, 예: 안녕하세요 #{학생명}님...)
  requiredVariables: string[]; // 템플릿에 필요한 변수 목록 (예: ['학생명', '반명'])
  providerTemplateId?: string; // 외부 서비스(카카오)에 등록된 템플릿 ID
}

export interface INotificationProvider {
  // 단일 메시지 발송
  send(recipient: string, template: NotificationTemplate, variables: Record<string, string>): Promise<NotificationResult>;
  // 대량 메시지 발송 (선택 사항)
  sendBulk?(recipients: string[], template: NotificationTemplate, variables: Record<string, string>): Promise<NotificationResult[]>;
}
```

#### 2.1.7. `backend/src/notifications/providers/kakao.provider.ts` (카카오 알림톡 구현체)

```typescript
import { INotificationProvider, NotificationResult, NotificationTemplate } from '../interfaces';
import axios from 'axios'; // HTTP 요청 라이브러리

export class KakaoTalkProvider implements INotificationProvider {
  private apiKey: string;
  private senderKey: string;
  private apiUrl: string;

  constructor(apiKey: string, senderKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.senderKey = senderKey;
    this.apiUrl = apiUrl;
  }

  async send(recipient: string, template: NotificationTemplate, variables: Record<string, string>): Promise<NotificationResult> {
    try {
      let messageContent = template.content;
      for (const key in variables) {
        // 템플릿 변수 치환 (예: #{학생명} -> 김철수)
        messageContent = messageContent.replace(new RegExp(key, 'g'), variables[key]);
      }

      const response = await axios.post(this.apiUrl + '/send/alimtalk', {
        apiKey: this.apiKey,
        senderKey: this.senderKey,
        templateCode: template.providerTemplateId, // 카카오에 등록된 템플릿 ID
        recipient: recipient,
        message: messageContent,
        // ... 기타 카카오 알림톡 API 파라미터
      });

      // 카카오 API 응답 형식에 따라 결과 파싱
      if (response.data.code === '200') {
        return { success: true, recipient, messageId: response.data.messageId };
      }
      return { success: false, recipient, errorMessage: response.data.message };
    } catch (error: any) {
      console.error('KakaoTalkProvider send error:', error.message);
      return { success: false, recipient, errorMessage: error.message };
    }
  }

  // sendBulk 구현은 send를 반복 호출하거나, 카카오 API의 일괄 발송 기능을 활용
}
```

#### 2.1.8. `backend/src/notifications/notifications.service.ts` (알림 서비스)

```typescript
import { INotificationProvider, NotificationResult, NotificationTemplate } from './interfaces';
import { KakaoTalkProvider } from './providers/kakao.provider';
import { NotificationLogModel } from './notifications.model'; // 알림톡 로그 모델

export class NotificationService {
  private provider: INotificationProvider;

  constructor() {
    // 환경 변수에 따라 Provider 선택 및 초기화
    // 실제 서비스에서는 DI 컨테이너를 통해 주입하는 것이 일반적
    const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '';
    const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY || '';
    const KAKAO_API_URL = process.env.KAKAO_API_URL || 'https://api.kakaotalk.com';
    this.provider = new KakaoTalkProvider(KAKAO_API_KEY, KAKAO_SENDER_KEY, KAKAO_API_URL);
  }

  async sendNotification(
    templateCode: string,
    recipient: string, // 수신자 전화번호
    variables: Record<string, string>,
    triggeredByUserId: string // 누가 이 알림을 트리거했는지 (관리자 액션 기록)
  ): Promise<NotificationResult> {
    // DB에서 템플릿 정보 조회 (실제 구현에서는 캐싱 고려)
    const template = await this.getTemplateFromDB(templateCode);
    if (!template) {
      throw new Error(`Notification template ${templateCode} not found`);
    }

    // 필수 변수 검증
    for (const requiredVar of template.requiredVariables) {
      if (!variables[requiredVar]) {
        throw new Error(`Missing required variable: ${requiredVar} for template ${templateCode}`);
      }
    }

    let result: NotificationResult;
    try {
      result = await this.provider.send(recipient, template, variables);
    } catch (error: any) {
      result = { success: false, recipient, errorMessage: error.message };
    }

    // 발송 이력 저장
    await NotificationLogModel.create({
      messageType: template.name,
      recipient: recipient,
      templateCode: templateCode,
      messageContent: this.replaceVariablesInContent(template.content, variables),
      sentAt: new Date(),
      status: result.success ? 'SUCCESS' : 'FAILED',
      errorMessage: result.errorMessage,
      triggeredBy: triggeredByUserId,
    });

    // 실패 시 재시도 로직 (예시, 실제로는 큐 시스템과 연동)
    if (!result.success && result.errorMessage !== 'Invalid phone number') { // 유효하지 않은 번호는 재시도 X
      // TODO: 재시도 큐에 추가 (예: RabbitMQ, Kafka)
      console.warn(`Notification failed for ${recipient}. Adding to retry queue.`);
    }

    return result;
  }

  private async getTemplateFromDB(templateCode: string): Promise<NotificationTemplate | null> {
    // 데이터베이스에서 템플릿 정보를 조회하는 로직
    // 예시 데이터 (실제로는 DB에서 조회)
    const templates: Record<string, NotificationTemplate> = {
      'KA_CLASS_REMINDER': {
        code: 'KA_CLASS_REMINDER',
        name: '수업 시작 알림',
        content: '안녕하세요 #{학생명}님, #{반명} 수업이 #{수업시간}에 시작됩니다.',
        requiredVariables: ['#{학생명}', '#{반명}', '#{수업시간}'],
        providerTemplateId: 'KA_CLASS_REMINDER_001',
      },
      'KA_PAYMENT_DUE': {
        code: 'KA_PAYMENT_DUE',
        name: '결제일 도래 알림',
        content: '#{학생명} 학부모님, #{반명} 수강료 #{결제금액}원의 결제일이 #{결제예정일}입니다. 확인 부탁드립니다.',
        requiredVariables: ['#{학생명}', '#{반명}', '#{결제금액}', '#{결제예정일}'],
        providerTemplateId: 'KA_PAYMENT_DUE_002',
      },
      'KA_ARREARS_NOTICE': {
        code: 'KA_ARREARS_NOTICE',
        name: '미납 안내',
        content: '#{학생명} 학부모님, #{반명} 수강료 #{미납금액}원이 미납되었습니다. 빠른 시일 내 납부 부탁드립니다.',
        requiredVariables: ['#{학생명}', '#{반명}', '#{미납금액}'],
        providerTemplateId: 'KA_ARREARS_NOTICE_003',
      },
      'KA_ATTENDANCE_RESULT': {
        code: 'KA_ATTENDANCE_RESULT',
        name: '출결 결과 알림',
        content: '#{학생명}님, 오늘 #{반명} 수업에 #{출결상태} 처리되었습니다. (비고: #{비고내용})',
        requiredVariables: ['#{학생명}', '#{반명}', '#{출결상태}', '#{비고내용}'],
        providerTemplateId: 'KA_ATTENDANCE_RESULT_004',
      },
      'KA_NOTICE_REGISTERED': {
        code: 'KA_NOTICE_REGISTERED',
        name: '공지사항 등록 알림',
        content: '#{학생명}님, 새로운 공지사항이 등록되었습니다. [공지 제목: #{공지제목}] 학원 앱/웹에서 확인해주세요.',
        requiredVariables: ['#{학생명}', '#{공지제목}'],
        providerTemplateId: 'KA_NOTICE_REGISTERED_005',
      },
    };
    return templates[templateCode] || null;
  }

  private replaceVariablesInContent(content: string, variables: Record<string, string>): string {
    let replacedContent = content;
    for (const key in variables) {
      replacedContent = replacedContent.replace(new RegExp(key, 'g'), variables[key]);
    }
    return replacedContent;
  }
}
```

### 2.2. 프론트엔드 샘플 코드 (React + TypeScript + TailwindCSS)

#### 2.2.1. `admin-web/src/components/layout/Sidebar.tsx` (관리자 웹 사이드바)

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, UsersIcon, BookOpenIcon, CalendarIcon, BellIcon, CogIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { name: '대시보드', icon: HomeIcon, path: '/dashboard' },
    { name: '학생 관리', icon: UsersIcon, path: '/students' },
    { name: '반/수업 관리', icon: BookOpenIcon, path: '/classes' },
    { name: '출결 관리', icon: CalendarIcon, path: '/attendance' },
    { name: '공지 관리', icon: BellIcon, path: '/notices' },
    { name: '설정', icon: CogIcon, path: '/settings' },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}
    >
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <span className="text-2xl font-semibold">학원 관리</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
            onClick={toggleSidebar} // 모바일에서 메뉴 클릭 시 사이드바 닫기
          >
            <item.icon className="h-6 w-6 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
```

#### 2.2.2. `admin-web/src/components/layout/Header.tsx` (관리자 웹 헤더)

```typescript
import React from 'react';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white shadow-md md:ml-64">
      <button className="md:hidden" onClick={toggleSidebar}>
        <Bars3Icon className="h-6 w-6" />
      </button>
      <div className="text-xl font-semibold">대시보드</div> {/* 현재 페이지 제목 */}
      <div className="flex items-center space-x-4">
        <BellIcon className="h-6 w-6 cursor-pointer" />
        <UserCircleIcon className="h-6 w-6 cursor-pointer" />
        {/* 사용자 이름 및 드롭다운 메뉴 추가 가능 */}
      </div>
    </header>
  );
};

export default Header;
```

#### 2.2.3. `admin-web/src/pages/auth/LoginPage.tsx` (관리자 웹 로그인 페이지)

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // 인증 Context

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password); // AuthContext의 로그인 함수 호출
      navigate('/dashboard'); // 로그인 성공 시 대시보드로 이동
    } catch (err: any) {
      setError(err.message || '로그인 실패');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white">학원 통합 시스템</h1>
          <p className="text-gray-400">관리자 로그인</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">이메일</label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">비밀번호</label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              로그인
            </button>
          </div>
          <div className="text-center mt-4">
            <a href="#" className="inline-block align-baseline font-bold text-sm text-blue-400 hover:text-blue-200">
              비밀번호를 잊으셨나요?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
```

#### 2.2.4. `admin-web/src/pages/students/StudentListPage.tsx` (관리자 웹 학생 목록 페이지)

```typescript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { studentService } from '../../services/studentService'; // API 서비스
import { Student } from '../../types/student'; // 학생 타입 정의

const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentService.getStudents();
        setStudents(data);
      } catch (err: any) {
        setError(err.message || '학생 목록을 불러오는데 실패했습니다.');
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-white">로딩 중...</div>;
  if (error) return <div className="text-red-500">에러: {error}</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">학생 관리</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="학생 이름 또는 학번 검색..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <Link
          to="/students/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          학생 등록
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div key={student.id} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                  {student.name.charAt(0)}
                </div>
              </div>
              <div className="flex-grow">
                <h2 className="text-lg font-semibold">{student.name} ({student.studentCode})</h2>
                <p className="text-gray-400 text-sm">{student.email}</p>
                <p className="text-gray-400 text-sm">{student.phoneNumber}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-600 text-white">재원</span>
                  {/* <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-600 text-white">휴원</span> */}
                </div>
              </div>
              <Link to={`/students/${student.id}`} className="text-blue-400 hover:text-blue-200 text-sm">
                상세 보기
              </Link>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-400">등록된 학생이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default StudentListPage;
```

#### 2.2.5. `student-web/src/pages/home/HomePage.tsx` (학생 웹앱 홈 화면)

```typescript
import React from 'react';
import { CalendarDaysIcon, MegaphoneIcon, ClipboardDocumentListIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  // 실제 데이터는 API 호출을 통해 가져옴
  const studentName = "김철수";
  const nextClass = { name: "중등 영어 A반", time: "오늘 19:00", teacher: "이강사" };
  const recentNotice = { title: "3월 학부모 설명회", date: "2023.03.01" };
  const assignment = { title: "영어 단어 100개 암기", dueDate: "~2023.04.15" };
  const attendanceStatus = "이번 달 출석률: 90%";
  const gradeSummary = "최근 시험: 85점";

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">안녕하세요, {studentName}님!</h1>
        <BellIcon className="h-6 w-6 text-gray-300" />
      </header>

      <div className="space-y-4">
        {/* 다음 수업 카드 */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
          <div className="flex items-center mb-2">
            <CalendarDaysIcon className="h-6 w-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold">다음 수업</h2>
          </div>
          <p className="text-gray-300 text-lg">{nextClass.name}</p>
          <p className="text-gray-400 text-sm">{nextClass.time} / {nextClass.teacher}</p>
        </div>

        {/* 최근 공지 카드 */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
          <div className="flex items-center mb-2">
            <MegaphoneIcon className="h-6 w-6 text-green-400 mr-2" />
            <h2 className="text-xl font-semibold">최근 공지</h2>
          </div>
          <p className="text-gray-300 text-lg">{recentNotice.title}</p>
          <p className="text-gray-400 text-sm">{recentNotice.date}</p>
        </div>

        {/* 과제 카드 */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
          <div className="flex items-center mb-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-400 mr-2" />
            <h2 className="text-xl font-semibold">과제</h2>
          </div>
          <p className="text-gray-300 text-lg">{assignment.title}</p>
          <p className="text-gray-400 text-sm">마감일: {assignment.dueDate}</p>
        </div>

        {/* 출석 및 성적 요약 카드 (두 개를 한 줄에 배치하거나, 모바일에서는 세로로) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center mb-2">
              <CalendarDaysIcon className="h-6 w-6 text-red-400 mr-2" />
              <h2 className="text-xl font-semibold">출석</h2>
            </div>
            <p className="text-gray-300 text-lg">{attendanceStatus}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-6 w-6 text-purple-400 mr-2" />
              <h2 className="text-xl font-semibold">성적 요약</h2>
            </div>
            <p className="text-gray-300 text-lg">{gradeSummary}</p>
          </div>
        </div>
      </div>

      {/* 하단 내비게이션 바 (실제 구현에서는 Link 컴포넌트 사용) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around py-3 md:hidden">
        <div className="flex flex-col items-center text-blue-400">
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs">홈</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <CalendarDaysIcon className="h-6 w-6" />
          <span className="text-xs">시간표</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <MegaphoneIcon className="h-6 w-6" />
          <span className="text-xs">공지</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <UserCircleIcon className="h-6 w-6" />
          <span className="text-xs">내 정보</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
```

## 3. 샘플 더미 데이터

개발 초기 단계에서 백엔드 API가 완전히 구현되기 전까지 프론트엔드 개발을 위해 사용할 수 있는 더미 데이터 예시입니다. 실제 API 연동 시에는 이 데이터를 대체하게 됩니다.

```json
// students.json
[
  {
    "id": "student-001",
    "studentCode": "S001",
    "name": "김철수",
    "email": "kimchulsoo@example.com",
    "phoneNumber": "010-1111-2222",
    "dateOfBirth": "2010-03-15",
    "address": "서울시 강남구",
    "parentId": "parent-001",
    "status": "재원",
    "className": "중등 영어 A반"
  },
  {
    "id": "student-002",
    "studentCode": "S002",
    "name": "이영희",
    "email": "leeyounghee@example.com",
    "phoneNumber": "010-3333-4444",
    "dateOfBirth": "2009-07-20",
    "address": "서울시 서초구",
    "parentId": null,
    "status": "재원",
    "className": "중등 수학 B반"
  }
]

// classes.json
[
  {
    "id": "class-001",
    "name": "중등 영어 A반",
    "teacherId": "teacher-001",
    "teacherName": "이강사",
    "capacity": 20,
    "currentStudents": 15,
    "description": "중학교 1-2학년 대상 영어 심화반",
    "schedules": [
      { "dayOfWeek": 1, "startTime": "19:00", "endTime": "21:00", "roomNumber": "201" },
      { "dayOfWeek": 3, "startTime": "19:00", "endTime": "21:00", "roomNumber": "201" }
    ]
  },
  {
    "id": "class-002",
    "name": "중등 수학 B반",
    "teacherId": "teacher-002",
    "teacherName": "박강사",
    "capacity": 15,
    "currentStudents": 10,
    "description": "중학교 2-3학년 대상 수학 개념반",
    "schedules": [
      { "dayOfWeek": 2, "startTime": "17:00", "endTime": "19:00", "roomNumber": "302" },
      { "dayOfWeek": 4, "startTime": "17:00", "endTime": "19:00", "roomNumber": "302" }
    ]
  }
]

// notices.json
[
  {
    "id": "notice-001",
    "title": "3월 학부모 설명회 안내",
    "content": "3월 15일 오후 7시, 대강당에서 학부모 설명회가 진행됩니다. 많은 참여 부탁드립니다.",
    "authorId": "admin-001",
    "authorName": "관리자",
    "createdAt": "2023-03-01T10:00:00Z",
    "viewCount": 120,
    "targetRole": "ALL"
  },
  {
    "id": "notice-002",
    "title": "4월 5일 휴강 안내",
    "content": "식목일(4월 5일)은 학원 전체 휴강입니다. 착오 없으시길 바랍니다.",
    "authorId": "admin-001",
    "authorName": "관리자",
    "createdAt": "2023-03-25T14:30:00Z",
    "viewCount": 80,
    "targetRole": "ALL"
  }
]
```

---
