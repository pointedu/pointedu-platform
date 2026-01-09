export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { withAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

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

// GET - 요청 상세 조회 (인증 필요)
export const GET = withAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const schoolRequest = await prisma.schoolRequest.findUnique({
      where: { id },
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: { instructor: true },
        },
        applications: {
          include: { instructor: true },
        },
      },
    })

    if (!schoolRequest) {
      return errorResponse('요청을 찾을 수 없습니다.', 404)
    }

    return successResponse(schoolRequest)
  } catch (error) {
    console.error('Failed to fetch request:', error)
    return errorResponse('요청 정보를 불러오는데 실패했습니다.', 500)
  }
})

// PATCH - 요청 수정 (관리자 전용 - 수동 인증 유지)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      sessions,
      studentCount,
      targetGrade,
      desiredDate,
      alternateDate,
      schoolBudget,
      requirements,
      notes,
      internalNotes,
      priority,
    } = body

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status

    // 안전한 정수 파싱
    const parsedSessions = safeParseInt(sessions)
    if (parsedSessions !== null) updateData.sessions = parsedSessions

    const parsedStudentCount = safeParseInt(studentCount)
    if (parsedStudentCount !== null) updateData.studentCount = parsedStudentCount

    if (targetGrade) updateData.targetGrade = targetGrade
    if (desiredDate) updateData.desiredDate = new Date(desiredDate)
    if (alternateDate !== undefined) updateData.alternateDate = alternateDate ? new Date(alternateDate) : null

    // 안전한 실수 파싱
    if (schoolBudget !== undefined) updateData.schoolBudget = safeParseFloat(schoolBudget)

    if (requirements !== undefined) updateData.requirements = requirements
    if (notes !== undefined) updateData.notes = notes
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (priority) updateData.priority = priority

    // Handle approval
    if (status === 'APPROVED') {
      updateData.approvedBy = session.user?.email
      updateData.approvedAt = new Date()
    }

    const schoolRequest = await prisma.schoolRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: { instructor: true },
        },
      },
    })

    return NextResponse.json(schoolRequest)
  } catch (error) {
    console.error('Failed to update request:', error)
    const message = error instanceof Error ? error.message : 'Failed to update request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - 요청 삭제 (관리자 전용 - 수동 인증 유지)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 존재 여부 확인
    const schoolRequest = await prisma.schoolRequest.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          include: { payment: { select: { id: true, status: true } } },
        },
      },
    })

    if (!schoolRequest) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 정산 완료된 배정이 있는 경우 삭제 불가
    const hasPaidPayment = schoolRequest.assignments.some(
      (a) => a.payment && a.payment.status === 'PAID'
    )
    if (hasPaidPayment) {
      return NextResponse.json(
        { error: '이 요청에 정산 완료된 배정이 있어 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 연관 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 정산 내역 삭제 (배정에 연결된)
      const assignmentIds = schoolRequest.assignments.map((a) => a.id)
      if (assignmentIds.length > 0) {
        await tx.payment.deleteMany({
          where: { assignmentId: { in: assignmentIds } },
        })
      }

      // 지원서 삭제
      await tx.classApplication.deleteMany({
        where: { requestId: params.id },
      })

      // 배정 삭제
      await tx.instructorAssignment.deleteMany({
        where: { requestId: params.id },
      })

      // 견적 삭제
      await tx.quote.deleteMany({
        where: { requestId: params.id },
      })

      // 요청 삭제
      await tx.schoolRequest.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete request:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
