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

    const program = await prisma.program.update({
      where: { id: params.id },
      data: {
        name: body.name,
        category: body.category,
        description: body.description,
        targetGrades: body.targetGrades,
        minStudents: body.minStudents,
        maxStudents: body.maxStudents,
        sessionCount: body.sessionCount,
        sessionMinutes: body.sessionMinutes,
        baseMaterialCost: body.baseMaterialCost ? parseFloat(body.baseMaterialCost) : null,
        baseSessionFee: body.baseSessionFee ? parseFloat(body.baseSessionFee) : null,
        difficulty: body.difficulty,
        active: body.active,
      },
    })

    return NextResponse.json(program)
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
