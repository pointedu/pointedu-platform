# Point Education Platform

포인트교육 통합 관리 플랫폼 - 교육 프로그램 운영, 강사 관리, 학교 요청 처리를 위한 올인원 솔루션

## 주요 기능

### 관리자 패널 (Admin)
- **대시보드**: 실시간 통계 및 현황 모니터링
- **학교 요청 관리**: 프로그램 요청 접수, 상태 관리, 견적서 생성
- **수업 지원 관리**: 강사 지원 승인/거절 처리
- **강사 관리**: 강사 등록, 승인, 상태 관리
- **일정 관리**: 캘린더 기반 수업 일정 관리
- **정산 관리**: 강사 정산 내역 관리
- **학교/프로그램/공지사항/자료실 관리**

### 웹사이트 (Web)
- 회사 소개 및 프로그램 안내
- 프로그램 목록 및 상세 정보
- 문의하기 기능

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | NextAuth.js |
| **Styling** | Tailwind CSS |
| **Monorepo** | Turborepo |
| **Package Manager** | npm |

## 프로젝트 구조

```
pointedu-platform/
├── apps/
│   ├── admin/          # 관리자 패널 (Next.js)
│   └── web/            # 메인 웹사이트 (Next.js)
├── packages/
│   ├── database/       # Prisma 스키마 및 DB 클라이언트
│   ├── ui/             # 공유 UI 컴포넌트
│   └── automation/     # 자동화 유틸리티 (견적, 정산 계산 등)
├── services/
│   ├── auth/           # 인증 서비스
│   ├── notification/   # 알림 서비스
│   └── analytics/      # 분석 서비스
└── scripts/            # 유틸리티 스크립트
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- npm 9+

### 설치

```bash
# 저장소 클론
git clone https://github.com/pointedu/pointedu-platform.git
cd pointedu-platform

# 의존성 설치
npm install

# 환경변수 설정
cp packages/database/.env.example packages/database/.env
# .env 파일에 DATABASE_URL 설정

# 데이터베이스 마이그레이션
cd packages/database
npx prisma db push
npx prisma generate

# 시드 데이터 생성 (선택)
npx tsx src/seed.ts
```

### 개발 서버 실행

```bash
# 전체 프로젝트 실행
npm run dev

# 개별 앱 실행
npm run dev --filter=admin    # 관리자 패널 (포트 3001)
npm run dev --filter=web      # 웹사이트 (포트 3000)
```

### 빌드

```bash
# 전체 빌드
npm run build

# 개별 앱 빌드
npm run build --filter=admin
npm run build --filter=web
```

## 환경변수

### packages/database/.env

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pointedu"
```

### apps/admin/.env.local

```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3001"
```

## 관리자 접속 정보

- **URL**: http://localhost:3001
- **이메일**: admin@pointedu.co.kr
- **비밀번호**: pointedu2025

## API 엔드포인트

### 학교 요청 (Requests)
- `GET /api/requests` - 요청 목록 조회
- `POST /api/requests` - 새 요청 생성
- `GET /api/requests/[id]` - 요청 상세 조회
- `PATCH /api/requests/[id]` - 요청 수정
- `DELETE /api/requests/[id]` - 요청 삭제

### 강사 (Instructors)
- `GET /api/instructors` - 강사 목록
- `POST /api/instructors` - 강사 등록
- `PUT /api/instructors/[id]` - 강사 수정
- `DELETE /api/instructors/[id]` - 강사 삭제
- `POST /api/instructors/[id]/approve` - 강사 승인
- `POST /api/instructors/[id]/reject` - 강사 거절

### 수업 지원 (Applications)
- `GET /api/applications` - 지원 목록
- `POST /api/applications/[id]/approve` - 지원 승인
- `POST /api/applications/[id]/reject` - 지원 거절

### 기타
- `/api/schools` - 학교 관리
- `/api/programs` - 프로그램 관리
- `/api/schedules` - 일정 관리
- `/api/payments` - 정산 관리
- `/api/quotes` - 견적서 관리
- `/api/notices` - 공지사항 관리
- `/api/resources` - 자료실 관리

## 데이터베이스 스키마

주요 모델:
- **User**: 사용자 (관리자, 강사)
- **Instructor**: 강사 정보
- **School**: 학교 정보
- **Program**: 교육 프로그램
- **SchoolRequest**: 학교 요청
- **ClassApplication**: 수업 지원
- **InstructorAssignment**: 강사 배정
- **Payment**: 정산 내역
- **Quote**: 견적서

## 라이선스

Private - Point Education Co., Ltd.

## 문의

- **회사**: 포인트교육
- **이메일**: admin@pointedu.co.kr
