// API 입력 검증 스키마
// API Input Validation Schemas

import { z } from 'zod'

// 공통 스키마
export const idSchema = z.string().min(1, 'ID가 필요합니다.')

// 강사 스키마
export const instructorCreateSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다.').max(100),
  email: z.string().email('유효한 이메일을 입력하세요.').optional().nullable(),
  phoneNumber: z.string().min(10, '연락처는 10자 이상이어야 합니다.').optional().nullable(),
  homeBase: z.string().optional().nullable(),
  subjects: z.array(z.string()).optional().default([]),
  rangeKm: z.string().optional().default('40-60'),
  maxDistanceKm: z.number().min(0).max(200).optional().default(60),
  availableDays: z.array(z.string()).optional().default([]),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  defaultSessionFee: z.union([z.string(), z.number()]).optional().nullable(),
})

export const instructorUpdateSchema = instructorCreateSchema.partial()

// 공지사항 스키마
export const noticeCreateSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다.').max(200),
  content: z.string().min(1, '내용은 필수입니다.'),
  category: z.enum(['GENERAL', 'IMPORTANT', 'EVENT']).default('GENERAL'),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
})

export const noticeUpdateSchema = noticeCreateSchema.partial()

// 프로그램 스키마
export const programCreateSchema = z.object({
  name: z.string().min(1, '프로그램명은 필수입니다.').max(200),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  duration: z.number().min(0).optional().nullable(),
  targetAge: z.string().optional().nullable(),
  maxParticipants: z.number().min(1).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
})

export const programUpdateSchema = programCreateSchema.partial()

// 학교 스키마
export const schoolCreateSchema = z.object({
  name: z.string().min(1, '학교명은 필수입니다.').max(200),
  region: z.string().optional().nullable(),
  type: z.enum(['ELEMENTARY', 'MIDDLE', 'HIGH', 'SPECIAL']).optional(),
  address: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
})

export const schoolUpdateSchema = schoolCreateSchema.partial()

// 요청 스키마
export const requestCreateSchema = z.object({
  schoolId: z.string().min(1, '학교 ID는 필수입니다.'),
  programId: z.string().optional().nullable(),
  requestDate: z.string().or(z.date()).optional(),
  preferredDates: z.array(z.string()).optional().default([]),
  participantCount: z.number().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
})

export const requestUpdateSchema = requestCreateSchema.partial()

// 견적 스키마
export const quoteCreateSchema = z.object({
  requestId: z.string().min(1, '요청 ID는 필수입니다.'),
  instructorFee: z.number().min(0).optional().default(0),
  transportFee: z.number().min(0).optional().default(0),
  materialFee: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional().nullable(),
})

export const quoteUpdateSchema = quoteCreateSchema.partial()

// 검증 헬퍼 함수
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(', ')
    return { success: false, error: errors }
  }
  return { success: true, data: result.data }
}
