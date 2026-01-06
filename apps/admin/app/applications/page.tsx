export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import ApplicationList from './ApplicationList'
import { serializeDecimalArray } from '../../lib/utils'

async function getApplications() {
  try {
    const data = await prisma.classApplication.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            subjects: true,
            homeBase: true,
          }
        },
        request: {
          include: {
            school: {
              select: { name: true, address: true }
            },
            program: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    // Serialize Decimal values for client component
    return serializeDecimalArray(data)
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    return []
  }
}

async function getStats() {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.classApplication.count({ where: { status: 'PENDING' } }),
      prisma.classApplication.count({ where: { status: 'APPROVED' } }),
      prisma.classApplication.count({ where: { status: 'REJECTED' } }),
      prisma.classApplication.count(),
    ])
    return { pending, approved, rejected, total }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return { pending: 0, approved: 0, rejected: 0, total: 0 }
  }
}

export default async function ApplicationsPage() {
  const [applications, stats] = await Promise.all([
    getApplications(),
    getStats()
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">수업 지원 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          강사들의 수업 지원 신청을 확인하고 승인/거절합니다.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-500">전체 지원</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-6 shadow">
          <p className="text-sm font-medium text-yellow-700">대기중</p>
          <p className="mt-2 text-3xl font-semibold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-6 shadow">
          <p className="text-sm font-medium text-green-700">승인됨</p>
          <p className="mt-2 text-3xl font-semibold text-green-900">{stats.approved}</p>
        </div>
        <div className="rounded-lg bg-red-50 p-6 shadow">
          <p className="text-sm font-medium text-red-700">거절됨</p>
          <p className="mt-2 text-3xl font-semibold text-red-900">{stats.rejected}</p>
        </div>
      </div>

      <ApplicationList initialApplications={applications as any} />
    </div>
  )
}
