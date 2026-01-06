import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'

// GET - List all requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const schoolId = searchParams.get('schoolId')

    const where: any = {}
    if (status) where.status = status
    if (schoolId) where.schoolId = schoolId

    const requests = await prisma.schoolRequest.findMany({
      where,
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: { instructor: true },
        },
      },
      orderBy: { requestDate: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

// POST - Create new request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      priority,
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
        priority: priority || 'NORMAL',
      },
      include: {
        school: true,
        program: true,
      },
    })

    return NextResponse.json(schoolRequest, { status: 201 })
  } catch (error) {
    console.error('Failed to create request:', error)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
