import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get single school
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const school = await prisma.school.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        requests: {
          include: { program: true },
          orderBy: { requestDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Failed to fetch school:', error)
    return NextResponse.json({ error: 'Failed to fetch school' }, { status: 500 })
  }
}

// PUT - Update school
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      address,
      addressDetail,
      region,
      phoneNumber,
      faxNumber,
      email,
      distanceKm,
      transportFee,
      totalStudents,
      notes,
      active,
    } = body

    const school = await prisma.school.update({
      where: { id: params.id },
      data: {
        name,
        type,
        address,
        addressDetail,
        region,
        phoneNumber,
        faxNumber,
        email,
        distanceKm: distanceKm ? parseInt(distanceKm) : null,
        transportFee: transportFee ? parseFloat(transportFee) : null,
        totalStudents: totalStudents ? parseInt(totalStudents) : null,
        notes,
        active,
      },
    })

    return NextResponse.json(school)
  } catch (error) {
    console.error('Failed to update school:', error)
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 })
  }
}

// DELETE - Delete school
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.school.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'School deleted successfully' })
  } catch (error) {
    console.error('Failed to delete school:', error)
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 })
  }
}
