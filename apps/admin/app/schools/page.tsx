export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import SchoolList from './SchoolList'
import { serializeDecimalArray } from '../../lib/utils'

async function getSchools() {
  try {
    const schools = await prisma.school.findMany({
      include: {
        contacts: true,
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    // Serialize Decimal values for client component
    return serializeDecimalArray(schools)
  } catch (error) {
    console.error('Failed to fetch schools:', error)
    return []
  }
}

export default async function SchoolsPage() {
  const schools = await getSchools()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학교 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            등록된 학교 {schools.length}개를 관리합니다.
          </p>
        </div>
      </div>
      <SchoolList initialSchools={schools as any} />
    </div>
  )
}
