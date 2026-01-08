import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'

// POST - 강사 퇴사 처리
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason, cancelPendingAssignments = true } = body

    // 강사 조회
    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        assignments: {
          where: {
            status: {
              in: ['PENDING', 'PROPOSED', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS']
            }
          }
        }
      }
    })

    if (!instructor) {
      return NextResponse.json({ error: '강사를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 진행 중인 배정이 있는 경우
    const pendingAssignments = instructor.assignments

    // 진행 중인 배정 취소 (옵션)
    let cancelledCount = 0
    if (cancelPendingAssignments && pendingAssignments.length > 0) {
      await prisma.instructorAssignment.updateMany({
        where: {
          instructorId: params.id,
          status: {
            in: ['PENDING', 'PROPOSED', 'ACCEPTED', 'CONFIRMED']
          }
        },
        data: {
          status: 'CANCELLED',
        }
      })
      cancelledCount = pendingAssignments.filter(a =>
        ['PENDING', 'PROPOSED', 'ACCEPTED', 'CONFIRMED'].includes(a.status)
      ).length

      // 취소된 배정의 요청 상태를 APPROVED로 변경하여 재배정 가능하게 함
      const requestIds = pendingAssignments
        .filter(a => ['PENDING', 'PROPOSED', 'ACCEPTED', 'CONFIRMED'].includes(a.status))
        .map(a => a.requestId)

      if (requestIds.length > 0) {
        await prisma.schoolRequest.updateMany({
          where: { id: { in: requestIds } },
          data: { status: 'APPROVED' }
        })
      }
    }

    // 강사 상태를 TERMINATED로 변경
    const updatedInstructor = await prisma.instructor.update({
      where: { id: params.id },
      data: {
        status: 'TERMINATED',
        notes: reason
          ? `[${new Date().toLocaleDateString('ko-KR')}] 퇴사 사유: ${reason}\n${instructor.notes || ''}`
          : instructor.notes,
      },
    })

    // 관련 User 계정 비활성화
    await prisma.user.update({
      where: { id: instructor.userId },
      data: { active: false },
    })

    return NextResponse.json({
      success: true,
      message: '강사 퇴사 처리가 완료되었습니다.',
      instructor: updatedInstructor,
      cancelledAssignments: cancelledCount,
      inProgressAssignments: pendingAssignments.filter(a => a.status === 'IN_PROGRESS').length,
    })
  } catch (error) {
    console.error('Failed to terminate instructor:', error)
    return NextResponse.json({ error: '퇴사 처리에 실패했습니다.' }, { status: 500 })
  }
}
