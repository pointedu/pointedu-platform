export const dynamic = 'force-dynamic'

import { prisma, ProgramCategory } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'
import { validateBody } from '../../../lib/validations'
import { z } from 'zod'

// 프로그램 생성 스키마 (실제 DB 필드에 맞춤)
const programSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, '프로그램명은 필수입니다.'),
  category: z.string().optional(),
  description: z.string().optional(),
  targetGrades: z.array(z.string()).optional(),
  minStudents: z.number().optional(),
  maxStudents: z.union([z.string(), z.number()]).optional(),
  sessionCount: z.number().optional(),
  sessionMinutes: z.number().optional(),
  duration: z.union([z.string(), z.number()]).optional(),
  baseMaterialCost: z.union([z.string(), z.number()]).optional(),
  baseSessionFee: z.union([z.string(), z.number()]).optional(),
  basePrice: z.union([z.string(), z.number()]).optional(),
  difficulty: z.number().optional(),
})

// GET - 프로그램 목록 조회 (인증 필요)
export const GET = withAuth(async () => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // 프론트엔드 호환을 위해 필드명 변환
    const formattedPrograms = programs.map((program) => ({
      ...program,
      duration: program.sessionMinutes,
      basePrice: program.baseSessionFee,
    }))

    return successResponse(formattedPrograms)
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return errorResponse('프로그램 목록을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 프로그램 생성 (관리자 전용 + 입력 검증)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()

    // 입력 검증
    const validation = validateBody(programSchema, body)
    if (!validation.success) {
      return errorResponse(validation.error, 400)
    }

    const data = validation.data
    const {
      code,
      name,
      category,
      description,
      targetGrades,
      minStudents,
      maxStudents,
      sessionCount,
      sessionMinutes,
      duration,
      baseMaterialCost,
      baseSessionFee,
      basePrice,
      difficulty,
    } = data

    // code가 없으면 자동 생성 (PRG + timestamp)
    const programCode = code || `PRG${Date.now()}`

    const program = await prisma.program.create({
      data: {
        code: programCode,
        name,
        category: (category as ProgramCategory) || 'CAREER',
        description: description || '',
        targetGrades: targetGrades || [],
        minStudents: minStudents || 15,
        maxStudents: maxStudents ? parseInt(String(maxStudents)) : 30,
        sessionCount: sessionCount || 2,
        sessionMinutes: sessionMinutes || (duration ? parseInt(String(duration)) : 45),
        baseMaterialCost: baseMaterialCost ? parseFloat(String(baseMaterialCost)) : null,
        baseSessionFee: baseSessionFee ? parseFloat(String(baseSessionFee)) : (basePrice ? parseFloat(String(basePrice)) : null),
        difficulty: difficulty || 3,
        active: true,
      },
    })

    return successResponse(program, 201)
  } catch (error) {
    console.error('Failed to create program:', error)
    return errorResponse('프로그램 생성에 실패했습니다.', 500)
  }
})
