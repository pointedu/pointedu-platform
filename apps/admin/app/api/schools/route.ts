export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'
import { validateBody } from '../../../lib/validations'
import { z } from 'zod'

// 학교 생성 스키마
const schoolSchema = z.object({
  name: z.string().min(1, '학교명은 필수입니다.'),
  type: z.enum(['ELEMENTARY', 'MIDDLE', 'HIGH', 'SPECIAL', 'ALTERNATIVE', 'INSTITUTION']).optional(),
  address: z.string().optional().nullable(),
  addressDetail: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  faxNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  distanceKm: z.union([z.string(), z.number()]).optional().nullable(),
  transportFee: z.union([z.string(), z.number()]).optional().nullable(),
  totalStudents: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET - 학교 목록 조회 (인증 필요)
export const GET = withAuth(async () => {
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
    return successResponse(schools)
  } catch (error) {
    console.error('Failed to fetch schools:', error)
    return errorResponse('학교 목록을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 학교 생성 (관리자 전용 + 입력 검증)
export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json()

    // 입력 검증
    const validation = validateBody(schoolSchema, body)
    if (!validation.success) {
      return errorResponse(validation.error, 400)
    }

    const data = validation.data
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
    } = data

    const school = await prisma.school.create({
      data: {
        name,
        type: type || 'MIDDLE',
        address: address || '',
        addressDetail: addressDetail || null,
        region: region || '',
        phoneNumber: phoneNumber || '',
        faxNumber: faxNumber || null,
        email: email || null,
        distanceKm: distanceKm ? parseInt(String(distanceKm)) : null,
        transportFee: transportFee ? parseFloat(String(transportFee)) : null,
        totalStudents: totalStudents ? parseInt(String(totalStudents)) : null,
        notes: notes || null,
        active: true,
      },
    })

    return successResponse(school, 201)
  } catch (error) {
    console.error('Failed to create school:', error)
    return errorResponse('학교 생성에 실패했습니다.', 500)
  }
})
