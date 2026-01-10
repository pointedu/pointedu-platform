'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { formatNumber } from '../../lib/numberToKorean'

interface QuotationItem {
  id: string
  itemName: string
  quantity: number
  supplyAmount: number
}

interface Quotation {
  id: string
  quotationNumber: string
  issueDate: string
  clientName: string
  projectName: string | null
  totalAmount: number
  status: string
  items: QuotationItem[]
  createdAt: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  ISSUED: 'bg-blue-100 text-blue-800 border-blue-200',
  SENT: 'bg-purple-100 text-purple-800 border-purple-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const statusLabels: Record<string, string> = {
  DRAFT: '임시저장',
  ISSUED: '발행됨',
  SENT: '발송됨',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
}

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchQuotations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/quotations?${params.toString()}`)
      const data = await response.json()
      setQuotations(data.quotations || [])
    } catch (error) {
      console.error('Failed to fetch quotations:', error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">견적서 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                총 {quotations.length}건의 견적서
              </p>
            </div>
            <button
              onClick={() => router.push('/quotes/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500"
            >
              <PlusIcon className="h-5 w-5" />
              새 견적서
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="기관명, 견적번호 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 상태</option>
              <option value="DRAFT">임시저장</option>
              <option value="ISSUED">발행됨</option>
              <option value="SENT">발송됨</option>
              <option value="ACCEPTED">수락됨</option>
              <option value="REJECTED">거절됨</option>
              <option value="EXPIRED">만료됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-20">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              견적서가 없습니다
            </h3>
            <p className="text-gray-500 mb-4">
              새 견적서를 작성해보세요.
            </p>
            <button
              onClick={() => router.push('/quotes/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500"
            >
              <PlusIcon className="h-5 w-5" />
              새 견적서 작성
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.map(quotation => (
              <div
                key={quotation.id}
                onClick={() => router.push(`/quotes/${quotation.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {quotation.clientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[quotation.status]}`}>
                          {statusLabels[quotation.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {quotation.quotationNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      ₩{formatNumber(quotation.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {quotation.items.length}개 품목
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(quotation.issueDate)}</span>
                  </div>
                  {quotation.projectName && (
                    <div className="flex items-center gap-1">
                      <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-[200px]">{quotation.projectName}</span>
                    </div>
                  )}
                </div>

                {/* 품목 미리보기 */}
                {quotation.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {quotation.items.slice(0, 3).map(item => (
                        <span
                          key={item.id}
                          className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                        >
                          {item.itemName} ({item.quantity}명)
                        </span>
                      ))}
                      {quotation.items.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                          +{quotation.items.length - 3}개
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
