'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import { formatNumber, numberToKorean } from '../../lib/numberToKorean'

export interface QuotationItemData {
  id: string
  itemCode: string
  itemName: string
  specification: string
  quantity: number
  unit: string
  unitPrice: number
  supplyAmount: number
  vat: number
  remark: string
}

export interface QuotationFormData {
  quotationNumber: string
  issueDate: string
  validUntil: string
  clientName: string
  clientAddress: string
  clientContact: string
  clientPhone: string
  clientEmail: string
  title: string
  projectName: string
  notes: string
  items: QuotationItemData[]
  totalSupplyAmount: number
  totalVat: number
  totalAmount: number
}

interface QuotationFormProps {
  initialData?: Partial<QuotationFormData>
  onSubmit: (data: QuotationFormData) => Promise<void>
  onPrint: (data: QuotationFormData) => void
  loading?: boolean
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function generateQuotationNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const seq = '1' // 실제로는 DB에서 당일 마지막 번호 조회
  return `${year}/${month}/${day}-${seq}`
}

function createEmptyItem(): QuotationItemData {
  return {
    id: generateId(),
    itemCode: '',
    itemName: '',
    specification: '',
    quantity: 1,
    unit: '명',
    unitPrice: 0,
    supplyAmount: 0,
    vat: 0,
    remark: '',
  }
}

export default function QuotationForm({
  initialData,
  onSubmit,
  onPrint,
  loading = false,
}: QuotationFormProps) {
  const [formData, setFormData] = useState<QuotationFormData>(() => ({
    quotationNumber: initialData?.quotationNumber || generateQuotationNumber(),
    issueDate: initialData?.issueDate || new Date().toISOString().split('T')[0],
    validUntil: initialData?.validUntil || '',
    clientName: initialData?.clientName || '',
    clientAddress: initialData?.clientAddress || '',
    clientContact: initialData?.clientContact || '',
    clientPhone: initialData?.clientPhone || '',
    clientEmail: initialData?.clientEmail || '',
    title: initialData?.title || '교육 프로그램 견적서',
    projectName: initialData?.projectName || '',
    notes: initialData?.notes || '',
    items: initialData?.items || [createEmptyItem()],
    totalSupplyAmount: initialData?.totalSupplyAmount || 0,
    totalVat: initialData?.totalVat || 0,
    totalAmount: initialData?.totalAmount || 0,
  }))

  // 합계 계산
  const totals = useMemo(() => {
    const totalSupplyAmount = formData.items.reduce((sum, item) => sum + item.supplyAmount, 0)
    const totalVat = formData.items.reduce((sum, item) => sum + item.vat, 0)
    return {
      totalSupplyAmount,
      totalVat,
      totalAmount: totalSupplyAmount + totalVat,
    }
  }, [formData.items])

  // 품목 업데이트
  const updateItem = useCallback((id: string, field: keyof QuotationItemData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item

        const updated = { ...item, [field]: value }

        // 수량 또는 단가 변경 시 공급가액 자동 계산
        if (field === 'quantity' || field === 'unitPrice') {
          updated.supplyAmount = updated.quantity * updated.unitPrice
        }

        return updated
      }),
    }))
  }, [])

  // 품목 추가
  const addItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }))
  }, [])

  // 품목 삭제
  const removeItem = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }))
  }, [])

  // 품목 순서 변경
  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.items.length) return prev

      const items = [...prev.items]
      const temp = items[index]
      items[index] = items[newIndex]
      items[newIndex] = temp
      return { ...prev, items }
    })
  }, [])

  // 폼 필드 업데이트
  const updateField = useCallback((field: keyof QuotationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      ...totals,
    })
  }

  // 인쇄
  const handlePrint = () => {
    onPrint({
      ...formData,
      ...totals,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">견적서 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              일련번호
            </label>
            <input
              type="text"
              value={formData.quotationNumber}
              onChange={e => updateField('quotationNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              견적일자
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={e => updateField('issueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              유효기간
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={e => updateField('validUntil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 거래처 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">거래처 정보</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기관명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={e => updateField('clientName', e.target.value)}
              placeholder="예: 풍천중학교"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <input
              type="text"
              value={formData.clientAddress}
              onChange={e => updateField('clientAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              담당자
            </label>
            <input
              type="text"
              value={formData.clientContact}
              onChange={e => updateField('clientContact', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처
            </label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={e => updateField('clientPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 품목 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">품목 내역</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            품목 추가
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-3 text-left font-medium text-gray-600 w-10">#</th>
                <th className="px-2 py-3 text-left font-medium text-gray-600 w-24">품목코드</th>
                <th className="px-2 py-3 text-left font-medium text-gray-600">품목명</th>
                <th className="px-2 py-3 text-left font-medium text-gray-600 w-24">규격</th>
                <th className="px-2 py-3 text-right font-medium text-gray-600 w-20">수량</th>
                <th className="px-2 py-3 text-left font-medium text-gray-600 w-16">단위</th>
                <th className="px-2 py-3 text-right font-medium text-gray-600 w-28">단가</th>
                <th className="px-2 py-3 text-right font-medium text-gray-600 w-32">공급가액</th>
                <th className="px-2 py-3 text-left font-medium text-gray-600 w-24">비고</th>
                <th className="px-2 py-3 text-center font-medium text-gray-600 w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.itemCode}
                      onChange={e => updateItem(item.id, 'itemCode', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      placeholder="코드"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={e => updateItem(item.id, 'itemName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      placeholder="품목명 입력"
                      required
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.specification}
                      onChange={e => updateItem(item.id, 'specification', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      placeholder="규격"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                      min="1"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={item.unit}
                      onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    >
                      <option value="명">명</option>
                      <option value="반">반</option>
                      <option value="회">회</option>
                      <option value="식">식</option>
                      <option value="개">개</option>
                      <option value="세트">세트</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                      min="0"
                      step="1000"
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-gray-900">
                    {formatNumber(item.supplyAmount)}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.remark}
                      onChange={e => updateItem(item.id, 'remark', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === formData.items.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={formData.items.length === 1}
                        className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 합계 */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-8 text-sm">
              <span className="text-gray-600">공급가액 합계:</span>
              <span className="font-medium text-gray-900 w-32 text-right">
                {formatNumber(totals.totalSupplyAmount)}원
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <span className="text-gray-600">부가세:</span>
              <span className="font-medium text-gray-900 w-32 text-right">
                {formatNumber(totals.totalVat)}원
              </span>
            </div>
            <div className="flex items-center gap-8 text-lg font-semibold border-t border-gray-300 pt-2">
              <span className="text-gray-900">총 합계:</span>
              <span className="text-blue-600 w-32 text-right">
                ₩{formatNumber(totals.totalAmount)}원
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ({numberToKorean(totals.totalAmount)})
            </div>
          </div>
        </div>
      </div>

      {/* 비고 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          비고
        </label>
        <textarea
          value={formData.notes}
          onChange={e => updateField('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="추가 사항을 입력하세요..."
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500"
        >
          인쇄 미리보기
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
