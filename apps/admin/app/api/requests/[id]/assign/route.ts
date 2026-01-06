import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// POST - Assign instructor to request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { instructorId, scheduledDate, scheduledTime } = body

    // Create assignment
    const assignment = await prisma.instructorAssignment.create({
      data: {
        requestId: params.id,
        instructorId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTime,
        status: 'PROPOSED',
      },
      include: {
        instructor: true,
        request: { include: { school: true } },
      },
    })

    // Update request status
    await prisma.schoolRequest.update({
      where: { id: params.id },
      data: { status: 'ASSIGNED' },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Failed to assign instructor:', error)
    return NextResponse.json({ error: 'Failed to assign instructor' }, { status: 500 })
  }
}
