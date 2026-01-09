export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// GET - 학교 상세 조회 (인증 필요)
export const GET = withAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        contacts: true,
        requests: {
          include: { program: true },
          orderBy: { requestDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!school) {
      return errorResponse('학교를 찾을 수 없습니다.', 404)
    }

    return successResponse(school)
  } catch (error) {
    console.error('Failed to fetch school:', error)
    return errorResponse('학교 정보를 불러오는데 실패했습니다.', 500)
  }
})

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

// PUT - 학교 수정 (관리자 전용)
export const PUT = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const body = await request.json()
    const {
      name,
      type,
      address,
      addressDetail,
      region,
      phoneNumber,
      faxNumber,
      email,
      distanceKm,
      transportFee,
      totalStudents,
      notes,
      active,
    } = body

    // 필수 필드 검증
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('학교명은 필수입니다.', 400)
    }

    // 이메일 형식 검증 (입력된 경우)
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return errorResponse('올바른 이메일 형식이 아닙니다.', 400)
      }
    }

    const school = await prisma.school.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        address,
        addressDetail,
        region,
        phoneNumber,
        faxNumber,
        email: email?.trim() || null,
        distanceKm: safeParseInt(distanceKm),
        transportFee: safeParseFloat(transportFee),
        totalStudents: safeParseInt(totalStudents),
        notes,
        active,
      },
    })

    return successResponse(school)
  } catch (error) {
    console.error('Failed to update school:', error)
    const message = error instanceof Error ? error.message : '학교 수정에 실패했습니다.'
    return errorResponse(message, 500)
  }
})

// DELETE - 학교 삭제 (관리자 전용)
export const DELETE = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    // 연관된 데이터 확인
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        requests: { select: { id: true }, take: 1 },
        contacts: { select: { id: true }, take: 1 },
      },
    })

    if (!school) {
      return errorResponse('학교를 찾을 수 없습니다.', 404)
    }

    // 연관된 요청이 있는 경우 삭제 불가
    if (school.requests.length > 0) {
      return errorResponse('이 학교에 연결된 수업 요청이 있어 삭제할 수 없습니다. 먼저 해당 요청을 삭제해주세요.', 400)
    }

    // 트랜잭션으로 연관 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 연락처 삭제
      await tx.schoolContact.deleteMany({ where: { schoolId: id } })
      // 학교 삭제
      await tx.school.delete({ where: { id } })
    })

    return successResponse({ message: '학교가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete school:', error)
    const message = error instanceof Error ? error.message : '학교 삭제에 실패했습니다.'
    return errorResponse(message, 500)
  }
})
