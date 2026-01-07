export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'
import { instructorCreateSchema, validateBody } from '../../../lib/validations'
import bcrypt from 'bcryptjs'

// GET - 강사 목록 조회 (인증 필요)
export const GET = withAuth(async () => {
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

    // 프론트엔드 호환을 위해 bankAccount를 분리해서 응답
    const formattedInstructors = instructors.map((instructor) => {
      const bankParts = (instructor.bankAccount || '').split(' ')
      return {
        ...instructor,
        bankName: bankParts[0] || null,
        accountNumber: bankParts[1] || null,
        accountHolder: bankParts[2] || null,
      }
    })

    return successResponse(formattedInstructors)
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return errorResponse('강사 목록을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 강사 생성 (관리자 전용 + 입력 검증)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()

    // 입력 검증
    const validation = validateBody(instructorCreateSchema, body)
    if (!validation.success) {
      return errorResponse(validation.error, 400)
    }

    const data = validation.data
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
      bankName,
      accountNumber,
      accountHolder,
      defaultSessionFee,
    } = data

    // bankAccount 생성: 프론트엔드에서 분리된 필드로 오면 합침
    let finalBankAccount = bankAccount
    if (!bankAccount && (bankName || accountNumber || accountHolder)) {
      const parts = [bankName, accountNumber, accountHolder].filter(Boolean)
      finalBankAccount = parts.join(' ')
    }

    // Create user first
    const hashedPassword = await bcrypt.hash('instructor2025', 10)
    const user = await prisma.user.create({
      data: {
        email: email || `instructor_${Date.now()}@pointedu.co.kr`,
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
        email: email || null,
        phoneNumber: phoneNumber || '',
        homeBase: homeBase || '',
        subjects: subjects || [],
        rangeKm: rangeKm || '40-60',
        maxDistanceKm: maxDistanceKm || 60,
        availableDays: availableDays || [],
        bankAccount: finalBankAccount || null,
        defaultSessionFee: defaultSessionFee ? parseFloat(String(defaultSessionFee)) : null,
        status: 'ACTIVE',
      },
      include: { user: true },
    })

    // 프론트엔드 호환을 위해 bankAccount를 분리해서 응답
    const bankParts = (instructor.bankAccount || '').split(' ')
    return successResponse({
      ...instructor,
      bankName: bankParts[0] || '',
      accountNumber: bankParts[1] || '',
      accountHolder: bankParts[2] || '',
    }, 201)
  } catch (error) {
    console.error('Failed to create instructor:', error)
    return errorResponse('강사 생성에 실패했습니다.', 500)
  }
})
