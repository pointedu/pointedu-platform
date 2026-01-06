import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import bcrypt from 'bcryptjs'

// GET - List all instructors
export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        user: true,
        _count: {
          select: {
            assignments: true,
            payments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(instructors)
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 })
  }
}

// POST - Create new instructor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phoneNumber,
      homeBase,
      subjects,
      rangeKm,
      maxDistanceKm,
      availableDays,
      bankAccount,
      defaultSessionFee,
    } = body

    // Create user first
    const hashedPassword = await bcrypt.hash('instructor2025', 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'INSTRUCTOR',
        phoneNumber,
        active: true,
      },
    })

    // Create instructor
    const instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        name,
        email,
        phoneNumber,
        homeBase,
        subjects: subjects || [],
        rangeKm: rangeKm || '40-60',
        maxDistanceKm: maxDistanceKm || 60,
        availableDays: availableDays || [],
        bankAccount,
        defaultSessionFee: defaultSessionFee ? parseFloat(defaultSessionFee) : null,
        status: 'ACTIVE',
      },
      include: { user: true },
    })

    return NextResponse.json(instructor, { status: 201 })
  } catch (error) {
    console.error('Failed to create instructor:', error)
    return NextResponse.json({ error: 'Failed to create instructor' }, { status: 500 })
  }
}
