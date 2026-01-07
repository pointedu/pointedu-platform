export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

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

    // 프론트엔드 호환: duration → sessionMinutes, basePrice → baseSessionFee
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.targetGrades !== undefined) updateData.targetGrades = body.targetGrades
    if (body.minStudents !== undefined) updateData.minStudents = parseInt(body.minStudents)
    if (body.maxStudents !== undefined) updateData.maxStudents = parseInt(body.maxStudents)
    if (body.sessionCount !== undefined) updateData.sessionCount = parseInt(body.sessionCount)
    if (body.difficulty !== undefined) updateData.difficulty = parseInt(body.difficulty)
    if (body.active !== undefined) updateData.active = body.active

    // sessionMinutes 또는 duration
    if (body.sessionMinutes !== undefined) {
      updateData.sessionMinutes = parseInt(body.sessionMinutes)
    } else if (body.duration !== undefined) {
      updateData.sessionMinutes = parseInt(body.duration)
    }

    // baseSessionFee 또는 basePrice
    if (body.baseSessionFee !== undefined) {
      updateData.baseSessionFee = body.baseSessionFee ? parseFloat(body.baseSessionFee) : null
    } else if (body.basePrice !== undefined) {
      updateData.baseSessionFee = body.basePrice ? parseFloat(body.basePrice) : null
    }

    if (body.baseMaterialCost !== undefined) {
      updateData.baseMaterialCost = body.baseMaterialCost ? parseFloat(body.baseMaterialCost) : null
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
    return errorResponse('프로그램 수정에 실패했습니다.', 500)
  }
})

// DELETE - 프로그램 삭제 (관리자 전용)
export const DELETE = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    await prisma.program.delete({ where: { id } })
    return successResponse({ message: '프로그램이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete program:', error)
    return errorResponse('프로그램 삭제에 실패했습니다.', 500)
  }
})
