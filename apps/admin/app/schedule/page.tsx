export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import ScheduleCalendar from './ScheduleCalendar'
import { serializeDecimalArray } from '../../lib/utils'

async function getScheduleData() {
  try {
    const [assignments, schools, instructors] = await Promise.all([
      prisma.instructorAssignment.findMany({
        include: {
          instructor: true,
          request: {
            include: {
              school: true,
              program: true,
            },
          },
        },
        where: {
          status: {
            in: ['PROPOSED', 'CONFIRMED'],
          },
        },
        orderBy: {
          assignedDate: 'asc',
        },
      }),
      prisma.school.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.instructor.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      }),
    ])

    // Serialize Decimal values for client component
    return {
      assignments: serializeDecimalArray(assignments),
      schools: serializeDecimalArray(schools),
      instructors: serializeDecimalArray(instructors),
    }
  } catch (error) {
    console.error('Failed to fetch schedule data:', error)
    return { assignments: [], schools: [], instructors: [] }
  }
}

export default async function SchedulePage() {
  const { assignments, schools, instructors } = await getScheduleData()

  // Transform assignments into schedule events
  const events = assignments.map((assignment: any) => ({
    id: assignment.id,
    title: `${assignment.request.school.name} - ${assignment.request.program?.name || assignment.request.customProgram}`,
    date: assignment.assignedDate,
    instructor: assignment.instructor.name,
    instructorId: assignment.instructor.id,
    school: assignment.request.school.name,
    schoolId: assignment.request.school.id,
    program: assignment.request.program?.name || assignment.request.customProgram,
    sessions: assignment.request.sessions,
    status: assignment.status,
  }))

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">일정 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            학교별, 강사별 수업 일정을 확인하고 관리합니다.
          </p>
        </div>
      </div>

      <ScheduleCalendar
        events={events}
        schools={schools as any}
        instructors={instructors as any}
      />
    </div>
  )
}
