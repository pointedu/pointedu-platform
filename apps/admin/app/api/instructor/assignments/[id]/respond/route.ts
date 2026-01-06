import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '@pointedu/database'

// POST - Accept or Decline an assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify this is an instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    })

    if (!instructor) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Find the assignment
    const assignment = await prisma.instructorAssignment.findUnique({
      where: { id: params.id },
      include: {
        request: {
          include: { school: true },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: '배정 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Verify this assignment belongs to this instructor
    if (assignment.instructorId !== instructor.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // Only allow response for PROPOSED or PENDING assignments
    if (!['PROPOSED', 'PENDING'].includes(assignment.status)) {
      return NextResponse.json(
        { error: '이미 응답한 배정입니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, reason } = body

    if (action === 'accept') {
      // Accept the assignment
      await prisma.instructorAssignment.update({
        where: { id: params.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
          response: '수락',
        },
      })

      return NextResponse.json({
        success: true,
        message: '수업을 수락했습니다.',
      })
    } else if (action === 'decline') {
      // Decline the assignment
      await prisma.instructorAssignment.update({
        where: { id: params.id },
        data: {
          status: 'DECLINED',
          respondedAt: new Date(),
          response: reason || '거절',
        },
      })

      return NextResponse.json({
        success: true,
        message: '수업을 거절했습니다.',
      })
    } else {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to respond to assignment:', error)
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
