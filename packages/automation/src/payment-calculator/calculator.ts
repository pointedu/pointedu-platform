/**
 * 정산 자동 계산기
 * 강사비, 교통비, 원천징수 자동 계산
 */

import { Decimal } from 'decimal.js'
import { prisma } from '@pointedu/database'
import { calculateTransportFee } from '../utils/distance'

type InstructorAssignment = any
type Instructor = any
type School = any

// 강사비 체계 (차시별)
export const SESSION_FEE_TABLE: Record<number, number> = {
  2: 70000,
  3: 90000,
  4: 110000,
  5: 130000,
  6: 150000,
}

// 원천징수율
export const TAX_WITHHOLDING_RATE = 0.033 // 3.3%

/**
 * 정산 계산 결과
 */
export interface PaymentCalculation {
  sessionFee: Decimal
  sessions: number
  transportFee: Decimal
  bonus: Decimal
  subtotal: Decimal
  taxWithholding: Decimal
  deductions: Decimal
  netAmount: Decimal
  breakdown: {
    sessionFeePerSession: number
    totalSessionFee: number
    transportFee: number
    grossAmount: number
    taxRate: number
    taxAmount: number
    netAmount: number
  }
}

/**
 * 차시별 강사비 계산
 */
export function calculateSessionFee(sessions: number, customFee?: number): number {
  if (customFee) return customFee

  // 6차시 이상은 6차시 단가 사용
  if (sessions >= 6) {
    const baseFee = SESSION_FEE_TABLE[6]
    const extraSessions = sessions - 6
    return baseFee + extraSessions * 25000 // 7차시부터는 차시당 25,000원
  }

  return SESSION_FEE_TABLE[sessions] || SESSION_FEE_TABLE[2]
}

/**
 * 배정 정보로부터 정산 계산
 */
export async function calculatePaymentForAssignment(
  assignmentId: string,
  options: {
    actualSessions?: number
    customSessionFee?: number
    bonus?: number
    deductions?: number
  } = {}
): Promise<PaymentCalculation> {
  // 배정 정보 조회
  const assignment = await prisma.instructorAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      instructor: true,
      request: {
        include: {
          school: true,
        },
      },
    },
  })

  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`)
  }

  const sessions = options.actualSessions || assignment.request.sessions
  const instructor = assignment.instructor
  const school = assignment.request.school

  // 1. 강사비 계산
  const sessionFee = new Decimal(
    options.customSessionFee ||
    Number(instructor.defaultSessionFee) ||
    calculateSessionFee(sessions)
  )

  // 2. 교통비 계산
  const transportFee = new Decimal(
    school.transportFee !== null && school.transportFee !== undefined
      ? Number(school.transportFee)
      : calculateTransportFee(school.distanceKm || 0)
  )

  // 3. 보너스 및 공제
  const bonus = new Decimal(options.bonus || 0)
  const deductions = new Decimal(options.deductions || 0)

  // 4. 소계
  const subtotal = sessionFee.plus(transportFee).plus(bonus)

  // 5. 원천징수
  const taxWithholding = subtotal.times(TAX_WITHHOLDING_RATE).toDecimalPlaces(0, Decimal.ROUND_DOWN)

  // 6. 실수령액
  const netAmount = subtotal.minus(taxWithholding).minus(deductions)

  return {
    sessionFee,
    sessions,
    transportFee,
    bonus,
    subtotal,
    taxWithholding,
    deductions,
    netAmount,
    breakdown: {
      sessionFeePerSession: Number(sessionFee.dividedBy(sessions).toDecimalPlaces(0)),
      totalSessionFee: Number(sessionFee),
      transportFee: Number(transportFee),
      grossAmount: Number(subtotal),
      taxRate: TAX_WITHHOLDING_RATE,
      taxAmount: Number(taxWithholding),
      netAmount: Number(netAmount),
    },
  }
}

/**
 * 정산 레코드 생성
 */
export async function createPayment(
  assignmentId: string,
  calculation: PaymentCalculation,
  options: {
    accountingMonth?: string
    approvedBy?: string
    notes?: string
  } = {}
): Promise<string> {
  const assignment = await prisma.instructorAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      instructor: true,
    },
  })

  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`)
  }

  // 정산 번호 생성
  const paymentNumber = await generatePaymentNumber()

  // 회계 월 결정
  const accountingMonth =
    options.accountingMonth ||
    new Date().toISOString().slice(0, 7) // YYYY-MM

  // 정산 생성
  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      assignmentId,
      instructorId: assignment.instructorId,
      sessionFee: calculation.sessionFee,
      sessions: calculation.sessions,
      transportFee: calculation.transportFee,
      bonus: calculation.bonus,
      subtotal: calculation.subtotal,
      taxWithholding: calculation.taxWithholding,
      deductions: calculation.deductions,
      netAmount: calculation.netAmount,
      status: 'CALCULATED',
      accountingMonth,
      fiscalYear: new Date().getFullYear(),
      bankAccount: assignment.instructor.bankAccount || undefined,
      notes: options.notes,
      approvedBy: options.approvedBy,
    },
  })

  return payment.id
}

/**
 * 정산 번호 생성
 */
async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  // 이번 달 정산 개수 조회
  const count = await prisma.payment.count({
    where: {
      accountingMonth: `${year}-${month}`,
    },
  })

  const sequence = String(count + 1).padStart(3, '0')
  return `PAY-${year}${month}-${sequence}`
}

/**
 * 배정 완료 후 자동 정산 생성
 */
export async function autoGeneratePayment(
  assignmentId: string,
  approvedBy?: string
): Promise<{
  success: boolean
  paymentId?: string
  message: string
}> {
  try {
    // 트랜잭션으로 배정 확인 및 정산 생성
    const result = await prisma.$transaction(async (tx) => {
      // 배정 확인
      const assignment = await tx.instructorAssignment.findUnique({
        where: { id: assignmentId },
      })

      if (!assignment) {
        throw new Error('배정을 찾을 수 없습니다.')
      }

      if (assignment.status !== 'COMPLETED') {
        throw new Error('완료된 배정만 정산할 수 있습니다.')
      }

      // 이미 정산이 생성되었는지 확인
      const existingPayment = await tx.payment.findUnique({
        where: { assignmentId },
      })

      if (existingPayment) {
        throw new Error('이미 정산이 생성되었습니다.')
      }

      // 정산 계산
      const calculation = await calculatePaymentForAssignment(assignmentId, {
        actualSessions: assignment.actualSessions || undefined,
      })

      // 정산 번호 생성
      const paymentNumber = await generatePaymentNumber()
      const accountingMonth = new Date().toISOString().slice(0, 7)

      // 정산 생성 (트랜잭션 내에서)
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          assignmentId,
          instructorId: assignment.instructorId,
          accountingMonth,
          sessions: calculation.sessions,
          sessionFee: calculation.sessionFee,
          transportFee: calculation.transportFee,
          bonus: calculation.bonus,
          subtotal: calculation.subtotal,
          taxWithholding: calculation.taxWithholding,
          deductions: calculation.deductions,
          netAmount: calculation.netAmount,
          status: 'CALCULATED',
          approvedBy,
          notes: '자동 생성된 정산',
        },
      })

      return {
        paymentId: payment.id,
        netAmount: calculation.netAmount,
      }
    })

    return {
      success: true,
      paymentId: result.paymentId,
      message: `정산이 자동 생성되었습니다. (실수령액: ${result.netAmount.toNumber().toLocaleString()}원)`,
    }
  } catch (error) {
    return {
      success: false,
      message: `정산 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}

/**
 * 월별 정산 요약
 */
export async function getMonthlyPaymentSummary(accountingMonth: string): Promise<{
  totalPayments: number
  totalGrossAmount: Decimal
  totalTaxWithholding: Decimal
  totalNetAmount: Decimal
  instructorBreakdown: Array<{
    instructorId: string
    instructorName: string
    count: number
    totalAmount: Decimal
  }>
}> {
  const payments = await prisma.payment.findMany({
    where: {
      accountingMonth,
    },
    include: {
      instructor: true,
    },
  })

  const totalGrossAmount = payments.reduce(
    (sum: Decimal, p: any) => sum.plus(new Decimal(Number(p.subtotal))),
    new Decimal(0)
  )

  const totalTaxWithholding = payments.reduce(
    (sum: Decimal, p: any) => sum.plus(new Decimal(Number(p.taxWithholding))),
    new Decimal(0)
  )

  const totalNetAmount = payments.reduce(
    (sum: Decimal, p: any) => sum.plus(new Decimal(Number(p.netAmount))),
    new Decimal(0)
  )

  // 강사별 집계
  const instructorMap = new Map<string, {
    instructorName: string
    count: number
    totalAmount: Decimal
  }>()

  for (const payment of payments) {
    const existing = instructorMap.get(payment.instructorId)
    if (existing) {
      existing.count++
      existing.totalAmount = existing.totalAmount.plus(new Decimal(Number(payment.netAmount)))
    } else {
      instructorMap.set(payment.instructorId, {
        instructorName: payment.instructor.name,
        count: 1,
        totalAmount: new Decimal(Number(payment.netAmount)),
      })
    }
  }

  const instructorBreakdown = Array.from(instructorMap.entries()).map(
    ([instructorId, data]) => ({
      instructorId,
      instructorName: data.instructorName,
      count: data.count,
      totalAmount: data.totalAmount,
    })
  )

  return {
    totalPayments: payments.length,
    totalGrossAmount,
    totalTaxWithholding,
    totalNetAmount,
    instructorBreakdown,
  }
}
