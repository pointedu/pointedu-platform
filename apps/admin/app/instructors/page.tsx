export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import InstructorList from './InstructorList'

async function getInstructors() {
  try {
    const data = await prisma.instructor.findMany({
      include: {
        user: true,
        _count: {
          select: {
            assignments: true,
            payments: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    // Convert Decimal to number for client component compatibility
    return data.map((instructor) => ({
      ...instructor,
      rating: instructor.rating ? Number(instructor.rating) : null,
    }))
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return []
  }
}

export default async function InstructorsPage() {
  const instructors = await getInstructors()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">강사 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            등록된 강사 {instructors.length}명의 정보를 확인하고 관리합니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          + 강사 등록
        </button>
      </div>

      <InstructorList initialInstructors={instructors as any} />
    </div>
  )
}
