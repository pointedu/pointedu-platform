export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma, SchoolType } from '@pointedu/database'

interface BulkSchoolItem {
  name: string
  type?: string
  address: string
  region: string
  phoneNumber?: string
  email?: string | null
  distanceKm?: number | null
  transportFee?: number | null
  totalStudents?: number | null
  notes?: string | null
}

// 학교 유형 매핑 (한글 → DB enum)
const schoolTypeMapping: Record<string, SchoolType> = {
  '초등학교': 'ELEMENTARY',
  '초등': 'ELEMENTARY',
  '중학교': 'MIDDLE',
  '중등': 'MIDDLE',
  '중': 'MIDDLE',
  '고등학교': 'HIGH',
  '고등': 'HIGH',
  '고': 'HIGH',
  '특수학교': 'SPECIAL',
  '특수': 'SPECIAL',
  '대안학교': 'ALTERNATIVE',
  '대안': 'ALTERNATIVE',
  '기관': 'INSTITUTION',
  '교육기관': 'INSTITUTION',
}

// 유효한 학교 유형 목록 (Prisma enum)
const validSchoolTypes: SchoolType[] = ['ELEMENTARY', 'MIDDLE', 'HIGH', 'SPECIAL', 'ALTERNATIVE', 'INSTITUTION']

// 학교명에서 유형 추론
function inferSchoolType(name: string): SchoolType {
  if (name.includes('초등') || name.includes('초교')) return 'ELEMENTARY'
  if (name.includes('중학') || name.includes('중교')) return 'MIDDLE'
  if (name.includes('고등') || name.includes('고교')) return 'HIGH'
  if (name.includes('특수')) return 'SPECIAL'
  if (name.includes('대안')) return 'ALTERNATIVE'
  if (name.includes('센터') || name.includes('기관')) return 'INSTITUTION'
  return 'MIDDLE' // 기본값
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { schools } = await request.json() as { schools: BulkSchoolItem[] }

    if (!schools || schools.length === 0) {
      return NextResponse.json(
        { error: '학교 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 중복 체크를 위해 기존 학교 조회
    const existingSchools = await prisma.school.findMany({
      select: { name: true },
    })
    const existingNames = new Set(existingSchools.map((s) => s.name.toLowerCase()))

    // 트랜잭션으로 대량 생성
    const createdSchools = await prisma.$transaction(async (tx) => {
      const results = []

      for (const item of schools) {
        // 이름 검증
        if (!item.name || item.name.trim() === '') {
          continue
        }

        const name = item.name.trim()

        // 중복 체크
        if (existingNames.has(name.toLowerCase())) {
          continue
        }

        // 학교 유형 변환
        const rawType = item.type?.trim() || ''
        let schoolType: SchoolType = inferSchoolType(name)

        if (rawType) {
          if (schoolTypeMapping[rawType]) {
            schoolType = schoolTypeMapping[rawType]
          } else if (validSchoolTypes.includes(rawType as SchoolType)) {
            schoolType = rawType as SchoolType
          }
        }

        // 주소에서 지역 추출 (지역이 없는 경우)
        let region = item.region?.trim() || ''
        if (!region && item.address) {
          // 주소에서 첫 번째 시/군 추출
          const addressMatch = item.address.match(/([\uAC00-\uD7AF]+[시군구])/)
          if (addressMatch) {
            region = addressMatch[1]
          }
        }

        const newSchool = await tx.school.create({
          data: {
            name,
            type: schoolType,
            address: item.address?.trim() || '',
            region: region || '미정',
            phoneNumber: item.phoneNumber?.trim() || '',
            email: item.email?.trim() || null,
            distanceKm: item.distanceKm ? parseFloat(String(item.distanceKm)) : null,
            transportFee: item.transportFee ? parseFloat(String(item.transportFee)) : null,
            totalStudents: item.totalStudents ? parseInt(String(item.totalStudents)) : null,
            notes: item.notes?.trim() || null,
            active: true,
          },
        })

        existingNames.add(name.toLowerCase())
        results.push(newSchool)
      }

      return results
    })

    return NextResponse.json({
      success: true,
      count: createdSchools.length,
      schools: createdSchools,
    })
  } catch (error) {
    console.error('Failed to create bulk schools:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: `대량 학교 등록 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    )
  }
}
