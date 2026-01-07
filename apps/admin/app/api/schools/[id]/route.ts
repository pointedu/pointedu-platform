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

    const school = await prisma.school.update({
      where: { id },
      data: {
        name,
        type,
        address,
        addressDetail,
        region,
        phoneNumber,
        faxNumber,
        email,
        distanceKm: distanceKm ? parseInt(distanceKm) : null,
        transportFee: transportFee ? parseFloat(transportFee) : null,
        totalStudents: totalStudents ? parseInt(totalStudents) : null,
        notes,
        active,
      },
    })

    return successResponse(school)
  } catch (error) {
    console.error('Failed to update school:', error)
    return errorResponse('학교 수정에 실패했습니다.', 500)
  }
})

// DELETE - 학교 삭제 (관리자 전용)
export const DELETE = withAdminAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    await prisma.school.delete({ where: { id } })
    return successResponse({ message: '학교가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete school:', error)
    return errorResponse('학교 삭제에 실패했습니다.', 500)
  }
})
