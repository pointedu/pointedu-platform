export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import PaymentList from './PaymentList'
import { serializeDecimalArray } from '../../lib/utils'

async function getPayments() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        instructor: true,
        assignment: {
          include: {
            request: {
              include: {
                school: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })
    return serializeDecimalArray(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return []
  }
}

export default async function PaymentsPage() {
  const payments = await getPayments()

  const summary = {
    total: payments.length,
    pending: payments.filter((p: any) => ['PENDING', 'CALCULATED'].includes(p.status)).length,
    approved: payments.filter((p: any) => p.status === 'APPROVED').length,
    paid: payments.filter((p: any) => p.status === 'PAID').length,
    totalAmount: payments.reduce((sum: number, p: any) => sum + Number(p.netAmount || 0), 0),
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">정산 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            강사 정산 내역 {payments.length}건을 확인하고 관리합니다.
          </p>
        </div>
      </div>

      <PaymentList initialPayments={payments as any} summary={summary} />
    </div>
  )
}
