export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest } from 'next/server'
import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'
import { validateBody } from '../../../lib/validations'
import { z } from 'zod'

// 요청 생성 스키마
const requestSchema = z.object({
  schoolId: z.string().min(1, '학교 ID는 필수입니다.'),
  programId: z.string().optional().nullable(),
  customProgram: z.string().optional().nullable(),
  sessions: z.union([z.string(), z.number()]),
  studentCount: z.union([z.string(), z.number()]),
  targetGrade: z.string().optional().nullable(),
  desiredDate: z.string().optional().nullable(),
  alternateDate: z.string().optional().nullable(),
  flexibleDate: z.boolean().optional(),
  schoolBudget: z.union([z.string(), z.number()]).optional().nullable(),
  requirements: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
})

// GET - 요청 목록 조회 (인증 필요)
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const schoolId = searchParams.get('schoolId')

    const where: Record<string, unknown> = {}
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

    return successResponse(requests)
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return errorResponse('요청 목록을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 요청 생성 (관리자 전용 + 입력 검증)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()

    // 입력 검증
    const validation = validateBody(requestSchema, body)
    if (!validation.success) {
      return errorResponse(validation.error, 400)
    }

    const data = validation.data
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
    } = data

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
        sessions: parseInt(String(sessions)),
        studentCount: parseInt(String(studentCount)),
        targetGrade: targetGrade || '',
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        alternateDate: alternateDate ? new Date(alternateDate) : null,
        flexibleDate: flexibleDate || false,
        schoolBudget: schoolBudget ? parseFloat(String(schoolBudget)) : null,
        requirements: requirements || null,
        notes: notes || null,
        status: 'SUBMITTED',
        priority: priority || 'NORMAL',
      },
      include: {
        school: true,
        program: true,
      },
    })

    return successResponse(schoolRequest, 201)
  } catch (error) {
    console.error('Failed to create request:', error)
    return errorResponse('요청 생성에 실패했습니다.', 500)
  }
})
