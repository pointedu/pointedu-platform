'use client'

import { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PrinterIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'
import Modal from '../../components/Modal'
import PaymentStatement from './PaymentStatement'
import ExportButton from '../../components/ExportButton'
import { exportToExcel, paymentExcelConfig } from '../../lib/excel'
import ResponsiveList from '../../components/ResponsiveList'
import PaymentCard from '../../components/cards/PaymentCard'

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

interface PaymentListProps {
  initialPayments: Payment[]
  summary: {
    total: number
    pending: number
    approved: number
    paid: number
    totalAmount: number
  }
}

const statusLabels: Record<string, string> = {
  PENDING: '대기중',
  CALCULATED: '계산됨',
  APPROVED: '승인됨',
  PROCESSING: '처리중',
  PAID: '지급완료',
  CANCELLED: '취소됨',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  CALCULATED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
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

export default function PaymentList({ initialPayments, summary }: PaymentListProps) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()

  // initialPayments가 변경되면 상태 업데이트
  useEffect(() => {
    setPayments(initialPayments)
  }, [initialPayments])
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 정산서 모달
  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [statementPayment, setStatementPayment] = useState<Payment | null>(null)
  const statementRef = useRef<HTMLDivElement>(null)

  // 정산서 열기
  const openStatement = (payment: Payment) => {
    setStatementPayment(payment)
    setIsStatementOpen(true)
  }

  // 정산서 인쇄
  const handlePrintStatement = () => {
    const printContent = statementRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>정산서 - ${statementPayment?.paymentNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
            table { border-collapse: collapse; }
            @media print {
              body { padding: 0; }
            }
          </style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // 카카오톡 알림 발송 (이미지 생성 후 발송 안내)
  const handleSendKakao = async () => {
    if (!statementPayment) return

    // 실제 카카오톡 API 연동 전까지는 안내 메시지
    const confirmed = window.confirm(
      `${statementPayment.instructor.name} 강사님에게 정산서를 카카오톡으로 발송하시겠습니까?\n\n` +
      `연락처: ${statementPayment.instructor.phoneNumber || '미등록'}\n` +
      `금액: ${Number(statementPayment.netAmount).toLocaleString()}원`
    )

    if (confirmed) {
      try {
        // 알림톡 발송 API 호출
        const res = await fetch('/api/notifications/kakao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'PAYMENT_STATEMENT',
            paymentId: statementPayment.id,
            instructorId: statementPayment.instructor.id,
            phoneNumber: statementPayment.instructor.phoneNumber,
          }),
        })

        if (res.ok) {
          alert('카카오톡 알림이 발송되었습니다.')
        } else {
          // 알림톡 API가 없는 경우 안내
          alert(
            '카카오톡 알림톡 발송 기능이 준비중입니다.\n\n' +
            '현재는 정산서를 인쇄하여 직접 전달하거나,\n' +
            '정산서 이미지를 캡처하여 카카오톡으로 전송해주세요.'
          )
        }
      } catch (_error) {
        alert(
          '카카오톡 알림톡 발송 기능이 준비중입니다.\n\n' +
          '현재는 정산서를 인쇄하여 직접 전달하거나,\n' +
          '정산서 이미지를 캡처하여 카카오톡으로 전송해주세요.'
        )
      }
    }
  }

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    setLoading(id)

    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        startTransition(() => {
          setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update payment status:', error)
    } finally {
      setLoading(null)
    }
  }, [router])

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return

    setLoading('bulk')

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/payments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'APPROVED' }),
          })
        )
      )

      setSelectedIds([])
      router.refresh()
    } catch (error) {
      console.error('Failed to bulk approve:', error)
    } finally {
      setLoading(null)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pendingIds = payments
      .filter((p) => ['PENDING', 'CALCULATED'].includes(p.status))
      .map((p) => p.id)

    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingIds)
    }
  }

  const openDetail = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailOpen(true)
  }

  const handleExportExcel = () => {
    const exportData = payments.map(payment => ({
      instructorName: payment.instructor.name,
      schoolName: payment.assignment.request.school.name,
      programName: payment.assignment.request.program?.name || payment.assignment.request.customProgram || '',
      classDate: payment.assignment.scheduledDate || '',
      sessions: payment.sessions,
      instructorFee: payment.sessionFee,
      transportFee: payment.transportFee,
      totalAmount: payment.subtotal,
      netAmount: payment.netAmount,
      statusLabel: statusLabels[payment.status] || payment.status,
      paidAt: payment.paidAt || '',
    }))
    exportToExcel({
      filename: '정산목록',
      sheetName: '정산',
      columns: paymentExcelConfig,
      data: exportData,
    })
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-500">전체 정산</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.total}건</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-500">대기중</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">{summary.pending}건</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-500">승인됨</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{summary.approved}건</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-500">지급완료</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{summary.paid}건</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <p className="text-sm text-gray-500">총 정산액</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {summary.totalAmount.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-4 flex justify-end">
        <ExportButton onClick={handleExportExcel} />
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-blue-50 p-4">
          <span className="text-sm text-blue-800">{selectedIds.length}건 선택됨</span>
          <button
            onClick={handleBulkApprove}
            disabled={loading === 'bulk'}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            일괄 승인
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            선택 해제
          </button>
        </div>
      )}

      <ResponsiveList
        mobileView={
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-xl shadow-sm">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">정산 내역이 없습니다</h3>
              </div>
            ) : (
              payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onSelect={() => openDetail(payment)}
                  onStatusChange={(status) => handleStatusChange(payment.id, status)}
                  onStatement={() => openStatement(payment)}
                  loading={loading === payment.id}
                />
              ))
            )}
          </div>
        }
      >
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length ===
                        payments.filter((p) => ['PENDING', 'CALCULATED'].includes(p.status)).length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  정산번호
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  강사
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  학교
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  총액
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  실수령액
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  상태
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">정산 내역이 없습니다</h3>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      {['PENDING', 'CALCULATED'].includes(payment.status) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(payment.id)}
                          onChange={() => toggleSelection(payment.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      {payment.paymentNumber}
                      <div className="text-xs text-gray-500">{payment.accountingMonth}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {payment.instructor.name}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {payment.assignment.request.school.name}
                      <div className="text-xs text-gray-500">{payment.sessions}차시</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                      {Number(payment.subtotal).toLocaleString()}원
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-semibold text-gray-900">
                      {Number(payment.netAmount).toLocaleString()}원
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[payment.status]}`}
                      >
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                      <button
                        onClick={() => openDetail(payment)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        상세
                      </button>
                      <button
                        onClick={() => openStatement(payment)}
                        className="text-purple-600 hover:text-purple-900 mr-2"
                        title="정산서 보기"
                      >
                        <DocumentTextIcon className="h-4 w-4 inline" />
                      </button>
                      {nextStatus[payment.status] && (
                        <button
                          onClick={() => handleStatusChange(payment.id, nextStatus[payment.status])}
                          disabled={loading === payment.id}
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {loading === payment.id ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                          {nextStatusLabel[payment.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ResponsiveList>

      {/* Detail Modal */}
      <FormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="정산 상세"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">정산번호</p>
                <p className="font-semibold">{selectedPayment.paymentNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">정산월</p>
                <p className="font-semibold">{selectedPayment.accountingMonth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">강사</p>
                <p className="font-semibold">{selectedPayment.instructor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">학교</p>
                <p className="font-semibold">{selectedPayment.assignment.request.school.name}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">금액 내역</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">강사비 ({selectedPayment.sessions}차시)</span>
                  <span>{Number(selectedPayment.sessionFee).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">교통비</span>
                  <span>{Number(selectedPayment.transportFee).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">소계</span>
                  <span className="font-medium">{Number(selectedPayment.subtotal).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>원천징수 (3.3%)</span>
                  <span>-{Number(selectedPayment.taxWithholding).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>실수령액</span>
                  <span>{Number(selectedPayment.netAmount).toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {selectedPayment.instructor.bankName && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">입금 정보</h4>
                <div className="text-sm text-gray-600">
                  <p>{selectedPayment.instructor.bankName} {selectedPayment.instructor.accountNumber}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t pt-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusColors[selectedPayment.status]}`}
              >
                {statusLabels[selectedPayment.status]}
              </span>

              <div className="flex gap-3">
                {selectedPayment.status !== 'PAID' && selectedPayment.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange(selectedPayment.id, 'CANCELLED')}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    취소
                  </button>
                )}
                {nextStatus[selectedPayment.status] && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedPayment.id, nextStatus[selectedPayment.status])
                      setIsDetailOpen(false)
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {nextStatusLabel[selectedPayment.status]}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </FormModal>

      {/* 정산서 모달 */}
      <Modal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        title="강사비 정산서"
        size="xl"
      >
        {statementPayment && (
          <div>
            {/* 버튼 영역 */}
            <div className="flex justify-end gap-3 mb-4 border-b pb-4">
              <button
                onClick={handlePrintStatement}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <PrinterIcon className="h-4 w-4" />
                인쇄
              </button>
              <button
                onClick={handleSendKakao}
                className="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                카카오톡 발송
              </button>
            </div>

            {/* 정산서 내용 */}
            <div className="overflow-auto max-h-[70vh]">
              <PaymentStatement
                ref={statementRef}
                payment={{
                  ...statementPayment,
                  instructor: {
                    ...statementPayment.instructor,
                    phoneNumber: statementPayment.instructor.phoneNumber || undefined,
                    bankAccount: statementPayment.instructor.bankAccount || undefined,
                    residentNumber: statementPayment.instructor.residentNumber || undefined,
                  },
                  assignment: {
                    scheduledDate: statementPayment.assignment.scheduledDate || undefined,
                    request: statementPayment.assignment.request,
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
