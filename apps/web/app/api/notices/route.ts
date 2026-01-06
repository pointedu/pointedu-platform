import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')

    const where: any = { isPublished: true }
    if (category && category !== 'all') {
      where.category = category
    }

    const notices = await prisma.notice.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    )
  }
}
