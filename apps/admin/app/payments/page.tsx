export const revalidate = 60 // Revalidate every 60 seconds

import { prisma } from '@pointedu/database'
import PaymentList from './PaymentList'
import { serializeDecimalArray } from '../../lib/utils'

interface Payment {
  id: string
  paymentNumber: string
  accountingMonth: string
  sessions: number
  sessionFee: number
  transportFee: number
  bonus?: number
  subtotal: number
  taxWithholding: number
  deductions?: number
  netAmount: number
  status: string
  paidAt?: string | null
  instructor: {
    id: string
    name: string
    phoneNumber?: string | null
    bankName?: string | null
    accountNumber?: string | null
    bankAccount?: string | null
    residentNumber?: string | null
  }
  assignment: {
    scheduledDate?: string | null
    request: {
      school: { name: string }
      program?: { name: string } | null
      customProgram?: string | null
      sessions: number
    }
  }
}

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
  const rawPayments = await getPayments()
  const payments = rawPayments as unknown as Payment[]

  const summary = {
    total: payments.length,
    pending: payments.filter((p) => ['PENDING', 'CALCULATED'].includes(p.status)).length,
    approved: payments.filter((p) => p.status === 'APPROVED').length,
    paid: payments.filter((p) => p.status === 'PAID').length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.netAmount || 0), 0),
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

      <PaymentList initialPayments={payments} summary={summary} />
    </div>
  )
}
