# 학원 운영 통합 시스템: DB 스키마 및 API 명세 상세 설계

본 문서는 학원 운영 통합 시스템의 데이터베이스 스키마와 핵심 API 명세를 상세히 정의합니다. 시스템의 안정성, 확장성, 유지보수성을 고려하여 관계형 데이터베이스 모델을 기반으로 설계하며, 백엔드 API는 RESTful 원칙을 따릅니다. MVP 기능을 중심으로 설계하고, 향후 확장성을 위한 고려사항을 포함합니다.

## 1. 데이터베이스 스키마 설계

데이터베이스는 시스템의 모든 정보를 저장하고 관리하는 핵심 구성 요소입니다. 사용자 역할, 학원 운영에 필요한 다양한 정보들을 효율적으로 저장하고 관리하기 위한 테이블 구조를 정의합니다. 모든 테이블에는 `id`, `created_at`, `updated_at` 필드를 기본으로 포함하며, `is_deleted` 필드를 통해 소프트 삭제를 지원합니다. 또한, `created_by`, `updated_by` 필드를 통해 관리자 액션 기록을 남깁니다.

### 1.1. `users` 테이블

시스템에 접근하는 모든 사용자의 기본 정보를 저장합니다. 역할 기반 접근 제어(RBAC)를 위해 `role_id`를 포함합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 사용자 고유 ID                            |
| `email`        | `VARCHAR(255)`   | `NOT NULL`, `UNIQUE` | 사용자 이메일 (로그인 ID)                 |
| `password_hash`| `VARCHAR(255)`   | `NOT NULL`     | 비밀번호 해시                             |
| `name`         | `VARCHAR(100)`   | `NOT NULL`     | 사용자 이름                               |
| `phone_number` | `VARCHAR(20)`    | `UNIQUE`       | 연락처                                    |
| `role_id`      | `UUID`           | `FK (roles.id)`, `NOT NULL` | 사용자 역할 ID                            |
| `is_active`    | `BOOLEAN`        | `DEFAULT TRUE` | 계정 활성화 여부                          |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.2. `roles` 테이블

사용자 역할을 정의하고 관리합니다. RBAC 구현의 핵심 테이블입니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 역할 고유 ID                              |
| `name`         | `VARCHAR(50)`    | `NOT NULL`, `UNIQUE` | 역할 이름 (예: 슈퍼관리자, 학원 관리자, 강사, 학생, 학부모) |
| `description`  | `TEXT`           | `NULL`         | 역할 설명                                 |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |

### 1.3. `students` 테이블

학생 정보를 저장합니다. `users` 테이블과 1:1 관계를 가집니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `FK (users.id)`, `NOT NULL` | 학생 고유 ID (users.id와 동일)            |
| `student_code` | `VARCHAR(50)`    | `NOT NULL`, `UNIQUE` | 학생 코드 (학원 내에서 사용)              |
| `date_of_birth`| `DATE`           | `NULL`         | 생년월일                                  |
| `address`      | `VARCHAR(255)`   | `NULL`         | 주소                                      |
| `parent_id`    | `UUID`           | `FK (parents.id)` | 학부모 ID (선택 사항)                     |
| `memo`         | `TEXT`           | `NULL`         | 특이사항 메모                             |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.4. `parents` 테이블

학부모 정보를 저장합니다. `users` 테이블과 1:1 관계를 가집니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |\n| `id`           | `UUID`           | `PK`, `FK (users.id)`, `NOT NULL` | 학부모 고유 ID (users.id와 동일)          |
| `relationship` | `VARCHAR(50)`    | `NULL`         | 학생과의 관계 (예: 부, 모)                |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.5. `teachers` 테이블

강사 정보를 저장합니다. `users` 테이블과 1:1 관계를 가집니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `FK (users.id)`, `NOT NULL` | 강사 고유 ID (users.id와 동일)            |
| `hire_date`    | `DATE`           | `NULL`         | 고용일                                    |
| `specialty`    | `VARCHAR(255)`   | `NULL`         | 담당 과목 또는 전문 분야                  |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.6. `classes` 테이블

학원의 반(Class) 정보를 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 반 고유 ID                                |
| `name`         | `VARCHAR(100)`   | `NOT NULL`     | 반 이름 (예: 중등 영어 A반)               |
| `teacher_id`   | `UUID`           | `FK (teachers.id)`, `NOT NULL` | 담당 강사 ID                              |
| `capacity`     | `INTEGER`        | `NOT NULL`     | 정원                                      |
| `description`  | `TEXT`           | `NULL`         | 반 설명                                   |
| `start_date`   | `DATE`           | `NULL`         | 개강일                                    |
| `end_date`     | `DATE`           | `NULL`         | 종강일                                    |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.7. `schedules` 테이블

각 반의 수업 시간표 정보를 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 스케줄 고유 ID                            |
| `class_id`     | `UUID`           | `FK (classes.id)`, `NOT NULL` | 반 ID                                     |
| `day_of_week`  | `INTEGER`        | `NOT NULL`     | 요일 (0:일, 1:월, ..., 6:토)              |
| `start_time`   | `TIME`           | `NOT NULL`     | 수업 시작 시간                            |
| `end_time`     | `TIME`           | `NOT NULL`     | 수업 종료 시간                            |
| `room_number`  | `VARCHAR(50)`    | `NULL`         | 강의실 번호                               |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.8. `enrollments` 테이블

학생이 어떤 반에 수강 등록했는지 정보를 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 등록 고유 ID                              |
| `student_id`   | `UUID`           | `FK (students.id)`, `NOT NULL` | 학생 ID                                   |
| `class_id`     | `UUID`           | `FK (classes.id)`, `NOT NULL` | 반 ID                                     |
| `enroll_date`  | `DATE`           | `NOT NULL`     | 등록일                                    |
| `status`       | `VARCHAR(50)`    | `NOT NULL`     | 수강 상태 (예: 수강중, 수료, 중도탈락)    |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.9. `attendance` 테이블

학생의 수업별 출결 정보를 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 출결 고유 ID                              |
| `enrollment_id`| `UUID`           | `FK (enrollments.id)`, `NOT NULL` | 수강 등록 ID                              |
| `schedule_id`  | `UUID`           | `FK (schedules.id)`, `NOT NULL` | 스케줄 ID (어떤 수업에 대한 출결인지)     |
| `attendance_date`| `DATE`           | `NOT NULL`     | 출결 일자                                 |
| `status`       | `VARCHAR(50)`    | `NOT NULL`     | 출결 상태 (예: 출석, 지각, 결석, 조퇴)    |
| `note`         | `TEXT`           | `NULL`         | 비고 (지각 사유, 결석 사유 등)            |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.10. `notices` 테이블

학원 공지사항 정보를 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 공지사항 고유 ID                          |
| `title`        | `VARCHAR(255)`   | `NOT NULL`     | 제목                                      |
| `content`      | `TEXT`           | `NOT NULL`     | 내용                                      |
| `author_id`    | `UUID`           | `FK (users.id)`, `NOT NULL` | 작성자 ID                                 |
| `target_role`  | `VARCHAR(50)`    | `NULL`         | 대상 역할 (예: ALL, STUDENT, PARENT, TEACHER) |
| `target_class_id`| `UUID`           | `FK (classes.id)` | 대상 반 ID (특정 반 대상 공지일 경우)     |
| `is_published` | `BOOLEAN`        | `DEFAULT TRUE` | 게시 여부                                 |
| `view_count`   | `INTEGER`        | `DEFAULT 0`    | 조회수                                    |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.11. `payments` 테이블

수강료 결제 정보를 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 결제 고유 ID                              |
| `enrollment_id`| `UUID`           | `FK (enrollments.id)`, `NOT NULL` | 수강 등록 ID                              |
| `amount`       | `DECIMAL(10,2)`  | `NOT NULL`     | 결제 금액                                 |
| `payment_date` | `DATE`           | `NOT NULL`     | 결제일                                    |
| `due_date`     | `DATE`           | `NULL`         | 납부 예정일                               |
| `status`       | `VARCHAR(50)`    | `NOT NULL`     | 결제 상태 (예: 완납, 미납, 부분납)        |
| `payment_method`| `VARCHAR(50)`    | `NULL`         | 결제 수단                                 |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |
| `created_by`   | `UUID`           | `FK (users.id)` | 생성한 사용자 ID                          |
| `updated_by`   | `UUID`           | `FK (users.id)` | 최종 수정한 사용자 ID                     |
| `is_deleted`   | `BOOLEAN`        | `DEFAULT FALSE` | 삭제 여부 (소프트 삭제)                   |

### 1.12. `kakao_message_logs` 테이블

카카오 알림톡 발송 이력을 저장합니다.

| 필드명         | 데이터 타입      | 제약 조건      | 설명                                      |
| :------------- | :--------------- | :------------- | :---------------------------------------- |
| `id`           | `UUID`           | `PK`, `NOT NULL` | 로그 고유 ID                              |
| `message_type` | `VARCHAR(50)`    | `NOT NULL`     | 메시지 타입 (예: 수업 알림, 미납 안내)    |
| `recipient_id` | `UUID`           | `FK (users.id)`, `NOT NULL` | 수신자 ID                                 |
| `template_code`| `VARCHAR(100)`   | `NOT NULL`     | 사용된 템플릿 코드                        |
| `message_content`| `TEXT`           | `NOT NULL`     | 실제 발송된 메시지 내용                   |
| `sent_at`      | `TIMESTAMP`      | `NOT NULL`     | 발송 일시                                 |
| `status`       | `VARCHAR(50)`    | `NOT NULL`     | 발송 상태 (예: SUCCESS, FAILED, PENDING)  |
| `error_message`| `TEXT`           | `NULL`         | 실패 시 에러 메시지                       |
| `created_at`   | `TIMESTAMP`      | `NOT NULL`     | 생성 일시                                 |
| `updated_at`   | `TIMESTAMP`      | `NOT NULL`     | 최종 수정 일시                            |

## 2. API 명세 (MVP 중심)

백엔드 API는 RESTful 원칙을 따르며, JWT 기반 인증을 통해 보안을 강화합니다. 각 API는 명확한 엔드포인트와 HTTP 메서드를 사용하며, 요청 및 응답 형식은 JSON을 기본으로 합니다. 에러 처리 및 로깅은 모든 API에 공통적으로 적용됩니다.

### 2.1. 인증 및 권한 관리 API

#### 2.1.1. `POST /auth/login` (로그인)

*   **설명**: 사용자 로그인 및 JWT 토큰 발급.
*   **요청**: `application/json`
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "token_type": "bearer",
      "user": {
        "id": "uuid-user-1",
        "email": "user@example.com",
        "name": "홍길동",
        "role": "ACADEMY_ADMIN"
      }
    }
    ```
*   **응답 (실패)**: `401 Unauthorized`, `application/json`
    ```json
    {
      "detail": "Invalid credentials"
    }
    ```

#### 2.1.2. `GET /auth/me` (내 정보 조회)

*   **설명**: 현재 로그인된 사용자 정보 조회.
*   **인증**: `Bearer Token`
*   **요청**: 없음
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "id": "uuid-user-1",
      "email": "user@example.com",
      "name": "홍길동",
      "phone_number": "010-1234-5678",
      "role": "ACADEMY_ADMIN"
    }
    ```

### 2.2. 학생 관리 API

#### 2.2.1. `GET /students` (학생 목록 조회)

*   **설명**: 모든 학생 또는 검색 조건에 맞는 학생 목록 조회.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: 쿼리 파라미터 (예: `?search=김철수&class_id=uuid-class-1`)
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    [
      {
        "id": "uuid-student-1",
        "student_code": "S001",
        "name": "김철수",
        "email": "kim@example.com",
        "phone_number": "010-1111-2222",
        "class_name": "중등 영어 A반",
        "status": "재원"
      }
    ]
    ```

#### 2.2.2. `POST /students` (학생 등록)

*   **설명**: 새로운 학생 정보 등록.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "email": "new_student@example.com",
      "password": "initial_password",
      "name": "새로운 학생",
      "phone_number": "010-3333-4444",
      "student_code": "S005",
      "date_of_birth": "2010-01-01",
      "parent_id": "uuid-parent-1" (optional)
    }
    ```
*   **응답 (성공)**: `201 Created`, `application/json`
    ```json
    {
      "id": "uuid-student-5",
      "student_code": "S005",
      "name": "새로운 학생",
      "email": "new_student@example.com"
    }
    ```

#### 2.2.3. `GET /students/{id}` (학생 상세 조회)

*   **설명**: 특정 학생의 상세 정보 조회.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN, TEACHER, STUDENT, PARENT)
*   **요청**: URL 파라미터 `id`
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "id": "uuid-student-1",
      "student_code": "S001",
      "name": "김철수",
      "email": "kim@example.com",
      "phone_number": "010-1111-2222",
      "date_of_birth": "2008-05-15",
      "address": "서울시 강남구",
      "parent": {
        "id": "uuid-parent-1",
        "name": "김학부모",
        "phone_number": "010-9999-8888",
        "relationship": "모"
      },
      "enrollments": [
        {
          "class_id": "uuid-class-1",
          "class_name": "중등 영어 A반",
          "enroll_date": "2023-03-01",
          "status": "수강중"
        }
      ]
    }
    ```

#### 2.2.4. `PUT /students/{id}` (학생 정보 수정)

*   **설명**: 특정 학생의 정보 수정.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "name": "김철수 수정",
      "phone_number": "010-1111-2222",
      "address": "서울시 서초구"
    }
    ```
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "id": "uuid-student-1",
      "name": "김철수 수정",
      "email": "kim@example.com"
    }
    ```

#### 2.2.5. `DELETE /students/{id}` (학생 정보 삭제)

*   **설명**: 특정 학생 정보 소프트 삭제.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: 없음
*   **응답 (성공)**: `204 No Content`

### 2.3. 반 관리 API

#### 2.3.1. `GET /classes` (반 목록 조회)

*   **설명**: 모든 반 또는 검색 조건에 맞는 반 목록 조회.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN, TEACHER)
*   **요청**: 쿼리 파라미터 (예: `?teacher_id=uuid-teacher-1`)
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    [
      {
        "id": "uuid-class-1",
        "name": "중등 영어 A반",
        "teacher_name": "이강사",
        "capacity": 20,
        "current_students": 15,
        "schedules": [
          {"day_of_week": 1, "start_time": "19:00", "end_time": "21:00"}
        ]
      }
    ]
    ```

#### 2.3.2. `POST /classes` (반 등록)

*   **설명**: 새로운 반 정보 등록.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "name": "고등 수학 B반",
      "teacher_id": "uuid-teacher-2",
      "capacity": 15,
      "description": "고등학생을 위한 심화 수학 반",
      "schedules": [
        {"day_of_week": 2, "start_time": "17:00", "end_time": "19:00", "room_number": "301"},
        {"day_of_week": 4, "start_time": "17:00", "end_time": "19:00", "room_number": "301"}
      ]
    }
    ```
*   **응답 (성공)**: `201 Created`, `application/json`
    ```json
    {
      "id": "uuid-class-2",
      "name": "고등 수학 B반",
      "teacher_name": "박강사"
    }
    ```

#### 2.3.3. `PUT /classes/{id}` (반 정보 수정)

*   **설명**: 특정 반의 정보 수정.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "capacity": 18,
      "description": "고등학생을 위한 심화 수학 반 (정원 변경)"
    }
    ```
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "id": "uuid-class-2",
      "name": "고등 수학 B반",
      "capacity": 18
    }
    ```

#### 2.3.4. `DELETE /classes/{id}` (반 정보 삭제)

*   **설명**: 특정 반 정보 소프트 삭제.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: 없음
*   **응답 (성공)**: `204 No Content`

### 2.4. 출결 관리 API

#### 2.4.1. `GET /attendance` (출결 목록 조회)

*   **설명**: 특정 반 또는 학생의 출결 목록 조회.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN, TEACHER, STUDENT, PARENT)
*   **요청**: 쿼리 파라미터 (예: `?class_id=uuid-class-1&date=2023-04-12`)
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    [
      {
        "id": "uuid-attendance-1",
        "student_name": "김철수",
        "class_name": "중등 영어 A반",
        "attendance_date": "2023-04-12",
        "status": "출석",
        "note": null
      },
      {
        "id": "uuid-attendance-2",
        "student_name": "이영희",
        "class_name": "중등 영어 A반",
        "attendance_date": "2023-04-12",
        "status": "지각",
        "note": "10분 늦음"
      }
    ]
    ```

#### 2.4.2. `POST /attendance` (출결 등록/수정)

*   **설명**: 특정 수업에 대한 학생들의 출결 정보 등록 또는 일괄 수정.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN, TEACHER)
*   **요청**: `application/json`
    ```json
    {
      "class_id": "uuid-class-1",
      "schedule_id": "uuid-schedule-1",
      "attendance_date": "2023-04-12",
      "attendances": [
        {
          "student_id": "uuid-student-1",
          "status": "출석",
          "note": null
        },
        {
          "student_id": "uuid-student-2",
          "status": "지각",
          "note": "10분 늦음"
        }
      ]
    }
    ```
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "message": "Attendance updated successfully"
    }
    ```

### 2.5. 공지 관리 API

#### 2.5.1. `GET /notices` (공지 목록 조회)

*   **설명**: 모든 공지 또는 검색 조건에 맞는 공지 목록 조회.
*   **인증**: `Bearer Token` (권한: ALL)
*   **요청**: 쿼리 파라미터 (예: `?target_role=STUDENT&class_id=uuid-class-1`)
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    [
      {
        "id": "uuid-notice-1",
        "title": "3월 학부모 설명회",
        "author_name": "관리자",
        "created_at": "2023-03-01T10:00:00Z",
        "view_count": 120,
        "target_role": "ALL"
      }
    ]
    ```

#### 2.5.2. `POST /notices` (공지 등록)

*   **설명**: 새로운 공지사항 등록.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "title": "4월 휴강 안내",
      "content": "4월 5일 식목일은 휴강입니다.",
      "target_role": "ALL",
      "target_class_id": null,
      "is_published": true
    }
    ```
*   **응답 (성공)**: `201 Created`, `application/json`
    ```json
    {
      "id": "uuid-notice-2",
      "title": "4월 휴강 안내",
      "author_name": "관리자"
    }
    ```

#### 2.5.3. `GET /notices/{id}` (공지 상세 조회)

*   **설명**: 특정 공지사항 상세 조회.
*   **인증**: `Bearer Token` (권한: ALL)
*   **요청**: URL 파라미터 `id`
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "id": "uuid-notice-1",
      "title": "3월 학부모 설명회",
      "content": "학부모님들의 많은 참여 부탁드립니다.",
      "author_name": "관리자",
      "created_at": "2023-03-01T10:00:00Z",
      "updated_at": "2023-03-01T10:00:00Z",
      "view_count": 121,
      "target_role": "ALL",
      "target_class_id": null,
      "is_published": true
    }
    ```

#### 2.5.4. `PUT /notices/{id}` (공지 정보 수정)

*   **설명**: 특정 공지사항 정보 수정.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "title": "3월 학부모 설명회 (수정)",
      "content": "학부모님들의 많은 참여 부탁드립니다. 장소 변경: 301호",
      "is_published": true
    }
    ```
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "id": "uuid-notice-1",
      "title": "3월 학부모 설명회 (수정)"
    }
    ```

#### 2.5.5. `DELETE /notices/{id}` (공지 정보 삭제)

*   **설명**: 특정 공지사항 소프트 삭제.
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: 없음
*   **응답 (성공)**: `204 No Content`

### 2.6. 알림톡 발송 API

#### 2.6.1. `POST /notifications/send-kakao` (카카오 알림톡 발송)

*   **설명**: 카카오 알림톡 발송 요청. (내부적으로 Provider Abstraction을 통해 처리)
*   **인증**: `Bearer Token` (권한: ACADEMY_ADMIN, SUPER_ADMIN)
*   **요청**: `application/json`
    ```json
    {
      "template_code": "KA_CLASS_REMINDER",
      "recipient_user_ids": ["uuid-student-1", "uuid-parent-1"],
      "variables": {
        "#{학생명}": "김철수",
        "#{반명}": "중등 영어 A반",
        "#{수업시간}": "19:00",
        "#{수업일}": "2023년 4월 12일"
      }
    }
    ```
*   **응답 (성공)**: `200 OK`, `application/json`
    ```json
    {
      "message": "KakaoTalk messages sent successfully",
      "sent_count": 2,
      "failed_count": 0
    }
    ```
*   **응답 (실패)**: `400 Bad Request` 또는 `500 Internal Server Error`, `application/json`
    ```json
    {
      "detail": "Failed to send some messages",
      "errors": [
        {"recipient_id": "uuid-student-3", "error": "Invalid phone number"}
      ]
    }
    ```

## 3. 에러 처리, 로그, 관리자 액션 기록

### 3.1. 에러 처리

모든 API 요청에 대해 일관된 에러 응답 형식을 제공합니다. HTTP 상태 코드와 함께 상세 에러 메시지를 포함하여 클라이언트가 에러를 효과적으로 처리할 수 있도록 합니다.

*   **400 Bad Request**: 잘못된 요청 파라미터 또는 유효성 검사 실패.
*   **401 Unauthorized**: 인증 정보 없음 또는 유효하지 않은 토큰.
*   **403 Forbidden**: 접근 권한 없음.
*   **404 Not Found**: 요청한 리소스를 찾을 수 없음.
*   **409 Conflict**: 리소스 충돌 (예: 중복된 이메일).
*   **500 Internal Server Error**: 서버 내부 오류.

### 3.2. 로그

시스템의 모든 주요 동작과 에러는 상세하게 로깅됩니다. 로깅은 애플리케이션의 디버깅, 모니터링, 문제 해결에 필수적입니다.

*   **액세스 로그**: 모든 API 요청에 대한 정보 (요청 시간, IP, 사용자 ID, 엔드포인트, HTTP 메서드, 상태 코드 등).
*   **애플리케이션 로그**: 비즈니스 로직의 주요 흐름, 경고, 정보성 메시지.
*   **에러 로그**: 모든 예외 및 에러 발생 시 스택 트레이스와 함께 상세 정보 기록.
*   **알림톡 발송 로그**: `kakao_message_logs` 테이블에 발송 이력 및 상태 기록.

### 3.3. 관리자 액션 기록

`created_by`, `updated_by` 필드를 통해 누가 언제 데이터를 생성하거나 수정했는지 기록합니다. 이는 시스템의 투명성을 높이고 문제 발생 시 추적을 용이하게 합니다. 또한, 중요한 관리자 액션 (예: 사용자 삭제, 권한 변경)은 별도의 감사 로그 테이블에 기록할 수 있습니다. (MVP에서는 `created_by`, `updated_by` 필드 활용)

## 4. 향후 모바일 앱 전환 고려 사항

현재 설계된 API는 웹 프론트엔드뿐만 아니라 향후 개발될 모바일 앱에서도 동일하게 사용될 수 있도록 RESTful 원칙을 철저히 준수합니다. 인증 방식(JWT) 또한 모바일 환경에 적합하며, API 응답 형식은 모바일 클라이언트가 파싱하기 용이한 JSON 형태입니다. 이를 통해 웹과 모바일 앱 간의 백엔드 로직 재사용성을 극대화하고 개발 효율성을 높일 수 있습니다.
