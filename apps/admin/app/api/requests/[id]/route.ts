import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'

// GET - Get single request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolRequest = await prisma.schoolRequest.findUnique({
      where: { id: params.id },
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: { instructor: true },
        },
        applications: {
          include: { instructor: true },
        },
      },
    })

    if (!schoolRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(schoolRequest)
  } catch (error) {
    console.error('Failed to fetch request:', error)
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
  }
}

// PATCH - Update request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      sessions,
      studentCount,
      targetGrade,
      desiredDate,
      alternateDate,
      schoolBudget,
      requirements,
      notes,
      internalNotes,
      priority,
    } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (sessions) updateData.sessions = parseInt(sessions)
    if (studentCount) updateData.studentCount = parseInt(studentCount)
    if (targetGrade) updateData.targetGrade = targetGrade
    if (desiredDate) updateData.desiredDate = new Date(desiredDate)
    if (alternateDate !== undefined) updateData.alternateDate = alternateDate ? new Date(alternateDate) : null
    if (schoolBudget !== undefined) updateData.schoolBudget = schoolBudget ? parseFloat(schoolBudget) : null
    if (requirements !== undefined) updateData.requirements = requirements
    if (notes !== undefined) updateData.notes = notes
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (priority) updateData.priority = priority

    // Handle approval
    if (status === 'APPROVED') {
      updateData.approvedBy = session.user?.email
      updateData.approvedAt = new Date()
    }

    const schoolRequest = await prisma.schoolRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: { instructor: true },
        },
      },
    })

    return NextResponse.json(schoolRequest)
  } catch (error) {
    console.error('Failed to update request:', error)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}

// DELETE - Delete request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete related records first
    await prisma.classApplication.deleteMany({
      where: { requestId: params.id },
    })
    await prisma.instructorAssignment.deleteMany({
      where: { requestId: params.id },
    })
    await prisma.quote.deleteMany({
      where: { requestId: params.id },
    })

    await prisma.schoolRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete request:', error)
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
  }
}
