# @pointedu/automation

Point Education Platform의 **업무 자동화 엔진**입니다.

## 🎯 주요 기능

### 1. 강사 자동 배정 (Instructor Scheduler)
- 거리, 전문성, 가용성 기반 최적 강사 매칭
- 자동 배정 알고리즘 (0-100점 스코어링)
- 일정 충돌 자동 감지

### 2. 정산 자동 계산 (Payment Calculator)
- 강사비 자동 계산 (차시별 체계)
- 교통비 자동 산정 (거리 기반)
- 원천징수 3.3% 자동 계산
- 월별 정산 집계

### 3. 견적 자동 생성 (Quote Generator)
- 프로그램별 재료비 자동 계산
- 마진/부가세 자동 적용
- 예산 맞춤 조정 기능

### 4. 알림 자동 발송 (Notification Manager)
- 강사 배정 알림
- 견적 발송 알림
- 정산 완료 알림

## 📦 설치

```bash
cd packages/automation
npm install
```

## 🚀 사용 방법

### 기본 사용

```typescript
import {
  autoAssignInstructor,
  autoGenerateQuote,
  autoGeneratePayment,
  AutomationWorkflow,
} from '@pointedu/automation'

// 1. 강사 자동 배정
const result = await autoAssignInstructor('request-id')
console.log(result.message) // "김가람 강사에게 자동 배정되었습니다. (점수: 85점)"

// 2. 견적 자동 생성
const quote = await autoGenerateQuote('request-id', 'admin-user-id', true)
console.log(quote.message) // "견적이 자동 생성되었습니다. (총액: 392,150원)"

// 3. 정산 자동 계산
const payment = await autoGeneratePayment('assignment-id', 'admin-user-id')
console.log(payment.message) // "정산이 자동 생성되었습니다. (실수령액: 67,690원)"
```

### 통합 워크플로우

```typescript
// 학교 요청 → 견적 → 강사 배정 (전체 자동화)
const result = await AutomationWorkflow.processSchoolRequest({
  requestId: 'REQ-2025-001',
  adminUserId: 'admin-id',
  autoAssign: true,
  adjustToBudget: true,
})

console.log(result)
/*
{
  success: true,
  quote: { quoteId: 'QT-2025-001', amount: 392150 },
  assignment: { assignmentId: 'ASSIGN-001', instructorName: '김가람' },
  message: '견적이 생성되었습니다. 강사가 배정되었습니다.'
}
*/

// 수업 완료 → 자동 정산
const paymentResult = await AutomationWorkflow.processCompletedClass({
  assignmentId: 'ASSIGN-001',
  approvedBy: 'admin-id',
})
```

## 🔧 모듈별 상세

### Instructor Scheduler

```typescript
import { matchInstructorsForRequest, autoAssignInstructor } from '@pointedu/automation'

// 강사 매칭 (수동 선택용)
const matches = await matchInstructorsForRequest('request-id')
matches.forEach((match) => {
  console.log(`${match.instructor.name}: ${match.score}점`)
  console.log(`사유: ${match.reasons.join(', ')}`)
})

// 자동 배정
const result = await autoAssignInstructor('request-id')
```

**매칭 알고리즘**:
- 거리 점수 (0-40점): 근거리 우선
- 전문성 점수 (0-30점): 과목 일치도
- 가용성 점수 (0-20점): 요일/일정
- 평점 점수 (0-10점): 강사 평가

### Payment Calculator

```typescript
import {
  calculatePaymentForAssignment,
  getMonthlyPaymentSummary,
  SESSION_FEE_TABLE,
} from '@pointedu/automation'

// 정산 계산
const calculation = await calculatePaymentForAssignment('assignment-id', {
  actualSessions: 2,
  bonus: 10000,
})

console.log(calculation.breakdown)
/*
{
  sessionFeePerSession: 35000,
  totalSessionFee: 70000,
  transportFee: 15000,
  grossAmount: 85000,
  taxRate: 0.033,
  taxAmount: 2805,
  netAmount: 82195
}
*/

// 월별 집계
const summary = await getMonthlyPaymentSummary('2025-02')
console.log(summary.instructorBreakdown)
```

**강사비 체계**:
```typescript
{
  2: 70000,   // 2차시: 70,000원
  3: 90000,   // 3차시: 90,000원
  4: 110000,  // 4차시: 110,000원
  5: 130000,  // 5차시: 130,000원
  6: 150000,  // 6차시: 150,000원
}
```

### Quote Generator

```typescript
import { calculateQuoteForRequest, adjustQuoteToBudget } from '@pointedu/automation'

// 견적 계산
const quote = await calculateQuoteForRequest('request-id', {
  marginRate: 0.15, // 15% 마진
  discount: 10000, // 할인
})

console.log(quote.breakdown)

// 예산 맞춤 조정
const adjusted = await adjustQuoteToBudget('request-id', 150000)
console.log(adjusted.adjustments) // ["마진율 15.0% → 12.0%", "할인 5,000원 적용"]
```

**견적 구성**:
```
견적 = 강사비 + 교통비 + 재료비 + 관리비
     + 마진 (15%)
     + 부가세 (10%)
     - 할인
```

### Notification Manager

```typescript
import {
  notifyInstructorAssignment,
  notifyQuoteGenerated,
  getUserNotifications,
} from '@pointedu/automation'

// 강사 배정 알림
await notifyInstructorAssignment('assignment-id')

// 견적 생성 알림
await notifyQuoteGenerated('quote-id')

// 사용자 알림 조회
const notifications = await getUserNotifications('user-id', {
  unreadOnly: true,
  limit: 10,
})
```

## 🧪 테스트

```bash
npm test
npm run test:watch
```

## 📊 성능 최적화

- 배치 처리: 여러 요청 동시 처리
- 캐싱: 자주 사용되는 데이터 캐싱
- 병렬 처리: 독립적인 작업 병렬 실행

## 🔒 보안

- 원천징수 자동 계산 (탈세 방지)
- 감사 로그 자동 기록
- 권한 기반 승인 프로세스

## 📝 라이센스

Private - Point Education Co., Ltd.
