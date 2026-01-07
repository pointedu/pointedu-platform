export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'

// GET - 일정 조회 (인증 필요)
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const schoolId = searchParams.get('schoolId')

    const where: Record<string, unknown> = {}

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

    return successResponse(schedules)
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return errorResponse('일정을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 일정 생성 (관리자 전용)
export const POST = withAdminAuth(async (request) => {
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
        targetGrade: targetGrade || '',
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        alternateDate: alternateDate ? new Date(alternateDate) : null,
        flexibleDate: flexibleDate || false,
        schoolBudget: schoolBudget ? parseFloat(schoolBudget) : null,
        requirements: requirements || null,
        notes: notes || null,
        status: 'SUBMITTED',
        priority: 'NORMAL',
      },
      include: {
        school: true,
        program: true,
      },
    })

    return successResponse(schoolRequest, 201)
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return errorResponse('일정 생성에 실패했습니다.', 500)
  }
})
