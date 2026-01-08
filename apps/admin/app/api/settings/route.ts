export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'

// GET - 설정 조회 (인증 필요)
export const GET = withAuth(async () => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })
    return successResponse(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return errorResponse('설정을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 설정 수정 (관리자 전용)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return errorResponse('설정 데이터가 필요합니다.', 400)
    }

    // 트랜잭션으로 일괄 업데이트 (성능 개선)
    const updates = await prisma.$transaction(
      settings.map((setting: { key: string; value: string }) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            category: 'GENERAL',
          },
        })
      )
    )

    return successResponse({ count: updates.length, success: true })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return errorResponse('설정 수정에 실패했습니다.', 500)
  }
})
