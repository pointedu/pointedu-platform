export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma, ProgramCategory } from '@pointedu/database'

interface BulkProgramItem {
  name: string
  category: string
  description?: string | null
  sessionMinutes?: number | null
  maxStudents?: number | null
  baseSessionFee?: number | null
}

// 카테고리 매핑 (한글 → DB enum)
const categoryMapping: Record<string, ProgramCategory> = {
  '진로체험': 'CAREER',
  '진로탐색': 'CAREER',
  'AI/코딩': 'FOURTHIND',
  'AI코딩': 'FOURTHIND',
  '4차산업': 'FOURTHIND',
  '메이커': 'STEAM',
  '과학실험': 'STEAM',
  '과학': 'STEAM',
  '예술/창작': 'CULTURE',
  '예술': 'CULTURE',
  '창작': 'CULTURE',
  '문화예술': 'CULTURE',
  '체험형': 'EXPERIENCE',
  '체험': 'EXPERIENCE',
  '전문직': 'PROFESSIONAL',
  '메디컬': 'MEDICAL',
  '기타': 'OTHER',
}

// 유효한 카테고리 목록 (Prisma enum)
const validCategories: ProgramCategory[] = ['FOURTHIND', 'CULTURE', 'MEDICAL', 'PROFESSIONAL', 'STEAM', 'EXPERIENCE', 'CAREER', 'OTHER']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programs } = await request.json() as { programs: BulkProgramItem[] }

    if (!programs || programs.length === 0) {
      return NextResponse.json(
        { error: '프로그램 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 중복 체크를 위해 기존 프로그램 조회
    const existingPrograms = await prisma.program.findMany({
      select: { name: true },
    })
    const existingNames = new Set(existingPrograms.map((p) => p.name.toLowerCase()))

    // 트랜잭션으로 대량 생성
    const createdPrograms = await prisma.$transaction(async (tx) => {
      const results = []

      for (const item of programs) {
        // 이름 검증
        if (!item.name || item.name.trim() === '') {
          continue
        }

        const name = item.name.trim()

        // 중복 체크
        if (existingNames.has(name.toLowerCase())) {
          continue
        }

        // 카테고리 변환
        const rawCategory = item.category?.trim() || 'OTHER'
        let category: ProgramCategory = 'OTHER'

        if (categoryMapping[rawCategory]) {
          category = categoryMapping[rawCategory]
        } else if (validCategories.includes(rawCategory as ProgramCategory)) {
          category = rawCategory as ProgramCategory
        }

        // 프로그램 코드 생성 (카테고리 + 일련번호)
        const existingProgramCount = await tx.program.count({
          where: { category },
        })
        const code = `${category.substring(0, 3).toUpperCase()}${String(existingProgramCount + 1).padStart(3, '0')}`

        const newProgram = await tx.program.create({
          data: {
            code,
            name,
            category,
            description: item.description || name, // description이 없으면 name 사용
            sessionMinutes: item.sessionMinutes ? parseInt(String(item.sessionMinutes)) : 45,
            maxStudents: item.maxStudents ? parseInt(String(item.maxStudents)) : 30,
            baseSessionFee: item.baseSessionFee ? parseFloat(String(item.baseSessionFee)) : undefined,
            active: true,
          },
        })

        existingNames.add(name.toLowerCase())
        results.push(newProgram)
      }

      return results
    })

    return NextResponse.json({
      success: true,
      count: createdPrograms.length,
      programs: createdPrograms,
    })
  } catch (error) {
    console.error('Failed to create bulk programs:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: `대량 프로그램 등록 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    )
  }
}
