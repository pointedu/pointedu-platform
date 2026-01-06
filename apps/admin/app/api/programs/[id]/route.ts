import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get single program
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        requests: {
          include: { school: true },
          orderBy: { requestDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Failed to fetch program:', error)
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 })
  }
}

// PUT - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // 프론트엔드 호환: duration → sessionMinutes, basePrice → baseSessionFee
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.targetGrades !== undefined) updateData.targetGrades = body.targetGrades
    if (body.minStudents !== undefined) updateData.minStudents = parseInt(body.minStudents)
    if (body.maxStudents !== undefined) updateData.maxStudents = parseInt(body.maxStudents)
    if (body.sessionCount !== undefined) updateData.sessionCount = parseInt(body.sessionCount)
    if (body.difficulty !== undefined) updateData.difficulty = parseInt(body.difficulty)
    if (body.active !== undefined) updateData.active = body.active

    // sessionMinutes 또는 duration
    if (body.sessionMinutes !== undefined) {
      updateData.sessionMinutes = parseInt(body.sessionMinutes)
    } else if (body.duration !== undefined) {
      updateData.sessionMinutes = parseInt(body.duration)
    }

    // baseSessionFee 또는 basePrice
    if (body.baseSessionFee !== undefined) {
      updateData.baseSessionFee = body.baseSessionFee ? parseFloat(body.baseSessionFee) : null
    } else if (body.basePrice !== undefined) {
      updateData.baseSessionFee = body.basePrice ? parseFloat(body.basePrice) : null
    }

    if (body.baseMaterialCost !== undefined) {
      updateData.baseMaterialCost = body.baseMaterialCost ? parseFloat(body.baseMaterialCost) : null
    }

    const program = await prisma.program.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      ...program,
      duration: program.sessionMinutes,
      basePrice: program.baseSessionFee,
    })
  } catch (error) {
    console.error('Failed to update program:', error)
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
  }
}

// DELETE - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.program.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Failed to delete program:', error)
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
  }
}
