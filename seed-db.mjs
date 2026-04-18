import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('🌱 데이터베이스 시딩 시작...');

  // 1. 사용자 데이터 삽입
  console.log('👥 사용자 데이터 삽입 중...');
  const users = [
    ['admin-001', '김관리자', 'admin@academy.com', '010-1234-5678', 'oauth', 'admin'],
    ['teacher-001', '박강사', 'teacher1@academy.com', '010-2222-2222', 'oauth', 'teacher'],
    ['teacher-002', '이강사', 'teacher2@academy.com', '010-3333-3333', 'oauth', 'teacher'],
    ['student-001', '김철수', 'student1@academy.com', '010-4444-4444', 'oauth', 'student'],
    ['student-002', '이영희', 'student2@academy.com', '010-5555-5555', 'oauth', 'student'],
    ['student-003', '박민준', 'student3@academy.com', '010-6666-6666', 'oauth', 'student'],
    ['student-004', '최지은', 'student4@academy.com', '010-7777-7777', 'oauth', 'student'],
    ['student-005', '정준호', 'student5@academy.com', '010-8888-8888', 'oauth', 'student'],
  ];

  for (const [openId, name, email, phone, loginMethod, role] of users) {
    await connection.execute(
      'INSERT INTO users (openId, name, email, phone, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
      [openId, name, email, phone, loginMethod, role]
    );
  }
  console.log('✅ 사용자 데이터 삽입 완료');

  // 2. 강사 데이터 삽입
  console.log('👨‍🏫 강사 데이터 삽입 중...');
  const teachers = [
    [2, '박강사', '010-2222-2222', 'teacher1@academy.com', '수학', '수학 전문가'],
    [3, '이강사', '010-3333-3333', 'teacher2@academy.com', '영어', '영어 전문가'],
  ];

  for (const [userId, name, phone, email, subject, bio] of teachers) {
    await connection.execute(
      'INSERT INTO teachers (userId, name, phone, email, subject, bio, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())',
      [userId, name, phone, email, subject, bio]
    );
  }
  console.log('✅ 강사 데이터 삽입 완료');

  // 3. 반(Class) 데이터 삽입
  console.log('📚 반 데이터 삽입 중...');
  const classes = [
    ['수학 기초반', '수학', 2, 20, '101호', '초등 수학 기초 과정'],
    ['수학 심화반', '수학', 2, 15, '102호', '초등 수학 심화 과정'],
    ['영어 회화반', '영어', 3, 18, '103호', '초등 영어 회화 과정'],
    ['영어 문법반', '영어', 3, 20, '104호', '초등 영어 문법 과정'],
  ];

  const classIds = [];
  for (const [name, subject, teacherId, capacity, room, description] of classes) {
    const [result] = await connection.execute(
      'INSERT INTO classes (name, subject, teacherId, capacity, room, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())',
      [name, subject, teacherId, capacity, room, description]
    );
    classIds.push(result.insertId);
  }
  console.log('✅ 반 데이터 삽입 완료');

  // 4. 학생 데이터 삽입
  console.log('🎓 학생 데이터 삽입 중...');
  const students = [
    [4, '김철수', 'student1@academy.com', '010-4444-4444', '010-9999-9999', '김철수 부모', '2010-05-15', '서울시 강남구'],
    [5, '이영희', 'student2@academy.com', '010-5555-5555', '010-8888-8888', '이영희 부모', '2010-08-20', '서울시 강남구'],
    [6, '박민준', 'student3@academy.com', '010-6666-6666', '010-7777-7777', '박민준 부모', '2011-02-10', '서울시 서초구'],
    [7, '최지은', 'student4@academy.com', '010-7777-7777', '010-6666-6666', '최지은 부모', '2011-06-25', '서울시 서초구'],
    [8, '정준호', 'student5@academy.com', '010-8888-8888', '010-5555-5555', '정준호 부모', '2010-11-30', '서울시 강동구'],
  ];

  const studentIds = [];
  for (const [userId, name, email, phone, parentPhone, parentName, dateOfBirth, address] of students) {
    const [result] = await connection.execute(
      'INSERT INTO students (userId, name, email, phone, parentPhone, parentName, dateOfBirth, address, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())',
      [userId, name, email, phone, parentPhone, parentName, dateOfBirth, address]
    );
    studentIds.push(result.insertId);
  }
  console.log('✅ 학생 데이터 삽입 완료');

  // 5. 클래스 시간표 데이터 삽입
  console.log('⏰ 시간표 데이터 삽입 중...');
  const schedules = [
    [classIds[0], 1, '09:00', '10:00'], // 월
    [classIds[0], 3, '09:00', '10:00'], // 수
    [classIds[0], 5, '09:00', '10:00'], // 금
    [classIds[1], 2, '10:00', '11:00'], // 화
    [classIds[1], 4, '10:00', '11:00'], // 목
    [classIds[2], 1, '14:00', '15:00'], // 월
    [classIds[2], 5, '14:00', '15:00'], // 금
    [classIds[3], 3, '15:00', '16:00'], // 수
  ];

  for (const [classId, dayOfWeek, startTime, endTime] of schedules) {
    await connection.execute(
      'INSERT INTO classSchedules (classId, dayOfWeek, startTime, endTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [classId, dayOfWeek, startTime, endTime]
    );
  }
  console.log('✅ 시간표 데이터 삽입 완료');

  // 6. 학생-반 연결 데이터 삽입
  console.log('🔗 학생-반 연결 데이터 삽입 중...');
  const enrollments = [
    [classIds[0], studentIds[0], 'active'],
    [classIds[0], studentIds[1], 'active'],
    [classIds[1], studentIds[2], 'active'],
    [classIds[2], studentIds[3], 'active'],
    [classIds[3], studentIds[4], 'active'],
  ];

  for (const [classId, studentId, status] of enrollments) {
    await connection.execute(
      'INSERT INTO classEnrollments (classId, studentId, status, enrolledAt, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
      [classId, studentId, status]
    );
  }
  console.log('✅ 학생-반 연결 데이터 삽입 완료');

  // 7. 출결 데이터 삽입
  console.log('📋 출결 데이터 삽입 중...');
  const today = new Date();
  const attendanceData = [
    [classIds[0], studentIds[0], new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'present', null, 1],
    [classIds[0], studentIds[1], new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'late', '5분 지각', 1],
    [classIds[1], studentIds[2], new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'absent', '병가', 1],
    [classIds[2], studentIds[3], new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'present', null, 1],
    [classIds[3], studentIds[4], new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'early_leave', '조퇴', 1],
  ];

  for (const [classId, studentId, attendanceDate, status, notes, recordedBy] of attendanceData) {
    await connection.execute(
      'INSERT INTO attendance (classId, studentId, attendanceDate, status, notes, recordedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [classId, studentId, attendanceDate, status, notes, recordedBy]
    );
  }
  console.log('✅ 출결 데이터 삽입 완료');

  // 8. 공지사항 데이터 삽입
  console.log('📢 공지사항 데이터 삽입 중...');
  const notices = [
    ['2월 수강료 납부 안내', '2월 수강료 납부 기한은 2월 1일입니다. 지정된 계좌로 입금해주시기 바랍니다.', 1, JSON.stringify(['student', 'parent']), null, null, true],
    ['설날 휴원 안내', '설날(2월 10일)에는 휴원합니다. 양해 부탁드립니다.', 1, JSON.stringify(['student', 'parent', 'teacher']), null, null, true],
    ['3월 신학기 안내', '3월부터 새로운 학기가 시작됩니다. 시간표 변경사항을 확인해주세요.', 1, JSON.stringify(['student', 'parent']), null, null, false],
  ];

  for (const [title, content, createdBy, targetRoles, targetClassIds, attachmentUrls, isPublished] of notices) {
    await connection.execute(
      'INSERT INTO notices (title, content, createdBy, targetRoles, targetClassIds, attachmentUrls, isPublished, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [title, content, createdBy, targetRoles, targetClassIds, attachmentUrls, isPublished, isPublished ? new Date() : null]
    );
  }
  console.log('✅ 공지사항 데이터 삽입 완료');

  // 9. 알림톡 템플릿 데이터 삽입
  console.log('🔔 알림톡 템플릿 데이터 삽입 중...');
  const templates = [
    ['수업 시작 알림', 'kakao_talk', null, '수업 시작 안내', '[{studentName}]님의 [{className}] 수업이 곧 시작됩니다. 시간: [{startTime}]', JSON.stringify(['studentName', 'className', 'startTime']), 'class_start', true],
    ['수강료 납부 안내', 'kakao_talk', null, '수강료 납부 안내', '[{studentName}]님의 [{month}] 수강료 납부 기한은 [{dueDate}]입니다.', JSON.stringify(['studentName', 'month', 'dueDate']), 'payment_due', true],
    ['미납 안내', 'sms', null, '미납 안내', '[{studentName}]님의 미납 수강료가 있습니다. 빠른 시일 내에 납부 부탁드립니다.', JSON.stringify(['studentName']), 'unpaid_notice', true],
  ];

  for (const [name, provider, templateId, title, content, variables, eventType, isActive] of templates) {
    await connection.execute(
      'INSERT INTO notificationTemplates (name, provider, templateId, title, content, variables, eventType, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, provider, templateId, title, content, variables, eventType, isActive]
    );
  }
  console.log('✅ 알림톡 템플릿 데이터 삽입 완료');

  console.log('\n✨ 모든 샘플 데이터 삽입 완료!');
  console.log('\n📝 테스트 계정:');
  console.log('  - 관리자: admin@academy.com');
  console.log('  - 강사: teacher1@academy.com, teacher2@academy.com');
  console.log('  - 학생: student1@academy.com ~ student5@academy.com');

} catch (error) {
  console.error('❌ 에러 발생:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
