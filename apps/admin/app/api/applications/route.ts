import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const requestId = searchParams.get('requestId')

    const where: any = {}
    if (status) where.status = status
    if (requestId) where.requestId = requestId

    const applications = await prisma.classApplication.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            subjects: true,
            homeBase: true
          }
        },
        request: {
          select: {
            id: true,
            requestNumber: true,
            desiredDate: true,
            sessions: true,
            studentCount: true,
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
    console.error('Failed to fetch applications:', error)
    return NextResponse.json(
      { error: '지원 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
