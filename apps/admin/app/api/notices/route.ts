import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return NextResponse.json(notices)
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, category, isPublished, isPinned } = body

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        isPublished: isPublished ?? true,
        isPinned: isPinned ?? false,
        authorId: session.user.id,
        authorName: session.user.name || '관리자',
      },
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Failed to create notice:', error)
    return NextResponse.json(
      { error: '공지사항 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
