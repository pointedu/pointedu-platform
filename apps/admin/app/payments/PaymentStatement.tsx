'use client'

import { forwardRef } from 'react'

interface PaymentStatementProps {
  payment: {
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
      phoneNumber?: string
      bankAccount?: string
      residentNumber?: string
    }
    assignment: {
      request: {
        school: { name: string }
        program?: { name: string } | null
        customProgram?: string | null
        sessions: number
      }
      scheduledDate?: string | null
    }
  }
  companyInfo?: {
    name: string
    ceo: string
    address: string
    tel: string
    bizNumber: string
  }
}

const defaultCompanyInfo = {
  name: '(주)포인트에듀',
  ceo: '대표자',
  address: '경상북도 영주시',
  tel: '054-000-0000',
  bizNumber: '000-00-00000',
}

const PaymentStatement = forwardRef<HTMLDivElement, PaymentStatementProps>(
  ({ payment, companyInfo = defaultCompanyInfo }, ref) => {
    const formatDate = (dateStr?: string | null) => {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleDateString('ko-KR')
    }

    const formatMonth = (monthStr: string) => {
      const [year, month] = monthStr.split('-')
      return `${year}년 ${month}월`
    }

    // 주민번호 마스킹 (앞 6자리 + 뒤 1자리만 표시)
    const maskResidentNumber = (num?: string) => {
      if (!num) return '-'
      if (num.length >= 7) {
        return num.slice(0, 6) + '-' + num[7] + '******'
      }
      return num.slice(0, 6) + '-*******'
    }

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[800px] mx-auto"
        style={{ fontFamily: 'Malgun Gothic, sans-serif' }}
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">강 사 비 정 산 서</h1>
          <p className="text-gray-600">{formatMonth(payment.accountingMonth)} 정산</p>
        </div>

        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* 수령인 정보 */}
          <div className="border p-4">
            <h3 className="font-bold text-sm mb-3 border-b pb-2">수령인 정보</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600 w-24">성명</td>
                  <td className="py-1 font-medium">{payment.instructor.name}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">주민번호</td>
                  <td className="py-1">{maskResidentNumber(payment.instructor.residentNumber)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">연락처</td>
                  <td className="py-1">{payment.instructor.phoneNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">계좌정보</td>
                  <td className="py-1">{payment.instructor.bankAccount || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 지급처 정보 */}
          <div className="border p-4">
            <h3 className="font-bold text-sm mb-3 border-b pb-2">지급처 정보</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600 w-24">상호</td>
                  <td className="py-1 font-medium">{companyInfo.name}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">대표자</td>
                  <td className="py-1">{companyInfo.ceo}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">사업자번호</td>
                  <td className="py-1">{companyInfo.bizNumber}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">연락처</td>
                  <td className="py-1">{companyInfo.tel}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 수업 정보 */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-3">수업 정보</h3>
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-left">학교명</th>
                <th className="border px-3 py-2 text-left">프로그램</th>
                <th className="border px-3 py-2 text-center">차시</th>
                <th className="border px-3 py-2 text-center">수업일</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2">{payment.assignment.request.school.name}</td>
                <td className="border px-3 py-2">
                  {payment.assignment.request.program?.name || payment.assignment.request.customProgram}
                </td>
                <td className="border px-3 py-2 text-center">{payment.sessions}차시</td>
                <td className="border px-3 py-2 text-center">
                  {formatDate(payment.assignment.scheduledDate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 정산 내역 */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-3">정산 내역</h3>
          <table className="w-full text-sm border">
            <tbody>
              <tr>
                <td className="border px-3 py-2 bg-gray-50 w-1/3">강사비</td>
                <td className="border px-3 py-2 text-right">
                  {Number(payment.sessionFee).toLocaleString()}원
                </td>
              </tr>
              <tr>
                <td className="border px-3 py-2 bg-gray-50">교통비</td>
                <td className="border px-3 py-2 text-right">
                  {Number(payment.transportFee).toLocaleString()}원
                </td>
              </tr>
              {Number(payment.bonus || 0) > 0 && (
                <tr>
                  <td className="border px-3 py-2 bg-gray-50">보너스/인센티브</td>
                  <td className="border px-3 py-2 text-right">
                    {Number(payment.bonus).toLocaleString()}원
                  </td>
                </tr>
              )}
              <tr className="font-medium">
                <td className="border px-3 py-2 bg-gray-100">소계</td>
                <td className="border px-3 py-2 text-right bg-gray-100">
                  {Number(payment.subtotal).toLocaleString()}원
                </td>
              </tr>
              <tr className="text-red-600">
                <td className="border px-3 py-2 bg-gray-50">원천징수 (3.3%)</td>
                <td className="border px-3 py-2 text-right">
                  -{Number(payment.taxWithholding).toLocaleString()}원
                </td>
              </tr>
              {Number(payment.deductions || 0) > 0 && (
                <tr className="text-red-600">
                  <td className="border px-3 py-2 bg-gray-50">기타 공제</td>
                  <td className="border px-3 py-2 text-right">
                    -{Number(payment.deductions).toLocaleString()}원
                  </td>
                </tr>
              )}
              <tr className="font-bold text-lg">
                <td className="border px-3 py-3 bg-blue-50">실수령액</td>
                <td className="border px-3 py-3 text-right bg-blue-50 text-blue-700">
                  {Number(payment.netAmount).toLocaleString()}원
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내사항 */}
        <div className="mb-8 text-sm text-gray-600 bg-gray-50 p-4 rounded">
          <p className="font-medium mb-2">안내사항</p>
          <ul className="list-disc list-inside space-y-1">
            <li>본 정산서는 {formatMonth(payment.accountingMonth)} 강사비 정산 내역입니다.</li>
            <li>원천징수 3.3%가 공제된 금액이 실수령액으로 지급됩니다.</li>
            <li>문의사항은 담당자에게 연락 바랍니다.</li>
          </ul>
        </div>

        {/* 발행 정보 */}
        <div className="text-center text-sm text-gray-500 border-t pt-4">
          <p>발행일: {new Date().toLocaleDateString('ko-KR')}</p>
          <p className="mt-1">{companyInfo.name}</p>
        </div>
      </div>
    )
  }
)

PaymentStatement.displayName = 'PaymentStatement'

export default PaymentStatement
