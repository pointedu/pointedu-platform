export const revalidate = 60 // Revalidate every 60 seconds

import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '@pointedu/database'
import Link from 'next/link'
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { serializeDecimal } from '../../lib/utils'

async function getInstructorData(userId: string) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
      include: {
        assignments: {
          where: {
            status: {
              in: ['CONFIRMED', 'IN_PROGRESS'],
            },
          },
          include: {
            request: {
              include: {
                school: true,
                program: true,
              },
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
          take: 5,
        },
        applications: {
          where: {
            status: 'PENDING',
          },
        },
        _count: {
          select: {
            assignments: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
      },
    })

    // Get proposed/pending assignments that need response
    const proposedAssignments = await prisma.instructorAssignment.findMany({
      where: {
        instructor: { userId },
        status: {
          in: ['PROPOSED', 'PENDING'],
        },
      },
      include: {
        request: {
          include: {
            school: true,
            program: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get count of available classes
    const availableClasses = await prisma.schoolRequest.count({
      where: {
        status: {
          in: ['APPROVED', 'SUBMITTED'],
        },
        assignments: {
          none: {},
        },
      },
    })

    // Serialize Decimal values for client component
    const serializedInstructor = instructor ? serializeDecimal(instructor) : null
    const serializedProposed = serializeDecimal(proposedAssignments)
    return { instructor: serializedInstructor, availableClasses, proposedAssignments: serializedProposed }
  } catch (error) {
    console.error('Failed to fetch instructor data:', error)
    return { instructor: null, availableClasses: 0, proposedAssignments: [] }
  }
}

export default async function InstructorHomePage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const { instructor, availableClasses, proposedAssignments } = await getInstructorData(userId)

  if (!instructor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">강사 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const upcomingAssignments = instructor.assignments || []
  const completedCount = instructor._count?.assignments || 0
  const pendingApplications = instructor.applications?.length || 0

  const stats = [
    ...(proposedAssignments.length > 0
      ? [
          {
            name: '응답 대기중',
            value: proposedAssignments.length,
            icon: ExclamationTriangleIcon,
            color: 'bg-orange-500',
            href: '/instructor/schedule',
          },
        ]
      : []),
    {
      name: '다가오는 수업',
      value: upcomingAssignments.length,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      href: '/instructor/schedule',
    },
    {
      name: '지원 가능한 수업',
      value: availableClasses,
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500',
      href: '/instructor/available',
    },
    {
      name: '완료한 수업',
      value: completedCount,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      href: '/instructor/schedule',
    },
    {
      name: '지원 대기중',
      value: pendingApplications,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      href: '/instructor/available',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {instructor.name}님!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          오늘도 좋은 하루 되세요.
        </p>
      </div>

      {/* Proposed Assignments Alert */}
      {proposedAssignments.length > 0 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-yellow-800">
                응답이 필요한 수업 제안이 있습니다
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {proposedAssignments.length}개의 수업 제안이 대기 중입니다. 확인 후 수락 또는 거절해주세요.
                </p>
              </div>
              <div className="mt-3">
                <Link
                  href="/instructor/schedule"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
                >
                  수업 제안 확인하기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">다가오는 수업</h2>
        </div>
        <div className="p-6">
          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">예정된 수업이 없습니다.</p>
              <Link
                href="/instructor/available"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                수업 지원하러 가기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {assignment.request.school.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {assignment.request.program?.name || assignment.request.customProgram}
                    </p>
                    <p className="text-sm text-gray-500">
                      {assignment.scheduledDate ? (
                        <span>
                          {new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </span>
                      ) : assignment.request.desiredDate ? (
                        <span className="text-orange-600">
                          {new Date(assignment.request.desiredDate).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })} (희망)
                        </span>
                      ) : (
                        <span className="text-red-500">미정</span>
                      )}
                      {assignment.scheduledTime && ` ${assignment.scheduledTime}`}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {assignment.status === 'CONFIRMED' ? '확정' : '진행중'}
                  </span>
                </div>
              ))}
              <Link
                href="/instructor/schedule"
                className="block text-center text-sm text-blue-600 hover:text-blue-500 py-2"
              >
                전체 일정 보기 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
