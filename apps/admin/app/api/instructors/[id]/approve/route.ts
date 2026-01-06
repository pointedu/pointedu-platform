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

    // Update instructor status to ACTIVE
    const instructor = await prisma.instructor.update({
      where: { id },
      data: { status: 'ACTIVE' },
    })

    // Activate the user account
    if (instructor.userId) {
      await prisma.user.update({
        where: { id: instructor.userId },
        data: { active: true },
      })
    }

    return NextResponse.json({ success: true, instructor })
  } catch (error) {
    console.error('Failed to approve instructor:', error)
    return NextResponse.json(
      { error: '승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
