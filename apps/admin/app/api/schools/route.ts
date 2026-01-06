import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - List all schools
export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      include: {
        contacts: true,
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(schools)
  } catch (error) {
    console.error('Failed to fetch schools:', error)
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
  }
}

// POST - Create new school
export async function POST(request: NextRequest) {
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
    } = body

    const school = await prisma.school.create({
      data: {
        name,
        type: type || 'MIDDLE',
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
        active: true,
      },
    })

    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error('Failed to create school:', error)
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
  }
}
