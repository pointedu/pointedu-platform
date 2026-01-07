export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma, ApplicationStatus } from '@pointedu/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get instructor from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { instructor: true }
    })

    if (!user?.instructor) {
      return NextResponse.json({ error: '강사 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ApplicationStatus | null

    const where: { instructorId: string; status?: ApplicationStatus } = { instructorId: user.instructor.id }
    if (status) where.status = status

    const applications = await prisma.classApplication.findMany({
      where,
      include: {
        request: {
          include: {
            school: {
              select: { name: true, address: true }
            },
            program: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Failed to fetch instructor applications:', error)
    return NextResponse.json(
      { error: '지원 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
