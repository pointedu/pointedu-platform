export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { withAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

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
    if (sessions) updateData.sessions = parseInt(sessions)
    if (studentCount) updateData.studentCount = parseInt(studentCount)
    if (targetGrade) updateData.targetGrade = targetGrade
    if (desiredDate) updateData.desiredDate = new Date(desiredDate)
    if (alternateDate !== undefined) updateData.alternateDate = alternateDate ? new Date(alternateDate) : null
    if (schoolBudget !== undefined) updateData.schoolBudget = schoolBudget ? parseFloat(schoolBudget) : null
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
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
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

    // Delete related records first
    await prisma.classApplication.deleteMany({
      where: { requestId: params.id },
    })
    await prisma.instructorAssignment.deleteMany({
      where: { requestId: params.id },
    })
    await prisma.quote.deleteMany({
      where: { requestId: params.id },
    })

    await prisma.schoolRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete request:', error)
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
  }
}
