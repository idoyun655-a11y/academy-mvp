# Railway 배포 가이드

이 문서는 코딩을 몰라도 이 프로젝트를 인터넷에 올릴 수 있게 단계별로 정리한 안내서입니다.

## 1. 먼저 알아둘 것

- 이 프로젝트는 `프론트 + 백엔드`가 한 번에 같이 배포됩니다.
- 클라우드 운영에서는 `local json 저장`이 아니라 `MySQL`을 써야 합니다.
- 배포 전에 `GitHub 저장소`가 있어야 합니다.

## 2. 지금 제가 이미 해둔 것

- `.gitignore`를 추가해서 비밀 파일과 빌드 파일이 GitHub에 안 올라가게 했습니다.
- `.env.example`를 추가해서 어떤 환경변수를 넣어야 하는지 정리했습니다.
- 서버가 시작될 때마다 관리자 비밀번호를 기본값으로 덮어쓰던 문제를 수정했습니다.
- 운영 환경에서는 `JWT_SECRET`과 `DEFAULT_ADMIN_PASSWORD`가 없으면 서버가 안 뜨게 바꿨습니다.

## 3. GitHub에 올리기

### 해야 할 일

1. GitHub에 로그인합니다.
2. `New repository`를 누릅니다.
3. 저장소 이름을 정합니다.
   - 예: `academy-system`
4. `Private`로 만듭니다.
5. 이 폴더 전체를 그 저장소에 올립니다.

### 꼭 주의할 것

- `.env.local`은 올리면 안 됩니다.
- `server/.data` 폴더도 올리지 않는 것이 맞습니다.
- 제가 `.gitignore`를 넣어놨기 때문에 Git이 정상적으로 동작하면 자동으로 제외됩니다.

## 4. Railway 프로젝트 만들기

공식 문서:
- https://docs.railway.com/quick-start
- https://docs.railway.com/databases/mysql
- https://docs.railway.com/variables
- https://docs.railway.com/networking/domains/working-with-domains

### 해야 할 일

1. [Railway](https://railway.app/)에 로그인합니다.
2. `New Project`를 누릅니다.
3. `Deploy from GitHub repo`를 선택합니다.
4. 방금 만든 GitHub 저장소를 연결합니다.

## 5. MySQL 추가하기

### 해야 할 일

1. Railway 프로젝트 안에서 `New` 또는 `Add Service`를 누릅니다.
2. `Database`를 선택합니다.
3. `MySQL`을 선택합니다.
4. 생성이 끝나면 MySQL 서비스가 프로젝트 안에 생깁니다.

## 6. 환경변수 넣기

앱 서비스의 `Variables` 메뉴에서 아래 값을 넣습니다.

### 필수

- `NODE_ENV=production`
- `JWT_SECRET=아주길고예측불가능한문자열`
- `DEFAULT_ADMIN_PASSWORD=관리자로그인에쓸강력한비밀번호`
- `DEFAULT_ADMIN_EMAIL=원장님이쓸이메일`

### DB 연결

- `DATABASE_URL`
  - Railway MySQL이 만든 연결 문자열을 넣으면 됩니다.
  - 보통 Railway 변수 참조로 연결합니다.

### 선택

- `DEFAULT_ADMIN_NAME=ET영어전문학원 관리자`
- `OAUTH_SERVER_URL=필요할 때만`
- `VITE_APP_ID=필요할 때만`
- `OWNER_OPEN_ID=필요할 때만`

## 7. 빌드/실행 명령

Railway가 자동 인식하지 못하면 아래처럼 설정하면 됩니다.

### Build Command

```bash
npm run build
```

### Start Command

```bash
npm run start
```

## 8. DB 반영하기

MySQL을 처음 붙인 뒤에는 테이블을 만들어야 합니다.

실행 명령:

```bash
npm run db:push
```

이 작업은 아래 둘 중 하나로 하면 됩니다.

- 로컬 컴퓨터에서 Railway의 `DATABASE_URL`을 넣고 실행
- GitHub Codespaces나 Railway 셸에서 실행

## 9. 주소 만들기

### Railway 기본 주소

1. 앱 서비스의 `Settings`
2. `Domains`
3. `Generate Domain`

이렇게 하면 `https://...up.railway.app` 같은 주소가 생깁니다.

### 내 도메인 연결

원하면 `academy.example.com` 같은 주소도 연결할 수 있습니다.

## 10. 배포 후 바로 확인할 것

1. 로그인 페이지가 열리는지 확인
2. 관리자 계정으로 로그인되는지 확인
3. 학생 관리 화면이 열리는지 확인
4. 반 관리에서 시간표 저장이 되는지 확인
5. 출결 일괄 저장이 되는지 확인

## 11. 어디서든 수정하려면

가장 쉬운 방법은 `GitHub Codespaces`입니다.

공식 문서:
- https://docs.github.com/en/codespaces/about-codespaces/codespaces-features
- https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository

### 방식

1. GitHub 저장소를 엽니다.
2. `Code`
3. `Codespaces`
4. `Create codespace on main`

그러면 브라우저 안에서 VS Code처럼 수정할 수 있습니다.

## 12. 추천 운영 방식

- `main` 브랜치: 실제 운영
- `staging` 브랜치: 테스트용
- Railway도 `운영`과 `테스트`를 나눠서 쓰는 것이 좋습니다.

## 13. 제가 다음에 도와드릴 수 있는 것

- GitHub 올리기용 최종 점검
- 배포 전에 꼭 바꿔야 하는 값 체크
- Railway 화면에서 어디를 눌러야 하는지 더 자세한 순서 설명
- 배포 후 로그인/학생/출결 기능 점검
