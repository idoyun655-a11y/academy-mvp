#!/bin/bash

# 학원 관리 시스템 - 로컬 실행 스크립트

echo "🚀 학원 관리 시스템 시작..."
echo ""

# 1. 의존성 확인
echo "📦 의존성 확인 중..."
if [ ! -d "node_modules" ]; then
  echo "   → node_modules 없음, 설치 중..."
  npm install
fi

echo ""

# 2. 환경 변수 설정
echo "⚙️  환경 설정 중..."
if [ ! -f ".env.local" ]; then
  echo "   → .env.local 생성 중..."
  cp .env.local.example .env.local 2>/dev/null || echo "   → .env.local 파일 사용"
fi

echo ""

# 3. 포트 확인
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  포트 $PORT이 이미 사용 중입니다."
  echo "   다른 포트를 사용하려면: PORT=3001 npm run dev"
  echo ""
  read -p "계속하시겠습니까? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""

# 4. 개발 서버 시작
echo "🎯 개발 서버 시작 (포트: $PORT)..."
echo "   → http://localhost:$PORT"
echo ""
echo "📝 테스트 계정:"
echo "   관리자: admin@test.com / admin123"
echo "   학생:   student1@test.com / student123"
echo ""
echo "⏹️  종료하려면 Ctrl+C를 누르세요"
echo ""

npm run dev
