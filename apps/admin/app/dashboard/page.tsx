export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import dynamicImport from 'next/dynamic'
import {
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
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
      totalPayments,
      paidPayments,
    ] = await Promise.all([
      prisma.schoolRequest.count(),
      prisma.schoolRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.instructor.count(),
      prisma.instructor.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
    ])

    return {
      totalRequests,
      pendingRequests,
      totalInstructors,
      activeInstructors,
      totalPayments,
      paidPayments,
      connected: true,
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      totalRequests: 0,
      pendingRequests: 0,
      totalInstructors: 0,
      activeInstructors: 0,
      totalPayments: 0,
      paidPayments: 0,
      connected: false,
    }
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

export default async function DashboardPage() {
  const [stats, chartData] = await Promise.all([getDashboardStats(), getChartData()])

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
      value: stats.totalRequests > 0
        ? `${Math.round(((stats.totalRequests - stats.pendingRequests) / stats.totalRequests) * 100)}%`
        : '0%',
      subtext: '전체 요청 기준',
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      href: '/requests',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-sm text-gray-600">
          Point Education 관리자 대시보드에 오신 것을 환영합니다.
        </p>
      </div>

      {/* DB Connection Status */}
      {!stats.connected && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                데이터베이스 연결 대기 중
              </p>
              <p className="text-xs text-yellow-600">
                테스트 데이터를 생성하거나 데이터베이스 연결을 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <a
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
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {card.name}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {card.value}
                    </dd>
                    <dd className="mt-1 text-sm text-gray-500">{card.subtext}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/requests"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-blue-100 p-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">새 요청 처리</h3>
              <p className="mt-1 text-sm text-gray-500">
                학교 요청을 확인하고 자동으로 처리
              </p>
            </div>
          </a>
          <a
            href="/instructors"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-green-100 p-3">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">강사 관리</h3>
              <p className="mt-1 text-sm text-gray-500">
                강사 정보 관리 및 일정 확인
              </p>
            </div>
          </a>
          <a
            href="/payments"
            className="flex items-center gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="rounded-lg bg-yellow-100 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">정산 처리</h3>
              <p className="mt-1 text-sm text-gray-500">
                월별 정산 및 강사 급여 처리
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* Charts Section */}
      <DashboardCharts data={chartData} />
    </div>
  )
}
