'use client'

import {
  CalendarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

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

interface PaymentCardProps {
  payment: Payment
  onSelect: () => void
  onStatusChange?: (status: string) => void
  onStatement?: () => void
  loading?: boolean
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  CALCULATED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<string, string> = {
  PENDING: '대기중',
  CALCULATED: '계산됨',
  APPROVED: '승인됨',
  PROCESSING: '처리중',
  PAID: '지급완료',
  CANCELLED: '취소됨',
}

const nextStatus: Record<string, string> = {
  PENDING: 'CALCULATED',
  CALCULATED: 'APPROVED',
  APPROVED: 'PROCESSING',
  PROCESSING: 'PAID',
}

const nextStatusLabel: Record<string, string> = {
  PENDING: '계산 완료',
  CALCULATED: '승인',
  APPROVED: '처리 시작',
  PROCESSING: '지급 완료',
}

function formatMoney(value: number): string {
  return Number(value).toLocaleString('ko-KR') + '원'
}

export default function PaymentCard({
  payment,
  onSelect,
  onStatusChange,
  onStatement,
  loading,
}: PaymentCardProps) {
  const schoolName = payment.assignment.request.school.name
  const programName = payment.assignment.request.program?.name || payment.assignment.request.customProgram || '기타'
  const classDate = payment.assignment.scheduledDate
    ? new Date(payment.assignment.scheduledDate).toLocaleDateString('ko-KR')
    : '미정'

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
      onClick={onSelect}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{payment.instructor.name}</h3>
          <p className="text-sm text-gray-600">{schoolName}</p>
          <p className="text-xs text-gray-500">{programName}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[payment.status]}`}>
          {statusLabels[payment.status]}
        </span>
      </div>

      {/* 정산번호 및 날짜 */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="text-xs text-gray-500">{payment.paymentNumber}</span>
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>{classDate} · {payment.sessions}차시</span>
        </div>
      </div>

      {/* 금액 상세 */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">강사비</span>
          <span className="text-gray-900">{formatMoney(payment.sessionFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">교통비</span>
          <span className="text-gray-900">{formatMoney(payment.transportFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">소계</span>
          <span className="text-gray-900">{formatMoney(payment.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-red-600">
          <span>원천징수 (3.3%)</span>
          <span>-{formatMoney(payment.taxWithholding)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
          <span className="text-gray-700">실수령액</span>
          <span className="text-green-600">{formatMoney(payment.netAmount)}</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        {onStatement && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatement() }}
            className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
          >
            <DocumentTextIcon className="h-4 w-4" />
            정산서
          </button>
        )}
        {nextStatus[payment.status] && onStatusChange && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange(nextStatus[payment.status]) }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? (
              <span>처리중...</span>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                {nextStatusLabel[payment.status]}
              </>
            )}
          </button>
        )}
      </div>

      {/* 지급 완료 표시 */}
      {payment.status === 'PAID' && payment.paidAt && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600 pt-1">
          <CheckCircleIcon className="h-4 w-4" />
          <span>{new Date(payment.paidAt).toLocaleDateString('ko-KR')} 지급</span>
        </div>
      )}
    </div>
  )
}
