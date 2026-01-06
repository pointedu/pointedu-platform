export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import ProgramList from './ProgramList'

async function getPrograms() {
  try {
    return await prisma.program.findMany({
      include: {
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return []
  }
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프로그램 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            등록된 교육 프로그램 {programs.length}개를 관리합니다.
          </p>
        </div>
      </div>
      <ProgramList initialPrograms={programs as any} />
    </div>
  )
}
