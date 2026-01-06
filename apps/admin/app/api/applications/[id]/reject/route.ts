import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json().catch(() => ({}))
    const { note } = body

    // Check if application exists
    const application = await prisma.classApplication.findUnique({
      where: { id },
      include: {
        request: true,
        instructor: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: '이미 처리된 지원입니다.' },
        { status: 400 }
      )
    }

    // Reject the application
    const updated = await prisma.classApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user?.email,
        reviewedAt: new Date(),
        reviewNote: note || null
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        request: {
          select: { id: true, requestNumber: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      application: updated,
      message: `${updated.instructor.name} 강사의 지원이 거절되었습니다.`
    })
  } catch (error) {
    console.error('Failed to reject application:', error)
    return NextResponse.json(
      { error: '지원 거절 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
