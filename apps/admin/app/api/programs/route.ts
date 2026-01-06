import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - List all programs
export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(programs)
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST - Create new program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code,
      name,
      category,
      description,
      targetGrades,
      minStudents,
      maxStudents,
      sessionCount,
      sessionMinutes,
      baseMaterialCost,
      baseSessionFee,
      difficulty,
    } = body

    const program = await prisma.program.create({
      data: {
        code,
        name,
        category: category || 'CAREER',
        description: description || '',
        targetGrades: targetGrades || [],
        minStudents: minStudents || 15,
        maxStudents: maxStudents || 30,
        sessionCount: sessionCount || 2,
        sessionMinutes: sessionMinutes || 45,
        baseMaterialCost: baseMaterialCost ? parseFloat(baseMaterialCost) : null,
        baseSessionFee: baseSessionFee ? parseFloat(baseSessionFee) : null,
        difficulty: difficulty || 3,
        active: true,
      },
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Failed to create program:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
