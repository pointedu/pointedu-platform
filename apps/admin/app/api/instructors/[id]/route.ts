export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// 안전한 실수 파싱 함수
function safeParseFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(parsed) ? null : parsed
}

// GET - 강사 상세 조회 (인증 필요)
export const GET = withAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        user: true,
        assignments: {
          include: { request: { include: { school: true } } },
          orderBy: { assignedDate: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!instructor) {
      return errorResponse('강사를 찾을 수 없습니다.', 404)
    }

    return successResponse(instructor)
  } catch (error) {
    console.error('Failed to fetch instructor:', error)
    return errorResponse('강사 정보를 불러오는데 실패했습니다.', 500)
  }
})

// PUT - 강사 수정 (관리자 전용)
export const PUT = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const body = await request.json()
    const {
      name,
      phoneNumber,
      homeBase,
      subjects,
      rangeKm,
      maxDistanceKm,
      availableDays,
      bankAccount,
      // 프론트엔드 호환 필드
      bankName,
      accountNumber,
      accountHolder,
      defaultSessionFee,
      status,
    } = body

    // 필수 필드 검증
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return errorResponse('강사명은 필수입니다.', 400)
    }

    // bankAccount 생성: 프론트엔드에서 분리된 필드로 오면 합침
    let finalBankAccount = bankAccount
    if (!bankAccount && (bankName || accountNumber || accountHolder)) {
      const parts = [bankName, accountNumber, accountHolder].filter(Boolean)
      finalBankAccount = parts.join(' ')
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        name: name?.trim(),
        phoneNumber,
        homeBase,
        subjects,
        rangeKm,
        maxDistanceKm,
        availableDays,
        bankAccount: finalBankAccount || null,
        defaultSessionFee: safeParseFloat(defaultSessionFee),
        status,
      },
      include: { user: true },
    })

    // Update user name and phone
    if (instructor.userId) {
      await prisma.user.update({
        where: { id: instructor.userId },
        data: { name: name?.trim(), phoneNumber },
      })
    }

    // 프론트엔드 호환을 위해 bankAccount를 분리해서 응답
    const bankParts = (instructor.bankAccount || '').split(' ')
    return successResponse({
      ...instructor,
      bankName: bankParts[0] || '',
      accountNumber: bankParts[1] || '',
      accountHolder: bankParts[2] || '',
    })
  } catch (error) {
    console.error('Failed to update instructor:', error)
    const message = error instanceof Error ? error.message : '강사 수정에 실패했습니다.'
    return errorResponse(message, 500)
  }
})

// DELETE - 강사 삭제 (관리자 전용)
export const DELETE = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        assignments: { select: { id: true }, take: 1 },
        payments: { select: { id: true }, take: 1 },
      },
    })

    if (!instructor) {
      return errorResponse('강사를 찾을 수 없습니다.', 404)
    }

    // 연관된 배정이나 정산이 있는 경우 삭제 불가
    if (instructor.assignments.length > 0) {
      return errorResponse('이 강사에 연결된 수업 배정이 있어 삭제할 수 없습니다. 강사를 퇴사 처리하세요.', 400)
    }

    if (instructor.payments.length > 0) {
      return errorResponse('이 강사에 연결된 정산 내역이 있어 삭제할 수 없습니다. 강사를 퇴사 처리하세요.', 400)
    }

    // 트랜잭션으로 강사와 사용자 삭제
    await prisma.$transaction(async (tx) => {
      // 강사 삭제
      await tx.instructor.delete({ where: { id } })
      // 사용자 삭제
      if (instructor.userId) {
        await tx.user.delete({ where: { id: instructor.userId } })
      }
    })

    return successResponse({ message: '강사가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete instructor:', error)
    const message = error instanceof Error ? error.message : '강사 삭제에 실패했습니다.'
    return errorResponse(message, 500)
  }
})
