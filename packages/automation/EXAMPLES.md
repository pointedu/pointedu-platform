# Point Education Automation - 사용 예시

## 📖 시나리오별 사용 가이드

### 시나리오 1: 학교에서 새 요청서가 접수됨

```typescript
import { AutomationWorkflow } from '@pointedu/automation'

// 전체 자동화 (견적 + 강사 배정)
const result = await AutomationWorkflow.processSchoolRequest({
  requestId: 'REQ-2025-003',
  adminUserId: 'admin-123',
  autoAssign: true,          // 자동으로 강사도 배정
  adjustToBudget: true,       // 예산에 맞춰 견적 조정
})

if (result.success) {
  console.log('✅ 자동화 완료!')
  console.log(`견적: ${result.quote?.amount.toLocaleString()}원`)
  console.log(`배정 강사: ${result.assignment?.instructorName}`)
}
```

**결과**:
- 견적서 자동 생성 → 학교 담당자에게 이메일 발송
- 최적 강사 자동 배정 → 강사에게 알림 발송
- 관리자 대시보드에 요청 상태 업데이트

---

### 시나리오 2: 수업이 완료됨

```typescript
import { AutomationWorkflow, notifyInstructorAssignment } from '@pointedu/automation'

// 배정 완료 처리
await prisma.instructorAssignment.update({
  where: { id: 'ASSIGN-001' },
  data: {
    status: 'COMPLETED',
    completedAt: new Date(),
    actualSessions: 2,
    attendanceCount: 30,
  },
})

// 자동 정산
const payment = await AutomationWorkflow.processCompletedClass({
  assignmentId: 'ASSIGN-001',
  approvedBy: 'admin-123',
})

console.log(`정산 완료: ${payment.amount?.toLocaleString()}원`)
// → 강사에게 정산 완료 알림 자동 발송
```

**결과**:
- 정산 자동 계산 (강사비 + 교통비 - 원천징수 3.3%)
- 정산 레코드 생성
- 강사에게 정산 완료 이메일 발송

---

### 시나리오 3: 수동으로 강사 선택하기

```typescript
import { matchInstructorsForRequest } from '@pointedu/automation'

// 매칭 가능한 강사 목록 조회
const matches = await matchInstructorsForRequest('REQ-2025-004')

console.log('=== 추천 강사 목록 ===')
matches.forEach((match, index) => {
  console.log(`${index + 1}. ${match.instructor.name} (${match.score}점)`)
  console.log(`   전문 과목: ${match.instructor.subjects.join(', ')}`)
  console.log(`   거리: ${match.distance}km`)
  console.log(`   사유: ${match.reasons.join(', ')}`)
  console.log(`   가능 여부: ${match.available ? '✅' : '❌'}`)
  console.log('')
})

// 관리자가 수동으로 선택
const selectedInstructor = matches[0]
await prisma.instructorAssignment.create({
  data: {
    requestId: 'REQ-2025-004',
    instructorId: selectedInstructor.instructor.id,
    status: 'PROPOSED',
  },
})
```

**출력 예시**:
```
=== 추천 강사 목록 ===
1. 김가람 (85점)
   전문 과목: 항공기 조종사, 로봇공학, STEAM
   거리: 5km
   사유: 같은 지역 (영주시), 전문 과목 일치 (항공기 조종사), 가능 요일 (화)
   가능 여부: ✅

2. 이서현 (73점)
   전문 과목: AI 작곡, 디지털 드로잉, 영상 제작
   거리: 50km
   사유: 중거리 (60km 이내), 풍부한 경력 (4년), 우수 평점 (4.9점)
   가능 여부: ✅
```

---

### 시나리오 4: 견적을 예산에 맞춰 조정

```typescript
import { adjustQuoteToBudget } from '@pointedu/automation'

// 학교 예산이 150,000원인 경우
const result = await adjustQuoteToBudget('REQ-2025-005', 150000)

if (result.success) {
  console.log('✅ 예산에 맞춰 조정 완료')
  console.log(`조정 내역: ${result.adjustments?.join(', ')}`)
  console.log(`최종 금액: ${result.quote?.finalTotal.toNumber().toLocaleString()}원`)
}
```

**조정 로직**:
1. 마진율 감소 (15% → 최소 10%)
2. 필요시 할인 적용

**출력 예시**:
```
✅ 예산에 맞춰 조정 완료
조정 내역: 마진율 15.0% → 12.0%, 할인 5,000원 적용
최종 금액: 150,000원
```

---

### 시나리오 5: 월별 정산 집계

```typescript
import { getMonthlyPaymentSummary } from '@pointedu/automation'

const summary = await getMonthlyPaymentSummary('2025-02')

console.log('=== 2025년 2월 정산 요약 ===')
console.log(`총 정산 건수: ${summary.totalPayments}건`)
console.log(`총 지급액: ${summary.totalNetAmount.toNumber().toLocaleString()}원`)
console.log(`총 원천징수: ${summary.totalTaxWithholding.toNumber().toLocaleString()}원`)
console.log('')
console.log('=== 강사별 집계 ===')
summary.instructorBreakdown.forEach((item) => {
  console.log(`${item.instructorName}: ${item.count}건, ${item.totalAmount.toNumber().toLocaleString()}원`)
})
```

**출력 예시**:
```
=== 2025년 2월 정산 요약 ===
총 정산 건수: 15건
총 지급액: 1,215,350원
총 원천징수: 40,455원

=== 강사별 집계 ===
김가람: 5건, 337,750원
박민호: 4건, 268,600원
이서현: 6건, 609,000원
```

---

### 시나리오 6: 커스텀 정산 계산

```typescript
import { calculatePaymentForAssignment } from '@pointedu/automation'

// 특별 수당 또는 공제가 있는 경우
const calculation = await calculatePaymentForAssignment('ASSIGN-002', {
  actualSessions: 4,        // 실제 진행 차시
  bonus: 20000,             // 우수 강의 보너스
  deductions: 5000,         // 장비 손실 공제
})

console.log('=== 정산 상세 ===')
console.log(`강사비: ${calculation.breakdown.totalSessionFee.toLocaleString()}원`)
console.log(`교통비: ${calculation.breakdown.transportFee.toLocaleString()}원`)
console.log(`보너스: ${calculation.bonus.toNumber().toLocaleString()}원`)
console.log(`소계: ${calculation.breakdown.grossAmount.toLocaleString()}원`)
console.log(`원천징수 (3.3%): -${calculation.breakdown.taxAmount.toLocaleString()}원`)
console.log(`공제: -${calculation.deductions.toNumber().toLocaleString()}원`)
console.log(`실수령액: ${calculation.breakdown.netAmount.toLocaleString()}원`)
```

**출력 예시**:
```
=== 정산 상세 ===
강사비: 110,000원
교통비: 15,000원
보너스: 20,000원
소계: 145,000원
원천징수 (3.3%): -4,785원
공제: -5,000원
실수령액: 135,215원
```

---

### 시나리오 7: 알림 관리

```typescript
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from '@pointedu/automation'

// 사용자 알림 조회
const notifications = await getUserNotifications('instructor-user-id', {
  unreadOnly: true,
  limit: 10,
})

console.log(`읽지 않은 알림: ${notifications.length}개`)
notifications.forEach((notif) => {
  console.log(`[${notif.type}] ${notif.title}`)
  console.log(notif.message)
  console.log(`---`)
})

// 알림 읽음 처리
for (const notif of notifications) {
  await markNotificationAsRead(notif.id)
}
```

**출력 예시**:
```
읽지 않은 알림: 3개
[EMAIL] 새로운 수업이 배정되었습니다
안녕하세요,

영주제일고등학교의 항공기 조종사 진로체험 수업이 배정되었습니다.
일정: 2025년 2월 15일

포인트교육 드림
---
[EMAIL] 정산이 완료되었습니다
안녕하세요,

2025-02 정산이 완료되었습니다.
지급액: 337,750원

포인트교육 드림
---
```

---

## 🔄 전체 워크플로우 예시

```typescript
// 학교 요청부터 정산까지 전체 흐름
async function fullWorkflow() {
  // 1. 학교 요청 접수
  const request = await prisma.schoolRequest.create({
    data: {
      requestNumber: 'REQ-2025-006',
      schoolId: 'school-001',
      programId: 'program-001',
      sessions: 2,
      studentCount: 30,
      targetGrade: '고1',
      desiredDate: new Date('2025-02-20'),
      schoolBudget: 120000,
      status: 'SUBMITTED',
    },
  })

  // 2. 자동 견적 + 강사 배정
  const automation = await AutomationWorkflow.processSchoolRequest({
    requestId: request.id,
    adminUserId: 'admin-123',
    autoAssign: true,
    adjustToBudget: true,
  })

  console.log('Step 1: 견적 생성 및 강사 배정 완료')
  console.log(automation)

  // 3. 학교 승인 (수동)
  await prisma.schoolRequest.update({
    where: { id: request.id },
    data: { status: 'APPROVED' },
  })

  // 4. 강사 확인 (수동)
  await prisma.instructorAssignment.update({
    where: { id: automation.assignment?.assignmentId },
    data: { status: 'ACCEPTED' },
  })

  // 5. 수업 진행 및 완료
  await prisma.instructorAssignment.update({
    where: { id: automation.assignment?.assignmentId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      actualSessions: 2,
      attendanceCount: 30,
    },
  })

  // 6. 자동 정산
  const payment = await AutomationWorkflow.processCompletedClass({
    assignmentId: automation.assignment!.assignmentId,
    approvedBy: 'admin-123',
  })

  console.log('Step 2: 정산 완료')
  console.log(payment)

  // 7. 정산 승인 및 지급
  await prisma.payment.update({
    where: { id: payment.paymentId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: 'admin-123',
    },
  })

  console.log('✅ 전체 워크플로우 완료!')
}
```

## 💡 팁

1. **예산 조정**: 항상 `adjustToBudget: true`로 설정하여 학교 예산 초과 방지
2. **강사 매칭**: 점수가 60점 이상인 강사만 배정
3. **정산 검증**: 정산 생성 후 반드시 승인 단계 거치기
4. **알림 확인**: 중요 작업 후 알림 발송 여부 확인

## 🔒 보안 주의사항

- 정산 승인은 관리자 권한 필수
- 견적 조정 시 최소 마진율 10% 유지
- 원천징수 3.3%는 자동 계산되며 수동 조작 불가
