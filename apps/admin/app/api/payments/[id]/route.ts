export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@pointedu/database'
import { withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// PUT - 급여 상태 수정 (관리자 전용)
export const PUT = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const body = await request.json()
    const { status, approvedBy, paidBy } = body

    const updateData: Record<string, unknown> = { status }

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
      updateData.approvedBy = approvedBy || 'admin'
    }

    if (status === 'PAID') {
      updateData.paidAt = new Date()
      updateData.paidBy = paidBy || 'admin'
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        instructor: true,
        assignment: {
          include: {
            request: { include: { school: true } },
          },
        },
      },
    })

    return successResponse(payment)
  } catch (error) {
    console.error('Failed to update payment:', error)
    return errorResponse('급여 수정에 실패했습니다.', 500)
  }
})
