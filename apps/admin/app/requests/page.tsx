export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import RequestList from './RequestList'

async function getRequests() {
  try {
    return await prisma.schoolRequest.findMany({
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: {
            instructor: true,
          },
        },
      },
      orderBy: {
        requestDate: 'desc',
      },
      take: 50,
    })
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return []
  }
}

async function getAvailableInstructors() {
  try {
    return await prisma.instructor.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        name: 'asc',
      },
    })
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return []
  }
}

async function getSchools() {
  try {
    return await prisma.school.findMany({
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Failed to fetch schools:', error)
    return []
  }
}

async function getPrograms() {
  try {
    return await prisma.program.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return []
  }
}

export default async function RequestsPage() {
  const [requests, instructors, schools, programs] = await Promise.all([
    getRequests(),
    getAvailableInstructors(),
    getSchools(),
    getPrograms(),
  ])

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학교 요청 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            학교에서 요청한 프로그램 {requests.length}건을 확인하고 처리합니다.
          </p>
        </div>
      </div>

      <RequestList
        initialRequests={requests as any}
        availableInstructors={instructors as any}
        schools={schools as any}
        programs={programs as any}
      />
    </div>
  )
}
