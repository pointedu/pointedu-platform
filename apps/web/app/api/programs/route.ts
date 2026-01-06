import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')

    const where: any = { active: true }
    if (category && category !== 'all') {
      where.category = category
    }
    if (featured === 'true') {
      where.featured = true
    }

    const programs = await prisma.program.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { popularity: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}
