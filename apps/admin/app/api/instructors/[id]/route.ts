export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

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

    // bankAccount 생성: 프론트엔드에서 분리된 필드로 오면 합침
    let finalBankAccount = bankAccount
    if (!bankAccount && (bankName || accountNumber || accountHolder)) {
      const parts = [bankName, accountNumber, accountHolder].filter(Boolean)
      finalBankAccount = parts.join(' ')
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        name,
        phoneNumber,
        homeBase,
        subjects,
        rangeKm,
        maxDistanceKm,
        availableDays,
        bankAccount: finalBankAccount || null,
        defaultSessionFee: defaultSessionFee ? parseFloat(defaultSessionFee) : null,
        status,
      },
      include: { user: true },
    })

    // Update user name and phone
    if (instructor.userId) {
      await prisma.user.update({
        where: { id: instructor.userId },
        data: { name, phoneNumber },
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
    return errorResponse('강사 수정에 실패했습니다.', 500)
  }
})

// DELETE - 강사 삭제 (관리자 전용)
export const DELETE = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const instructor = await prisma.instructor.findUnique({
      where: { id },
    })

    if (!instructor) {
      return errorResponse('강사를 찾을 수 없습니다.', 404)
    }

    // Delete instructor (cascade will handle related records)
    await prisma.instructor.delete({ where: { id } })

    // Delete user
    await prisma.user.delete({ where: { id: instructor.userId } })

    return successResponse({ message: '강사가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete instructor:', error)
    return errorResponse('강사 삭제에 실패했습니다.', 500)
  }
})
