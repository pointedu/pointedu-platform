export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@pointedu/database'
import { withAuth, successResponse, errorResponse } from '../../../lib/api-auth'

// GET - 급여 목록 조회 (인증 필요)
export const GET = withAuth(async () => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            bankAccount: true,
            residentNumber: true,
          },
        },
        assignment: {
          select: {
            scheduledDate: true,
            request: {
              include: {
                school: true,
                program: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return errorResponse('급여 목록을 불러오는데 실패했습니다.', 500)
  }
})
