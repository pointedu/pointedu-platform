import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'

// POST - 수업 취소 (배정된 강사의 수업 취소)
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
    const { assignmentId, reason, reassign = false } = body

    if (!assignmentId) {
      return NextResponse.json({ error: '배정 ID가 필요합니다.' }, { status: 400 })
    }

    // 해당 배정 조회
    const assignment = await prisma.instructorAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        instructor: true,
        request: {
          include: { school: true, program: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: '배정 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (assignment.requestId !== params.id) {
      return NextResponse.json({ error: '요청 ID가 일치하지 않습니다.' }, { status: 400 })
    }

    // 배정 상태를 CANCELLED로 변경
    const updatedAssignment = await prisma.instructorAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `취소 사유: ${reason}\n${assignment.notes || ''}` : assignment.notes,
      },
    })

    // 요청 상태 업데이트 (재배정 여부에 따라)
    if (reassign) {
      // 재배정 필요: 요청 상태를 APPROVED로 변경
      await prisma.schoolRequest.update({
        where: { id: params.id },
        data: { status: 'APPROVED' },
      })
    }

    // TODO: 강사에게 취소 알림 발송 (선택적)

    return NextResponse.json({
      success: true,
      message: '수업이 취소되었습니다.',
      assignment: updatedAssignment,
    })
  } catch (error) {
    console.error('Failed to cancel assignment:', error)
    return NextResponse.json({ error: '수업 취소에 실패했습니다.' }, { status: 500 })
  }
}
