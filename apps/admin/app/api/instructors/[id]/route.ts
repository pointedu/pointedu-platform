import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get single instructor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        assignments: {
          include: { request: { include: { school: true } } },
          orderBy: { assignedDate: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    return NextResponse.json(instructor)
  } catch (error) {
    console.error('Failed to fetch instructor:', error)
    return NextResponse.json({ error: 'Failed to fetch instructor' }, { status: 500 })
  }
}

// PUT - Update instructor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      phoneNumber,
      homeBase,
      subjects,
      rangeKm,
      maxDistanceKm,
      availableDays,
      bankAccount,
      defaultSessionFee,
      status,
    } = body

    const instructor = await prisma.instructor.update({
      where: { id: params.id },
      data: {
        name,
        phoneNumber,
        homeBase,
        subjects,
        rangeKm,
        maxDistanceKm,
        availableDays,
        bankAccount,
        defaultSessionFee: defaultSessionFee ? parseFloat(defaultSessionFee) : null,
        status,
      },
      include: { user: true },
    })

    // Update user name and phone
    await prisma.user.update({
      where: { id: instructor.userId },
      data: { name, phoneNumber },
    })

    return NextResponse.json(instructor)
  } catch (error) {
    console.error('Failed to update instructor:', error)
    return NextResponse.json({ error: 'Failed to update instructor' }, { status: 500 })
  }
}

// DELETE - Delete instructor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Delete instructor (cascade will handle related records)
    await prisma.instructor.delete({ where: { id: params.id } })

    // Delete user
    await prisma.user.delete({ where: { id: instructor.userId } })

    return NextResponse.json({ message: 'Instructor deleted successfully' })
  } catch (error) {
    console.error('Failed to delete instructor:', error)
    return NextResponse.json({ error: 'Failed to delete instructor' }, { status: 500 })
  }
}
