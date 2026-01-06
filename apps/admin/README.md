# Point Education Admin Dashboard

포인트교육 관리자 대시보드입니다. 학교 요청, 강사 배정, 견적, 정산을 자동화하여 관리할 수 있습니다.

## 🎯 주요 기능

### 1. 대시보드
- 📊 주요 지표 요약 (총 요청, 강사 수, 월별 정산)
- 📈 완료율 및 통계
- 🔄 최근 활동 내역
- ⚡ 빠른 작업 바로가기

### 2. 학교 요청 관리
- 📝 학교 요청서 목록 조회
- ⚡ **자동 처리 버튼** (견적 + 강사 배정)
- 🔍 상태별 필터링
- 📊 요청 상세 정보

### 3. 강사 관리
- 👨‍🏫 강사 목록 및 정보
- 📍 활동 범위 및 전문 과목
- ⭐ 평점 및 실적
- 📅 가능 요일 확인

### 4. 견적 관리
- 💰 자동 생성된 견적서 조회
- 📋 견적 상세 (강사비, 교통비, 재료비)
- 📅 유효기간 관리
- 💵 최종 금액 확인

### 5. 정산 관리
- 💳 강사 정산 내역
- 🧮 자동 계산 (원천징수 3.3%)
- 📊 월별 집계
- 💰 실수령액 확인

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd apps/admin
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 확인하고 필요시 수정:

```env
# Database
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001) 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 📦 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: @pointedu/database (Prisma)
- **Automation**: @pointedu/automation
- **Icons**: Heroicons
- **Charts**: Recharts (선택)

## 🔧 프로젝트 구조

```
apps/admin/
├── app/
│   ├── dashboard/         # 대시보드 홈
│   ├── requests/          # 학교 요청 관리
│   │   ├── page.tsx
│   │   ├── AutomateButton.tsx  # 자동화 버튼
│   │   └── actions.ts          # Server Actions
│   ├── instructors/       # 강사 관리
│   ├── quotes/            # 견적 관리
│   ├── payments/          # 정산 관리
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── Sidebar.tsx        # 네비게이션
├── lib/                   # 유틸리티
└── public/                # 정적 파일
```

## ⚡ 자동화 기능 사용법

### 학교 요청 자동 처리

1. **요청 목록** 페이지로 이동
2. 상태가 **"접수됨"**인 요청 찾기
3. **"자동 처리"** 버튼 클릭
4. 자동으로 다음 작업 수행:
   - ✅ 견적 생성 (예산에 맞춰 조정)
   - ✅ 최적 강사 자동 배정
   - ✅ 알림 발송

### 자동화 알고리즘

**강사 매칭 점수** (100점 만점):
- 거리 (0-40점): 근거리 우선
- 전문성 (0-30점): 과목 일치도
- 가용성 (0-20점): 요일 확인
- 평점 (0-10점): 강사 평가

**견적 계산**:
```
강사비 + 교통비 + 재료비 + 관리비(5%)
+ 마진(15%)
+ 부가세(10%)
- 할인
= 최종 금액
```

**정산 계산**:
```
총액 = 강사비 + 교통비 + 보너스
원천징수 = 총액 × 3.3%
실수령액 = 총액 - 원천징수 - 공제
```

## 📊 대시보드 화면

### 메인 대시보드
- 총 요청 수 및 대기 건수
- 등록 강사 수 및 활동 강사 수
- 이달 정산 금액 및 건수
- 전체 요청 완료율

### 학교 요청 관리
- 요청번호, 학교명, 프로그램
- 차시/인원, 예산
- 상태 (접수됨, 견적 발송, 강사 배정, 확정됨, 완료)
- 배정된 강사 정보
- **자동 처리 버튼** ⚡

### 강사 관리
- 이름, 연락처, 거주지
- 전문 과목, 활동 범위
- 가능 요일
- 배정 건수, 정산 건수, 평점

### 견적 관리
- 견적번호, 학교, 프로그램
- 강사비, 교통비, 재료비
- 최종 금액, 유효기한

### 정산 관리
- 정산번호, 강사, 학교
- 강사비, 교통비, 총액
- 원천징수 (3.3% 자동 계산)
- 실수령액, 상태

## 🔒 인증 (예정)

NextAuth를 사용한 관리자 인증:
- 이메일/비밀번호 로그인
- 세션 관리
- 권한 기반 접근 제어

## 🚀 배포

### Vercel

```bash
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 📝 개발 가이드

### 새 페이지 추가

1. `app/[페이지명]/page.tsx` 생성
2. `app/[페이지명]/layout.tsx` 생성 (Sidebar 포함)
3. `components/Sidebar.tsx`에 네비게이션 추가

### Server Actions 추가

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function myAction(data: FormData) {
  // 작업 수행

  // 페이지 재검증
  revalidatePath('/page-path')

  return { success: true, message: '완료' }
}
```

### 자동화 기능 활용

```typescript
import { AutomationWorkflow } from '@pointedu/automation'

const result = await AutomationWorkflow.processSchoolRequest({
  requestId,
  adminUserId,
  autoAssign: true,
  adjustToBudget: true,
})
```

## 🐛 트러블슈팅

### 데이터베이스 연결 오류

```bash
# Prisma 클라이언트 재생성
cd ../../packages/database
npx prisma generate
```

### 빌드 오류

```bash
# 캐시 삭제
rm -rf .next
npm run build
```

### 자동화 실패

- 데이터베이스 연결 확인
- Prisma 스키마 마이그레이션 확인
- Server Action 로그 확인

## 📄 라이센스

Private - Point Education Co., Ltd.
