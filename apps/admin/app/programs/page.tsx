export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import ProgramList from './ProgramList'
import { serializeDecimalArray } from '../../lib/utils'

async function getPrograms() {
  try {
    const programs = await prisma.program.findMany({
      include: {
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return serializeDecimalArray(programs)
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return []
  }
}

interface SerializedProgram {
  id: string
  name: string
  category: string
  description?: string | null
  sessionMinutes?: number | null
  maxStudents?: number | null
  baseSessionFee?: number | null
  active: boolean
  _count: { requests: number }
}

export default async function ProgramsPage() {
  const programs = await getPrograms() as SerializedProgram[]

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
      <ProgramList initialPrograms={programs} />
    </div>
  )
}
