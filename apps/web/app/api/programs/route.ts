import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import { Prisma } from '@pointedu/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')

    const where: Prisma.ProgramWhereInput = { active: true }
    if (category && category !== 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.category = { equals: category as any }
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
