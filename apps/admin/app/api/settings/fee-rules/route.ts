export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// 기본 강사비 규정
const DEFAULT_FEE_RULES = {
  // 차시별 강사비 (총액) - 내부 강사 기준
  sessionFees: {
    2: 70000,    // 2차시
    3: 90000,    // 3차시
    4: 110000,   // 4차시
    5: 130000,   // 5차시
    6: 150000,   // 6차시
  },
  // 교통비 규정 (거리 기반)
  transportFees: {
    '0-40': 0,        // 40km 이내: 무료
    '41-69': 15000,   // 41-69km
    '70-99': 30000,   // 70-99km
    '100+': 40000,    // 100km 이상
  },
  // 특수 수당
  specialAllowances: {
    weekend: 10000,      // 주말 수업 추가
    holiday: 20000,      // 공휴일 수업 추가
    emergency: 20000,    // 긴급 배정 (3일 이내)
  },
  // 외부강사/긴급구인 설정
  externalInstructor: {
    allowCustomFee: true,  // 별도 강사비 지정 가능
    description: '외부강사, 긴급구인 강사는 관리자가 별도로 강사비 지정',
  },
  // 원천징수율
  taxWithholdingRate: 0.033,  // 3.3%
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
