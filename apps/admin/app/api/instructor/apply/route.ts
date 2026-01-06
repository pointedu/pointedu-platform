import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get instructor ID from session (via User relation)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { instructor: true }
    })

    if (!user?.instructor) {
      return NextResponse.json({ error: '강사 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const instructorId = user.instructor.id
    const body = await request.json()
    const { requestId, message } = body

    // Check if already applied
    const existingApplication = await prisma.classApplication.findUnique({
      where: {
        requestId_instructorId: {
          requestId,
          instructorId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: '이미 지원한 수업입니다.' },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.classApplication.create({
      data: {
        requestId,
        instructorId,
        message: message || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error('Failed to apply:', error)
    return NextResponse.json(
      { error: '지원 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
