export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// 기본 강사비 규정
const DEFAULT_FEE_RULES = {
  // 기본 강사비 (차시당)
  baseSessionFee: {
    elementary: 35000,  // 초등
    middle: 35000,      // 중등
    high: 40000,        // 고등
  },
  // 차시별 강사비 (총액)
  sessionFees: {
    2: 70000,   // 2차시
    3: 100000,  // 3차시
    4: 120000,  // 4차시
    5: 135000,  // 5차시
    6: 150000,  // 6차시
  },
  // 교통비 규정 (거리 기반)
  transportFees: {
    '0-20': 0,       // 20km 이내: 무료
    '21-40': 15000,  // 21-40km
    '41-60': 25000,  // 41-60km
    '61-80': 35000,  // 61-80km
    '81-100': 45000, // 81-100km
    '101+': 55000,   // 100km 초과
  },
  // 특수 수당
  specialAllowances: {
    weekend: 10000,      // 주말 수업 추가
    holiday: 20000,      // 공휴일 수업 추가
    emergency: 20000,    // 긴급 배정 (3일 이내)
    multipleClasses: 10000, // 하루 3개 이상 수업
  },
  // 원천징수율
  taxWithholdingRate: 0.033,  // 3.3%
  // 최소/최대 강사비
  minSessionFee: 30000,
  maxSessionFee: 200000,
}

// GET - 강사비 규정 조회
export const GET = withAuth(async () => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'INSTRUCTOR_FEE_RULES' },
    })

    if (setting) {
      return successResponse(JSON.parse(setting.value))
    }

    return successResponse(DEFAULT_FEE_RULES)
  } catch (error) {
    console.error('Failed to fetch fee rules:', error)
    return errorResponse('강사비 규정을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 강사비 규정 수정 (관리자 전용)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()
    const { feeRules } = body

    if (!feeRules || typeof feeRules !== 'object') {
      return errorResponse('강사비 규정 데이터가 필요합니다.', 400)
    }

    // 유효성 검사
    if (feeRules.baseSessionFee) {
      const { elementary, middle, high } = feeRules.baseSessionFee
      if (elementary < 0 || middle < 0 || high < 0) {
        return errorResponse('기본 강사비는 0 이상이어야 합니다.', 400)
      }
    }

    if (feeRules.sessionFees) {
      for (const [sessions, fee] of Object.entries(feeRules.sessionFees)) {
        if (typeof fee !== 'number' || fee < 0) {
          return errorResponse(`${sessions}차시 강사비가 올바르지 않습니다.`, 400)
        }
      }
    }

    if (feeRules.transportFees) {
      for (const [range, fee] of Object.entries(feeRules.transportFees)) {
        if (typeof fee !== 'number' || fee < 0) {
          return errorResponse(`교통비(${range}km)가 올바르지 않습니다.`, 400)
        }
      }
    }

    if (feeRules.taxWithholdingRate !== undefined) {
      if (feeRules.taxWithholdingRate < 0 || feeRules.taxWithholdingRate > 0.5) {
        return errorResponse('원천징수율은 0~50% 사이여야 합니다.', 400)
      }
    }

    // DB에 저장
    await prisma.setting.upsert({
      where: { key: 'INSTRUCTOR_FEE_RULES' },
      update: {
        value: JSON.stringify(feeRules),
        category: 'INSTRUCTOR',
      },
      create: {
        key: 'INSTRUCTOR_FEE_RULES',
        value: JSON.stringify(feeRules),
        type: 'JSON',
        category: 'INSTRUCTOR',
        description: '강사비 규정 (차시별 강사비, 교통비, 특수 수당 등)',
      },
    })

    return successResponse({
      success: true,
      message: '강사비 규정이 저장되었습니다.',
      feeRules,
    })
  } catch (error) {
    console.error('Failed to save fee rules:', error)
    return errorResponse('강사비 규정 저장에 실패했습니다.', 500)
  }
})
