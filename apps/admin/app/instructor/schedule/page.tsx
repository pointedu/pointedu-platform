export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import {
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

async function getInstructorSchedule(userId: string) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
      include: {
        assignments: {
          include: {
            request: {
              include: {
                school: true,
                program: true,
              },
            },
          },
          orderBy: {
            scheduledDate: 'desc',
          },
        },
      },
    })

    return instructor
  } catch (error) {
    console.error('Failed to fetch instructor schedule:', error)
    return null
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-gray-100 text-gray-800' },
  PROPOSED: { label: '제안됨', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: '수락됨', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-800' },
  IN_PROGRESS: { label: '진행중', color: 'bg-indigo-100 text-indigo-800' },
  COMPLETED: { label: '완료', color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: '취소됨', color: 'bg-red-100 text-red-800' },
  DECLINED: { label: '거절됨', color: 'bg-red-100 text-red-800' },
}

export default async function InstructorSchedulePage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const instructor = await getInstructorSchedule(userId)

  if (!instructor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">강사 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const assignments = instructor.assignments || []

  // Group assignments by status
  const upcomingAssignments = assignments.filter((a) =>
    ['CONFIRMED', 'ACCEPTED', 'PROPOSED', 'IN_PROGRESS'].includes(a.status)
  )
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED')
  const cancelledAssignments = assignments.filter((a) =>
    ['CANCELLED', 'DECLINED'].includes(a.status)
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 수업 일정</h1>
        <p className="mt-1 text-sm text-gray-600">
          배정된 수업 일정을 확인합니다.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">예정된 수업</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingAssignments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">완료한 수업</p>
          <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">취소된 수업</p>
          <p className="text-2xl font-bold text-gray-600">{cancelledAssignments.length}</p>
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">예정된 수업</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {upcomingAssignments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">예정된 수업이 없습니다.</p>
            </div>
          ) : (
            upcomingAssignments.map((assignment: any) => (
              <div key={assignment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {assignment.request.school.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusLabels[assignment.status]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[assignment.status]?.label || assignment.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>
                          {assignment.request.program?.name || assignment.request.customProgram}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {assignment.scheduledDate
                            ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long',
                              })
                            : '일정 미정'}
                        </span>
                      </div>
                      {assignment.scheduledTime && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{assignment.scheduledTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{assignment.request.school.address}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">학생 수: </span>
                      <span className="font-medium">{assignment.request.studentCount}명</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-500">차시: </span>
                      <span className="font-medium">{assignment.request.sessions}차시</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completed Assignments */}
      {completedAssignments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">완료한 수업</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {completedAssignments.slice(0, 10).map((assignment: any) => (
              <div key={assignment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {assignment.request.school.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {assignment.request.program?.name || assignment.request.customProgram}
                    </p>
                    <p className="text-sm text-gray-500">
                      {assignment.completedAt
                        ? new Date(assignment.completedAt).toLocaleDateString('ko-KR')
                        : assignment.scheduledDate
                        ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    완료
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
