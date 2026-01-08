export const revalidate = 30 // Revalidate every 30 seconds for real-time data

import { prisma } from '@pointedu/database'
import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import {
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
  HandRaisedIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

const DashboardCharts = dynamicImport(() => import('./DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 rounded-xl h-80"></div>
        <div className="bg-gray-100 rounded-xl h-80"></div>
      </div>
    </div>
  ),
})

async function getDashboardStats() {
  try {
    const [
      totalRequests,
      pendingRequests,
      totalInstructors,
      activeInstructors,
      pendingInstructors,
      totalPayments,
      paidPayments,
      pendingApplications,
      pendingAssignments,
    ] = await Promise.all([
      prisma.schoolRequest.count(),
      prisma.schoolRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.instructor.count(),
      prisma.instructor.count({ where: { status: 'ACTIVE' } }),
      prisma.instructor.count({ where: { status: 'PENDING' } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.classApplication.count({ where: { status: 'PENDING' } }),
      prisma.instructorAssignment.count({ where: { status: 'PENDING' } }),
    ])

    return {
      totalRequests,
      pendingRequests,
      totalInstructors,
      activeInstructors,
      pendingInstructors,
      totalPayments,
      paidPayments,
      pendingApplications,
      pendingAssignments,
      connected: true,
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      totalRequests: 0,
      pendingRequests: 0,
      totalInstructors: 0,
      activeInstructors: 0,
      pendingInstructors: 0,
      totalPayments: 0,
      paidPayments: 0,
      pendingApplications: 0,
      pendingAssignments: 0,
      connected: false,
    }
  }
}

// 강사 회원가입 승인 대기 목록
async function getPendingInstructors() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        homeBase: true,
        subjects: true,
        createdAt: true,
      },
    })
    return instructors
  } catch (error) {
    console.error('Failed to fetch pending instructors:', error)
    return []
  }
}

// 수업 지원 대기 목록
async function getPendingApplications() {
  try {
    const applications = await prisma.classApplication.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        instructor: {
          select: { name: true, grade: true },
        },
        request: {
          select: {
            requestNumber: true,
            school: { select: { name: true } },
            program: { select: { name: true } },
            desiredDate: true,
          },
        },
      },
    })
    return applications
  } catch (error) {
    console.error('Failed to fetch pending applications:', error)
    return []
  }
}

// 최근 활동 내역
async function getRecentActivities() {
  try {
    const [recentRequests, recentAssignments, recentInstructors] = await Promise.all([
      // 최근 요청
      prisma.schoolRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          requestNumber: true,
          status: true,
          createdAt: true,
          school: { select: { name: true } },
          program: { select: { name: true } },
        },
      }),
      // 최근 배정
      prisma.instructorAssignment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          status: true,
          createdAt: true,
          instructor: { select: { name: true } },
          request: {
            select: {
              requestNumber: true,
              school: { select: { name: true } },
            },
          },
        },
      }),
      // 최근 가입 강사
      prisma.instructor.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    // 모든 활동을 시간순으로 정렬
    type ActivityBase = { id: string; createdAt: Date }
    const activities: Array<{
      type: 'request' | 'assignment' | 'instructor'
      data: ActivityBase & Record<string, unknown>
      createdAt: Date
    }> = [
      ...recentRequests.map((r) => ({ type: 'request' as const, data: r, createdAt: r.createdAt })),
      ...recentAssignments.map((a) => ({ type: 'assignment' as const, data: a, createdAt: a.createdAt })),
      ...recentInstructors.map((i) => ({ type: 'instructor' as const, data: i, createdAt: i.createdAt })),
    ]

    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8)
  } catch (error) {
    console.error('Failed to fetch recent activities:', error)
    return []
  }
}

// 다가오는 수업 일정
async function getUpcomingClasses() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const assignments = await prisma.instructorAssignment.findMany({
      where: {
        scheduledDate: { gte: today },
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
      include: {
        instructor: { select: { name: true } },
        request: {
          select: {
            requestNumber: true,
            school: { select: { name: true } },
            program: { select: { name: true } },
          },
        },
      },
    })
    return assignments
  } catch (error) {
    console.error('Failed to fetch upcoming classes:', error)
    return []
  }
}

async function getChartData() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // Get monthly requests
    const requests = await prisma.schoolRequest.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true },
    })

    // Get monthly payments
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        status: 'PAID',
      },
      select: { createdAt: true, netAmount: true },
    })

    // Get instructor stats (assignments count)
    const instructorStats = await prisma.instructor.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Get program stats
    const programStats = await prisma.program.findMany({
      include: {
        _count: { select: { requests: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Process monthly data
    const monthlyRequests: { month: string; count: number }[] = []
    const monthlyPayments: { month: string; amount: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getMonth() + 1}월`

      const monthRequests = requests.filter((r) => {
        const rDate = new Date(r.createdAt)
        return rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear()
      })

      const monthPayments = payments.filter((p) => {
        const pDate = new Date(p.createdAt)
        return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear()
      })

      monthlyRequests.push({ month: monthKey, count: monthRequests.length })
      monthlyPayments.push({
        month: monthKey,
        amount: monthPayments.reduce((sum, p) => sum + Number(p.netAmount || 0), 0),
      })
    }

    return {
      monthlyRequests,
      monthlyPayments,
      instructorStats: instructorStats
        .map((i) => ({ name: i.name, count: i._count.assignments }))
        .sort((a, b) => b.count - a.count),
      programStats: programStats
        .map((p) => ({ name: p.name, count: p._count.requests }))
        .sort((a, b) => b.count - a.count),
    }
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
    return {
      monthlyRequests: [],
      monthlyPayments: [],
      instructorStats: [],
      programStats: [],
    }
  }
}

function formatDate(date: Date) {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: '대기', color: 'bg-yellow-100 text-yellow-800' },
    SUBMITTED: { label: '제출됨', color: 'bg-blue-100 text-blue-800' },
    APPROVED: { label: '승인', color: 'bg-green-100 text-green-800' },
    ACTIVE: { label: '활성', color: 'bg-green-100 text-green-800' },
    CONFIRMED: { label: '확정', color: 'bg-purple-100 text-purple-800' },
    COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-800' },
    CANCELLED: { label: '취소', color: 'bg-red-100 text-red-800' },
    REJECTED: { label: '거절', color: 'bg-red-100 text-red-800' },
  }
  const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export default async function DashboardPage() {
  const [stats, chartData, pendingInstructors, pendingApplications, recentActivities, upcomingClasses] =
    await Promise.all([
      getDashboardStats(),
      getChartData(),
      getPendingInstructors(),
      getPendingApplications(),
      getRecentActivities(),
      getUpcomingClasses(),
    ])

  const cards = [
    {
      name: '총 요청',
      value: stats.totalRequests,
      subtext: `대기중: ${stats.pendingRequests}건`,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      href: '/requests',
    },
    {
      name: '강사',
      value: stats.totalInstructors,
      subtext: `활동중: ${stats.activeInstructors}명`,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      href: '/instructors',
    },
    {
      name: '정산',
      value: stats.totalPayments,
      subtext: `지급완료: ${stats.paidPayments}건`,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      href: '/payments',
    },
    {
      name: '완료율',
      value:
        stats.totalRequests > 0
          ? `${Math.round(((stats.totalRequests - stats.pendingRequests) / stats.totalRequests) * 100)}%`
          : '0%',
      subtext: '전체 요청 기준',
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      href: '/requests',
    },
  ]

  // 알림이 필요한 항목 수
  const alertCount = stats.pendingInstructors + stats.pendingApplications + stats.pendingAssignments

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-sm text-gray-600">Point Education 관리자 대시보드에 오신 것을 환영합니다.</p>
      </div>

      {/* DB Connection Status */}
      {!stats.connected && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">데이터베이스 연결 대기 중</p>
              <p className="text-xs text-yellow-600">테스트 데이터를 생성하거나 데이터베이스 연결을 확인해주세요.</p>
            </div>
          </div>
        </div>
      )}

      {/* 긴급 알림 배너 */}
      {alertCount > 0 && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">처리가 필요한 항목이 {alertCount}건 있습니다</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-red-600">
                {stats.pendingInstructors > 0 && (
                  <span>• 강사 승인 대기: {stats.pendingInstructors}명</span>
                )}
                {stats.pendingApplications > 0 && (
                  <span>• 수업 지원 대기: {stats.pendingApplications}건</span>
                )}
                {stats.pendingAssignments > 0 && (
                  <span>• 배정 확인 대기: {stats.pendingAssignments}건</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md ${card.color} p-3`}>
                  <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{card.value}</dd>
                    <dd className="mt-1 text-sm text-gray-500">{card.subtext}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 승인 대기 및 지원 현황 */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 강사 회원가입 승인 대기 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlusIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">강사 회원가입 승인 대기</h2>
              {stats.pendingInstructors > 0 && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                  {stats.pendingInstructors}
                </span>
              )}
            </div>
            <Link href="/instructors?status=PENDING" className="text-sm text-blue-600 hover:text-blue-500">
              전체보기 →
            </Link>
          </div>
          <div className="p-6">
            {pendingInstructors.length === 0 ? (
              <p className="text-center text-gray-500 py-4">승인 대기 중인 강사가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingInstructors.map((instructor) => (
                  <li key={instructor.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/instructors?id=${instructor.id}`} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{instructor.name}</p>
                        <p className="text-sm text-gray-500">
                          {instructor.homeBase} · {instructor.phoneNumber}
                        </p>
                        {instructor.subjects && instructor.subjects.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {instructor.subjects.slice(0, 2).join(', ')}
                            {instructor.subjects.length > 2 && ` 외 ${instructor.subjects.length - 2}개`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatDate(instructor.createdAt)}</p>
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 수업 지원 현황 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HandRaisedIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">수업 지원 대기</h2>
              {stats.pendingApplications > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {stats.pendingApplications}
                </span>
              )}
            </div>
            <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-500">
              전체보기 →
            </Link>
          </div>
          <div className="p-6">
            {pendingApplications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">대기 중인 수업 지원이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingApplications.map((app) => (
                  <li key={app.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/applications?id=${app.id}`} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{app.instructor.name}</p>
                          <span className="text-xs text-gray-400">({app.instructor.grade})</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {app.request.school.name} · {app.request.program?.name || '프로그램 미지정'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {app.request.requestNumber}
                          {app.request.desiredDate && ` · ${new Date(app.request.desiredDate).toLocaleDateString('ko-KR')}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatDate(app.createdAt)}</p>
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 다가오는 일정 및 최근 활동 */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 다가오는 수업 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">다가오는 수업</h2>
            </div>
            <Link href="/schedule" className="text-sm text-blue-600 hover:text-blue-500">
              일정보기 →
            </Link>
          </div>
          <div className="p-6">
            {upcomingClasses.length === 0 ? (
              <p className="text-center text-gray-500 py-4">예정된 수업이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingClasses.map((assignment) => (
                  <li key={assignment.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{assignment.request.school.name}</p>
                          {getStatusBadge(assignment.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {assignment.request.program?.name || '프로그램 미지정'} · {assignment.instructor.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.scheduledDate
                            ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short',
                              })
                            : '날짜 미정'}
                        </p>
                        {assignment.scheduledTime && (
                          <p className="text-xs text-gray-400">{assignment.scheduledTime}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 ? (
              <p className="text-center text-gray-500 py-4">최근 활동이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentActivities.map((activity, idx) => {
                  const data = activity.data as Record<string, unknown>
                  return (
                    <li key={`${activity.type}-${idx}`} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 rounded-full p-1.5 ${
                            activity.type === 'request'
                              ? 'bg-blue-100'
                              : activity.type === 'assignment'
                                ? 'bg-green-100'
                                : 'bg-orange-100'
                          }`}
                        >
                          {activity.type === 'request' ? (
                            <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                          ) : activity.type === 'assignment' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserPlusIcon className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {activity.type === 'request' && (
                            <>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">
                                  {(data.school as { name: string })?.name}
                                </span>
                                에서 새 요청
                              </p>
                              <p className="text-xs text-gray-500">
                                {(data.program as { name: string })?.name || '프로그램 미지정'} · {data.requestNumber as string}
                              </p>
                            </>
                          )}
                          {activity.type === 'assignment' && (
                            <>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">
                                  {(data.instructor as { name: string })?.name}
                                </span>{' '}
                                강사 배정
                              </p>
                              <p className="text-xs text-gray-500">
                                {(data.request as { school: { name: string } })?.school?.name} · {(data.request as { requestNumber: string })?.requestNumber}
                              </p>
                            </>
                          )}
                          {activity.type === 'instructor' && (
                            <>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{data.name as string}</span> 강사{' '}
                                {data.status === 'PENDING' ? '가입 신청' : '등록'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {data.status === 'PENDING' ? '승인 대기 중' : '활동 중'}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-xs text-gray-400">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/requests"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-blue-100 p-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">요청 처리</h3>
              <p className="mt-1 text-sm text-gray-500">학교 요청 확인</p>
            </div>
          </Link>
          <Link
            href="/instructors?status=PENDING"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-orange-100 p-3">
              <UserPlusIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">강사 승인</h3>
              <p className="mt-1 text-sm text-gray-500">
                {stats.pendingInstructors > 0 ? `${stats.pendingInstructors}명 대기` : '대기 없음'}
              </p>
            </div>
          </Link>
          <Link
            href="/applications"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-purple-100 p-3">
              <HandRaisedIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">지원 심사</h3>
              <p className="mt-1 text-sm text-gray-500">
                {stats.pendingApplications > 0 ? `${stats.pendingApplications}건 대기` : '대기 없음'}
              </p>
            </div>
          </Link>
          <Link
            href="/payments"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-yellow-100 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">정산 처리</h3>
              <p className="mt-1 text-sm text-gray-500">월별 정산 관리</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <DashboardCharts data={chartData} />
    </div>
  )
}
