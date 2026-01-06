/**
 * 견적서 자동 생성기
 * 학교 요청에 따라 견적 자동 계산 및 생성
 */

import { Decimal } from 'decimal.js'
import { prisma } from '@pointedu/database'
import { calculateSessionFee } from '../payment-calculator/calculator'
import { calculateTransportFee } from '../utils/distance'

type SchoolRequest = any
type Program = any
type School = any

/**
 * 견적 생성 옵션
 */
export interface QuoteOptions {
  customSessionFee?: number
  customTransportFee?: number
  customMaterialCost?: number
  assistantCount?: number
  overheadRate?: number
  marginRate?: number
  vatRate?: number
  discount?: number
  notes?: string
}

/**
 * 견적 계산 결과
 */
export interface QuoteCalculation {
  sessionFee: Decimal
  transportFee: Decimal
  materialCost: Decimal
  assistantFee: Decimal
  overhead: Decimal
  subtotal: Decimal
  marginRate: Decimal
  marginAmount: Decimal
  vat: Decimal
  total: Decimal
  discount: Decimal
  finalTotal: Decimal
  breakdown: {
    sessionFee: number
    transportFee: number
    materialCost: number
    totalBeforeMargin: number
    marginPercent: number
    marginAmount: number
    subtotalWithMargin: number
    vat: number
    total: number
    discount: number
    finalTotal: number
  }
}

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS = {
  assistantFeePerSession: 30000, // 진행요원 1인 1차시
  overheadRate: 0.05, // 관리비 5%
  marginRate: 0.15, // 마진율 15%
  vatRate: 0.10, // 부가세 10%
}

/**
 * 학교 요청으로부터 견적 계산
 */
export async function calculateQuoteForRequest(
  requestId: string,
  options: QuoteOptions = {}
): Promise<QuoteCalculation> {
  // 요청 정보 조회
  const request = await prisma.schoolRequest.findUnique({
    where: { id: requestId },
    include: {
      school: true,
      program: true,
    },
  })

  if (!request) {
    throw new Error(`Request ${requestId} not found`)
  }

  const program = request.program
  const school = request.school
  const sessions = request.sessions
  const studentCount = request.studentCount

  // 1. 강사비 계산
  const sessionFee = new Decimal(
    options.customSessionFee ||
    (program?.baseSessionFee ? Number(program.baseSessionFee) : null) ||
    calculateSessionFee(sessions)
  )

  // 2. 교통비 계산
  const transportFee = new Decimal(
    options.customTransportFee !== undefined
      ? options.customTransportFee
      : school.transportFee !== null && school.transportFee !== undefined
        ? Number(school.transportFee)
        : calculateTransportFee(school.distanceKm || 0)
  )

  // 3. 재료비 계산
  const materialCostPerStudent = new Decimal(
    options.customMaterialCost !== undefined
      ? options.customMaterialCost
      : program?.baseMaterialCost !== null && program?.baseMaterialCost !== undefined
        ? Number(program.baseMaterialCost)
        : 7000 // 기본 재료비
  )
  const materialCost = materialCostPerStudent.times(studentCount)

  // 4. 진행요원비
  const assistantCount = options.assistantCount || 0
  const assistantFee = new Decimal(DEFAULT_SETTINGS.assistantFeePerSession)
    .times(sessions)
    .times(assistantCount)

  // 5. 관리비
  const overheadRate = options.overheadRate !== undefined
    ? new Decimal(options.overheadRate)
    : new Decimal(DEFAULT_SETTINGS.overheadRate)

  const costSubtotal = sessionFee.plus(transportFee).plus(materialCost).plus(assistantFee)
  const overhead = costSubtotal.times(overheadRate).toDecimalPlaces(0, Decimal.ROUND_UP)

  // 6. 소계 (비용 합계)
  const subtotal = costSubtotal.plus(overhead)

  // 7. 마진
  const marginRate = options.marginRate !== undefined
    ? new Decimal(options.marginRate)
    : new Decimal(DEFAULT_SETTINGS.marginRate)

  const marginAmount = subtotal.times(marginRate).toDecimalPlaces(0, Decimal.ROUND_UP)

  // 8. 부가세
  const vatRate = options.vatRate !== undefined
    ? new Decimal(options.vatRate)
    : new Decimal(DEFAULT_SETTINGS.vatRate)

  const beforeVat = subtotal.plus(marginAmount)
  const vat = beforeVat.times(vatRate).toDecimalPlaces(0, Decimal.ROUND_UP)

  // 9. 총액
  const total = beforeVat.plus(vat)

  // 10. 할인
  const discount = new Decimal(options.discount || 0)

  // 11. 최종 금액
  const finalTotal = total.minus(discount)

  return {
    sessionFee,
    transportFee,
    materialCost,
    assistantFee,
    overhead,
    subtotal,
    marginRate,
    marginAmount,
    vat,
    total,
    discount,
    finalTotal,
    breakdown: {
      sessionFee: Number(sessionFee),
      transportFee: Number(transportFee),
      materialCost: Number(materialCost),
      totalBeforeMargin: Number(subtotal),
      marginPercent: Number(marginRate.times(100)),
      marginAmount: Number(marginAmount),
      subtotalWithMargin: Number(beforeVat),
      vat: Number(vat),
      total: Number(total),
      discount: Number(discount),
      finalTotal: Number(finalTotal),
    },
  }
}

/**
 * 예산에 맞춘 견적 조정
 */
export async function adjustQuoteToBudget(
  requestId: string,
  targetBudget: number
): Promise<{
  success: boolean
  quote?: QuoteCalculation
  adjustments?: string[]
  message: string
}> {
  // 기본 견적 계산
  const baseQuote = await calculateQuoteForRequest(requestId)

  const currentTotal = Number(baseQuote.finalTotal)

  if (currentTotal <= targetBudget) {
    return {
      success: true,
      quote: baseQuote,
      message: '기본 견적이 예산 내에 있습니다.',
    }
  }

  // 초과 금액
  const excess = currentTotal - targetBudget
  const adjustments: string[] = []

  // 조정 전략 1: 마진율 감소
  let adjustedMarginRate = Number(baseQuote.marginRate)
  const minMarginRate = 0.10 // 최소 10%

  if (adjustedMarginRate > minMarginRate) {
    const marginReduction = Math.min(
      adjustedMarginRate - minMarginRate,
      excess / Number(baseQuote.subtotal)
    )
    adjustedMarginRate = adjustedMarginRate - marginReduction
    adjustments.push(`마진율 ${(Number(baseQuote.marginRate) * 100).toFixed(1)}% → ${(adjustedMarginRate * 100).toFixed(1)}%`)
  }

  // 재계산
  let adjustedQuote = await calculateQuoteForRequest(requestId, {
    marginRate: adjustedMarginRate,
  })

  if (Number(adjustedQuote.finalTotal) <= targetBudget) {
    return {
      success: true,
      quote: adjustedQuote,
      adjustments,
      message: `예산에 맞게 조정되었습니다. (${adjustments.join(', ')})`,
    }
  }

  // 조정 전략 2: 할인 적용
  const remainingExcess = Number(adjustedQuote.finalTotal) - targetBudget
  adjustments.push(`할인 ${remainingExcess.toLocaleString()}원 적용`)

  adjustedQuote = await calculateQuoteForRequest(requestId, {
    marginRate: adjustedMarginRate,
    discount: remainingExcess,
  })

  return {
    success: true,
    quote: adjustedQuote,
    adjustments,
    message: `예산에 맞게 조정되었습니다. (${adjustments.join(', ')})`,
  }
}

/**
 * 견적서 생성 및 저장
 */
export async function createQuote(
  requestId: string,
  calculation: QuoteCalculation,
  options: {
    validDays?: number
    createdBy: string
    notes?: string
  }
): Promise<string> {
  // 견적 번호 생성
  const quoteNumber = await generateQuoteNumber()

  // 유효 기간 (기본 30일)
  const validDays = options.validDays || 30
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + validDays)

  // 트랜잭션으로 견적 생성 및 요청 상태 업데이트
  const quote = await prisma.$transaction(async (tx) => {
    // 견적 생성
    const createdQuote = await tx.quote.create({
      data: {
        quoteNumber,
        requestId,
        sessionFee: calculation.sessionFee,
        transportFee: calculation.transportFee,
        materialCost: calculation.materialCost,
        assistantFee: calculation.assistantFee,
        overhead: calculation.overhead,
        subtotal: calculation.subtotal,
        marginRate: calculation.marginRate,
        marginAmount: calculation.marginAmount,
        vat: calculation.vat,
        total: calculation.total,
        discount: calculation.discount,
        finalTotal: calculation.finalTotal,
        validUntil,
        createdBy: options.createdBy,
        notes: options.notes,
      },
    })

    // 요청 상태 업데이트
    await tx.schoolRequest.update({
      where: { id: requestId },
      data: { status: 'QUOTED' },
    })

    return createdQuote
  })

  return quote.id
}

/**
 * 견적 번호 생성
 */
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  // 이번 달 견적 개수 조회
  const count = await prisma.quote.count({
    where: {
      quoteNumber: {
        startsWith: `QT-${year}${month}`,
      },
    },
  })

  const sequence = String(count + 1).padStart(3, '0')
  return `QT-${year}${month}-${sequence}`
}

/**
 * 자동 견적 생성
 */
export async function autoGenerateQuote(
  requestId: string,
  createdBy: string,
  adjustToBudget: boolean = true
): Promise<{
  success: boolean
  quoteId?: string
  message: string
}> {
  try {
    const request = await prisma.schoolRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return { success: false, message: '요청을 찾을 수 없습니다.' }
    }

    // 이미 견적이 있는지 확인
    const existingQuote = await prisma.quote.findUnique({
      where: { requestId },
    })

    if (existingQuote) {
      return { success: false, message: '이미 견적이 생성되었습니다.' }
    }

    let calculation: QuoteCalculation
    let notes = '자동 생성된 견적'

    // 예산에 맞춰 조정
    if (adjustToBudget && request.schoolBudget) {
      const result = await adjustQuoteToBudget(requestId, Number(request.schoolBudget))
      if (!result.quote) {
        return { success: false, message: result.message }
      }
      calculation = result.quote
      if (result.adjustments && result.adjustments.length > 0) {
        notes += `\n조정: ${result.adjustments.join(', ')}`
      }
    } else {
      calculation = await calculateQuoteForRequest(requestId)
    }

    // 견적 생성
    const quoteId = await createQuote(requestId, calculation, {
      createdBy,
      notes,
    })

    return {
      success: true,
      quoteId,
      message: `견적이 자동 생성되었습니다. (총액: ${calculation.finalTotal.toNumber().toLocaleString()}원)`,
    }
  } catch (error) {
    return {
      success: false,
      message: `견적 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}
