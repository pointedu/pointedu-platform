export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// 기본 등급 규정
const DEFAULT_GRADE_RULES = {
  // 내부 강사 등급
  LEVEL1: {
    name: '신입강사',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.00,
    priority: 1,
    benefits: ['기본 강사비'],
  },
  LEVEL2: {
    name: '일반강사',
    minClasses: 10,
    minRating: 4.0,
    feeMultiplier: 1.05,
    priority: 2,
    benefits: ['강사비 +5%'],
  },
  LEVEL3: {
    name: '우수강사',
    minClasses: 50,
    minRating: 4.5,
    feeMultiplier: 1.10,
    priority: 3,
    benefits: ['강사비 +10%', '우선 배정'],
  },
  LEVEL4: {
    name: '수석강사',
    minClasses: 100,
    minRating: 4.8,
    feeMultiplier: 1.15,
    priority: 4,
    benefits: ['강사비 +15%', '최우선 배정', '멘토링'],
  },
  // 외부 강사 등급
  EXTERNAL_BASIC: {
    name: '외부 기본',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.00,
    priority: 1,
    benefits: ['기본 외부 강사비'],
  },
  EXTERNAL_PREMIUM: {
    name: '외부 프리미엄',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.20,
    priority: 2,
    benefits: ['강사비 +20%', '전문가 대우'],
  },
  EXTERNAL_VIP: {
    name: '외부 VIP',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.50,
    priority: 3,
    benefits: ['강사비 +50%', 'VIP 대우'],
  },
}

// GET - 등급 규정 조회
export const GET = withAuth(async () => {
  try {
    // DB에서 설정 조회
    const setting = await prisma.setting.findUnique({
      where: { key: 'INSTRUCTOR_GRADE_RULES' },
    })

    if (setting) {
      return successResponse(JSON.parse(setting.value))
    }

    // 기본값 반환
    return successResponse(DEFAULT_GRADE_RULES)
  } catch (error) {
    console.error('Failed to fetch grade rules:', error)
    return errorResponse('등급 규정을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 등급 규정 수정 (관리자 전용)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()
    const { gradeRules } = body

    if (!gradeRules || typeof gradeRules !== 'object') {
      return errorResponse('등급 규정 데이터가 필요합니다.', 400)
    }

    // 유효성 검사
    const internalGrades = ['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4']
    const externalGrades = ['EXTERNAL_BASIC', 'EXTERNAL_PREMIUM', 'EXTERNAL_VIP']
    const allGrades = [...internalGrades, ...externalGrades]

    for (const grade of allGrades) {
      if (!gradeRules[grade]) {
        return errorResponse(`${grade} 등급 정보가 누락되었습니다.`, 400)
      }

      const rule = gradeRules[grade]
      if (typeof rule.feeMultiplier !== 'number' || rule.feeMultiplier < 0.5 || rule.feeMultiplier > 3.0) {
        return errorResponse(`${grade} 등급의 강사비 배수는 0.5~3.0 사이여야 합니다.`, 400)
      }
    }

    // 내부 등급 승급 조건 검증 (상위 등급일수록 조건이 높아야 함)
    for (let i = 1; i < internalGrades.length; i++) {
      const current = gradeRules[internalGrades[i]]
      const previous = gradeRules[internalGrades[i - 1]]

      if (current.minClasses < previous.minClasses) {
        return errorResponse(`${internalGrades[i]} 등급의 최소 수업 수는 ${internalGrades[i - 1]} 등급보다 높아야 합니다.`, 400)
      }
    }

    // DB에 저장
    await prisma.setting.upsert({
      where: { key: 'INSTRUCTOR_GRADE_RULES' },
      update: {
        value: JSON.stringify(gradeRules),
        category: 'INSTRUCTOR',
      },
      create: {
        key: 'INSTRUCTOR_GRADE_RULES',
        value: JSON.stringify(gradeRules),
        type: 'JSON',
        category: 'INSTRUCTOR',
        description: '강사 등급별 규정 (승급 조건, 강사비 배수 등)',
      },
    })

    return successResponse({
      success: true,
      message: '등급 규정이 저장되었습니다.',
      gradeRules,
    })
  } catch (error) {
    console.error('Failed to save grade rules:', error)
    return errorResponse('등급 규정 저장에 실패했습니다.', 500)
  }
})
