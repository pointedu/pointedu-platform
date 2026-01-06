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

    // 프론트엔드 호환을 위해 필드명 변환
    const formattedPrograms = programs.map((program) => ({
      ...program,
      duration: program.sessionMinutes,  // sessionMinutes → duration
      basePrice: program.baseSessionFee,  // baseSessionFee → basePrice
    }))

    return NextResponse.json(formattedPrograms)
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
      duration,  // 프론트엔드 호환
      baseMaterialCost,
      baseSessionFee,
      basePrice,  // 프론트엔드 호환
      difficulty,
    } = body

    // code가 없으면 자동 생성 (PRG + timestamp)
    const programCode = code || `PRG${Date.now()}`

    const program = await prisma.program.create({
      data: {
        code: programCode,
        name,
        category: category || 'CAREER',
        description: description || '',
        targetGrades: targetGrades || [],
        minStudents: minStudents || 15,
        maxStudents: maxStudents ? parseInt(maxStudents) : 30,
        sessionCount: sessionCount || 2,
        sessionMinutes: sessionMinutes || (duration ? parseInt(duration) : 45),
        baseMaterialCost: baseMaterialCost ? parseFloat(baseMaterialCost) : null,
        baseSessionFee: baseSessionFee ? parseFloat(baseSessionFee) : (basePrice ? parseFloat(basePrice) : null),
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
