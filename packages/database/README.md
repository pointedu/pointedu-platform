# @pointedu/database

Point Education Platform의 데이터베이스 패키지입니다.

## 🗄️ 데이터베이스 구조

### 주요 엔티티

- **User** - 사용자 (관리자, 강사, 학교 담당자)
- **Instructor** - 강사 정보 및 활동 범위
- **School** - 학교 정보 및 위치
- **Program** - 진로체험 프로그램 카탈로그
- **SchoolRequest** - 학교 요청서
- **Quote** - 견적서
- **InstructorAssignment** - 강사 배정
- **Payment** - 정산 및 지급

### 자동화 지원

- **AutomationLog** - 자동화 작업 로그
- **Notification** - 알림 시스템
- **Setting** - 시스템 설정
- **AuditLog** - 감사 로그

## 🚀 사용 방법

### 1. 의존성 설치

```bash
cd packages/database
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 데이터베이스 URL을 설정합니다:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pointedu_db"
DIRECT_URL="postgresql://user:password@localhost:5432/pointedu_db"
```

### 3. Prisma Client 생성

```bash
npm run db:generate
```

### 4. 데이터베이스 마이그레이션

#### Supabase (Cloud)

```bash
npm run db:push
```

#### Local PostgreSQL

```bash
npm run db:migrate
```

### 5. Seed 데이터 생성

```bash
npm run db:seed
```

### 6. Prisma Studio 실행

```bash
npm run db:studio
```

## 📝 Scripts

- `npm run db:generate` - Prisma Client 생성
- `npm run db:migrate` - 마이그레이션 실행 (개발)
- `npm run db:push` - 스키마 Push (Supabase)
- `npm run db:seed` - Seed 데이터 생성
- `npm run db:studio` - Prisma Studio 실행

## 🔧 개발 가이드

### 스키마 수정

1. `prisma/schema.prisma` 파일 수정
2. `npm run db:push` 또는 `npm run db:migrate` 실행
3. `npm run db:generate` 실행 (타입 재생성)

### 다른 패키지에서 사용

```typescript
import { prisma, UserRole, SchoolType } from '@pointedu/database'

// 사용자 생성
const user = await prisma.user.create({
  data: {
    email: 'test@pointedu.co.kr',
    password: 'hashed_password',
    name: '테스트',
    role: UserRole.ADMIN
  }
})

// 강사 조회
const instructors = await prisma.instructor.findMany({
  where: {
    status: 'ACTIVE',
    homeBase: '영주'
  },
  include: {
    user: true,
    assignments: true
  }
})
```

## 🏗️ 데이터 모델 상세

### 강사비 체계

| 차시 | 강사비 |
|------|--------|
| 2차시 | 70,000원 |
| 3차시 | 90,000원 |
| 4차시 | 110,000원 |
| 5차시 | 130,000원 |
| 6차시 | 150,000원 |

### 교통비 체계

| 거리 | 교통비 |
|------|--------|
| 40-60km | 15,000원 |
| 70-90km | 30,000원 |
| 100km+ | 45,000원 |

### 정산 계산

```
총액 = 강사비[차시] + 교통비[거리]
원천징수 = 총액 × 0.033
실수령액 = 총액 - 원천징수
```

## 📊 ER Diagram

주요 관계:
- User → Instructor (1:1)
- User → SchoolContact (1:1)
- School → SchoolRequest (1:N)
- SchoolRequest → Quote (1:1)
- SchoolRequest → InstructorAssignment (1:N)
- InstructorAssignment → Payment (1:1)

## 🔐 보안

- 비밀번호는 bcryptjs로 해싱
- 원천징수 3.3% 자동 계산
- 감사 로그 (AuditLog) 자동 기록
- 민감한 정보는 환경 변수로 관리

## 📈 성능 최적화

- 적절한 인덱스 설정
- 관계 preloading (include/select)
- Connection pooling (Supabase)
- Query 최적화

## 🐛 트러블슈팅

### Prisma Client가 생성되지 않음

```bash
npx prisma generate
```

### 마이그레이션 충돌

```bash
npx prisma migrate reset
npm run db:seed
```

### Supabase 연결 오류

- DATABASE_URL에 `?pgbouncer=true` 추가
- DIRECT_URL 설정 확인 (포트 5432)
