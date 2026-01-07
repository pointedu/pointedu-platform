export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { serializeDecimal } from '../../../lib/utils'
import PaymentHistory from './PaymentHistory'

// Serialized types for client components (Decimal -> number, Date -> string)
type SerializedPayment = {
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

type SerializedInstructor = {
  id: string
  name: string
  phoneNumber?: string
  bankAccount?: string
  residentNumber?: string
}

async function getInstructorPayments(userId: string): Promise<{
  payments: SerializedPayment[]
  instructor: SerializedInstructor | null
}> {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
    })

    if (!instructor) {
      return { payments: [], instructor: null }
    }

    // 정산 내역 조회 (지급 완료 또는 승인된 것만)
    const payments = await prisma.payment.findMany({
      where: {
        instructorId: instructor.id,
        status: {
          in: ['PENDING', 'CALCULATED', 'APPROVED', 'PROCESSING', 'PAID'],
        },
      },
      include: {
        assignment: {
          select: {
            scheduledDate: true,
            request: {
              include: {
                school: true,
                program: true,
              },
            },
          },
        },
      },
      orderBy: { accountingMonth: 'desc' },
    })

    // serializeDecimal converts Decimal to number and Date to string at runtime
    return {
      payments: serializeDecimal(payments) as unknown as SerializedPayment[],
      instructor: serializeDecimal(instructor) as unknown as SerializedInstructor,
    }
  } catch (error) {
    console.error('Failed to fetch instructor payments:', error)
    return { payments: [], instructor: null }
  }
}

export default async function InstructorPaymentsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const { payments, instructor } = await getInstructorPayments(userId)

  if (!instructor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">강사 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  // 현재 월 계산 (매달 10일 이후에만 이번 달 정산 표시)
  const today = new Date()
  const currentDay = today.getDate()
  const showCurrentMonth = currentDay >= 10

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">정산 내역</h1>
        <p className="mt-1 text-sm text-gray-600">
          매월 10일에 전월 강사비 정산 내역이 확정됩니다.
        </p>
      </div>

      {!showCurrentMonth && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            이번 달 정산 내역은 10일 이후에 확인하실 수 있습니다.
          </p>
        </div>
      )}

      <PaymentHistory payments={payments} instructor={instructor} />
    </div>
  )
}
