'use client'

import { useState, useRef } from 'react'
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import Modal from '../../../components/Modal'
import PaymentStatement from '../../payments/PaymentStatement'

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

interface Instructor {
  id: string
  name: string
  phoneNumber?: string
  bankAccount?: string
  residentNumber?: string
}

interface PaymentHistoryProps {
  payments: Payment[]
  instructor: Instructor
}

const statusLabels: Record<string, string> = {
  APPROVED: '승인됨',
  PROCESSING: '처리중',
  PAID: '지급완료',
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
}

export default function PaymentHistory({ payments, instructor }: PaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const statementRef = useRef<HTMLDivElement>(null)

  // 월별 그룹화
  const groupedPayments = payments.reduce((acc, payment) => {
    const month = payment.accountingMonth
    if (!acc[month]) {
      acc[month] = []
    }
    acc[month].push(payment)
    return acc
  }, {} as Record<string, Payment[]>)

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}년 ${month}월`
  }

  const openStatement = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsModalOpen(true)
  }

  const handlePrint = () => {
    const printContent = statementRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>정산서 - ${selectedPayment?.paymentNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
            table { border-collapse: collapse; }
            @media print { body { padding: 0; } }
          </style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          ${printContent.innerHTML}
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // 월별 합계 계산
  const calculateMonthlyTotal = (monthPayments: Payment[]) => {
    return monthPayments.reduce((sum, p) => sum + Number(p.netAmount), 0)
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">정산 내역이 없습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          수업 완료 후 정산 내역이 여기에 표시됩니다.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedPayments)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, monthPayments]) => (
            <div key={month} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 월별 헤더 */}
              <div
                className="flex justify-between items-center px-6 py-4 bg-gray-50 cursor-pointer"
                onClick={() => setExpandedId(expandedId === month ? null : month)}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatMonth(month)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {monthPayments.length}건
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-blue-600">
                    {calculateMonthlyTotal(monthPayments).toLocaleString()}원
                  </span>
                  {expandedId === month ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* 월별 상세 내역 */}
              {expandedId === month && (
                <div className="divide-y divide-gray-200">
                  {monthPayments.map((payment) => (
                    <div key={payment.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {payment.assignment.request.school.name}
                            </h4>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[payment.status]}`}
                            >
                              {statusLabels[payment.status]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {payment.assignment.request.program?.name ||
                              payment.assignment.request.customProgram}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {payment.sessions}차시 | {payment.paymentNumber}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {Number(payment.netAmount).toLocaleString()}원
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (원천징수 후)
                          </p>
                        </div>
                      </div>

                      {/* 세부 내역 */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">강사비</span>
                          <p className="font-medium">
                            {Number(payment.sessionFee).toLocaleString()}원
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">교통비</span>
                          <p className="font-medium">
                            {Number(payment.transportFee).toLocaleString()}원
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">소계</span>
                          <p className="font-medium">
                            {Number(payment.subtotal).toLocaleString()}원
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">원천징수 (3.3%)</span>
                          <p className="font-medium text-red-600">
                            -{Number(payment.taxWithholding).toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      {/* 정산서 보기 버튼 */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => openStatement(payment)}
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                          정산서 보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* 정산서 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="강사비 정산서"
        size="xl"
      >
        {selectedPayment && (
          <div>
            <div className="flex justify-end mb-4 border-b pb-4">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <PrinterIcon className="h-4 w-4" />
                인쇄
              </button>
            </div>

            <div className="overflow-auto max-h-[70vh]">
              <PaymentStatement
                ref={statementRef}
                payment={{
                  ...selectedPayment,
                  instructor: {
                    id: instructor.id,
                    name: instructor.name,
                    phoneNumber: instructor.phoneNumber,
                    bankAccount: instructor.bankAccount,
                    residentNumber: instructor.residentNumber,
                  },
                  assignment: {
                    scheduledDate: selectedPayment.assignment.scheduledDate || undefined,
                    request: selectedPayment.assignment.request,
                  },
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
