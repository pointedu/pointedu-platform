import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { instructorIds } = body

    // Delete existing access records
    await prisma.resourceAccess.deleteMany({
      where: { resourceId: id },
    })

    // Create new access records
    if (instructorIds && instructorIds.length > 0) {
      await prisma.resourceAccess.createMany({
        data: instructorIds.map((instructorId: string) => ({
          resourceId: id,
          instructorId,
          grantedBy: session.user.id,
        })),
      })
    }

    // Fetch updated resource with access list
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        accessList: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Failed to update resource access:', error)
    return NextResponse.json(
      { error: '접근 권한 설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
