export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// 안전한 정수 파싱 함수
function safeParseInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10)
  return isNaN(parsed) ? null : parsed
}

// 안전한 실수 파싱 함수
function safeParseFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(parsed) ? null : parsed
}

// GET - 프로그램 상세 조회 (인증 필요)
export const GET = withAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        requests: {
          include: { school: true },
          orderBy: { requestDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!program) {
      return errorResponse('프로그램을 찾을 수 없습니다.', 404)
    }

    return successResponse(program)
  } catch (error) {
    console.error('Failed to fetch program:', error)
    return errorResponse('프로그램 정보를 불러오는데 실패했습니다.', 500)
  }
})

// PUT - 프로그램 수정 (관리자 전용)
export const PUT = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const body = await request.json()

    // 필수 필드 검증
    if (body.name !== undefined && (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0)) {
      return errorResponse('프로그램명은 필수입니다.', 400)
    }

    // 프론트엔드 호환: duration → sessionMinutes, basePrice → baseSessionFee
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.targetGrades !== undefined) updateData.targetGrades = body.targetGrades
    if (body.minStudents !== undefined) {
      const minStudents = safeParseInt(body.minStudents)
      if (minStudents !== null) updateData.minStudents = minStudents
    }
    if (body.maxStudents !== undefined) {
      const maxStudents = safeParseInt(body.maxStudents)
      if (maxStudents !== null) updateData.maxStudents = maxStudents
    }
    if (body.sessionCount !== undefined) {
      const sessionCount = safeParseInt(body.sessionCount)
      if (sessionCount !== null) updateData.sessionCount = sessionCount
    }
    if (body.difficulty !== undefined) {
      const difficulty = safeParseInt(body.difficulty)
      if (difficulty !== null) updateData.difficulty = difficulty
    }
    if (body.active !== undefined) updateData.active = body.active

    // sessionMinutes 또는 duration
    if (body.sessionMinutes !== undefined) {
      const sessionMinutes = safeParseInt(body.sessionMinutes)
      if (sessionMinutes !== null) updateData.sessionMinutes = sessionMinutes
    } else if (body.duration !== undefined) {
      const duration = safeParseInt(body.duration)
      if (duration !== null) updateData.sessionMinutes = duration
    }

    // baseSessionFee 또는 basePrice
    if (body.baseSessionFee !== undefined) {
      updateData.baseSessionFee = safeParseFloat(body.baseSessionFee)
    } else if (body.basePrice !== undefined) {
      updateData.baseSessionFee = safeParseFloat(body.basePrice)
    }

    if (body.baseMaterialCost !== undefined) {
      updateData.baseMaterialCost = safeParseFloat(body.baseMaterialCost)
    }

    const program = await prisma.program.update({
      where: { id },
      data: updateData,
    })

    return successResponse({
      ...program,
      duration: program.sessionMinutes,
      basePrice: program.baseSessionFee,
    })
  } catch (error) {
    console.error('Failed to update program:', error)
    const message = error instanceof Error ? error.message : '프로그램 수정에 실패했습니다.'
    return errorResponse(message, 500)
  }
})

// DELETE - 프로그램 삭제 (관리자 전용)
export const DELETE = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    // 연관된 데이터 확인
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        requests: { select: { id: true }, take: 1 },
      },
    })

    if (!program) {
      return errorResponse('프로그램을 찾을 수 없습니다.', 404)
    }

    // 연관된 요청이 있는 경우 삭제 불가
    if (program.requests.length > 0) {
      return errorResponse('이 프로그램에 연결된 수업 요청이 있어 삭제할 수 없습니다. 먼저 해당 요청을 삭제해주세요.', 400)
    }

    await prisma.program.delete({ where: { id } })
    return successResponse({ message: '프로그램이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete program:', error)
    const message = error instanceof Error ? error.message : '프로그램 삭제에 실패했습니다.'
    return errorResponse(message, 500)
  }
})
