import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get schedules (school requests with dates)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const schoolId = searchParams.get('schoolId')

    const where: any = {}

    if (startDate && endDate) {
      where.desiredDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (schoolId) {
      where.schoolId = schoolId
    }

    const schedules = await prisma.schoolRequest.findMany({
      where,
      include: {
        school: true,
        program: true,
        assignments: {
          include: { instructor: true },
        },
      },
      orderBy: { desiredDate: 'asc' },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

// POST - Create new school request (schedule)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      schoolId,
      programId,
      customProgram,
      sessions,
      studentCount,
      targetGrade,
      desiredDate,
      alternateDate,
      flexibleDate,
      schoolBudget,
      requirements,
      notes,
    } = body

    // Generate request number
    const year = new Date().getFullYear()
    const count = await prisma.schoolRequest.count({
      where: {
        requestNumber: { startsWith: `REQ-${year}` },
      },
    })
    const requestNumber = `REQ-${year}-${String(count + 1).padStart(3, '0')}`

    const schoolRequest = await prisma.schoolRequest.create({
      data: {
        requestNumber,
        schoolId,
        programId: programId || null,
        customProgram: customProgram || null,
        sessions: parseInt(sessions),
        studentCount: parseInt(studentCount),
        targetGrade,
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        alternateDate: alternateDate ? new Date(alternateDate) : null,
        flexibleDate: flexibleDate || false,
        schoolBudget: schoolBudget ? parseFloat(schoolBudget) : null,
        requirements,
        notes,
        status: 'SUBMITTED',
        priority: 'NORMAL',
      },
      include: {
        school: true,
        program: true,
      },
    })

    return NextResponse.json(schoolRequest, { status: 201 })
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
