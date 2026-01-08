'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentDuplicateIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'

interface Quote {
  id: string
  quoteNumber: string
  sessionFee: number
  transportFee: number
  materialCost: number
  marginRate: number
  finalTotal: number
  validUntil: string
  status: string
  request: {
    id: string
    school: { name: string }
    program?: { name: string } | null
    customProgram?: string | null
    sessions: number
    studentCount: number
  }
}

interface Request {
  id: string
  school: { name: string }
  program?: { name: string } | null
  customProgram?: string | null
  sessions: number
  studentCount: number
  status: string
}

interface TransportSettings {
  transport_0_20: string
  transport_20_40: string
  transport_40_60: string
  transport_60_80: string
  transport_80_plus: string
}

interface QuoteListProps {
  initialQuotes: Quote[]
  pendingRequests: Request[]
  transportSettings?: TransportSettings
}

const statusLabels: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '발송됨',
  ACCEPTED: '승인됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
}

const defaultTransportSettings: TransportSettings = {
  transport_0_20: '0',
  transport_20_40: '15000',
  transport_40_60: '25000',
  transport_60_80: '35000',
  transport_80_plus: '45000',
}

function calculateTransportFee(distanceKm: number, settings: TransportSettings): number {
  if (distanceKm <= 20) return parseInt(settings.transport_0_20) || 0
  if (distanceKm <= 40) return parseInt(settings.transport_20_40) || 15000
  if (distanceKm <= 60) return parseInt(settings.transport_40_60) || 25000
  if (distanceKm <= 80) return parseInt(settings.transport_60_80) || 35000
  return parseInt(settings.transport_80_plus) || 45000
}

export default function QuoteList({ initialQuotes, pendingRequests, transportSettings }: QuoteListProps) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // initialQuotes가 변경되면 상태 업데이트
  useEffect(() => {
    setQuotes(initialQuotes)
  }, [initialQuotes])
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string>('')
  const settings = transportSettings || defaultTransportSettings
  const [formData, setFormData] = useState({
    distanceKm: '',
    sessionFee: '',
    transportFee: '',
    materialCost: '',
    margin: '15',
    validDays: '30',
    notes: '',
  })

  const resetForm = () => {
    setFormData({ distanceKm: '', sessionFee: '', transportFee: '', materialCost: '', margin: '15', validDays: '30', notes: '' })
    setSelectedRequest('')
    setEditingQuote(null)
  }

  const handleDistanceChange = (value: string) => {
    const distance = parseInt(value) || 0
    const transportFee = calculateTransportFee(distance, settings)
    setFormData(prev => ({ ...prev, distanceKm: value, transportFee: transportFee.toString() }))
  }

  const openCreateModal = () => { resetForm(); setIsModalOpen(true) }

  const openEditModal = (quote: Quote) => {
    setEditingQuote(quote)
    setSelectedRequest(quote.request.id)
    const marginPercent = (quote.marginRate * 100).toString()
    setFormData({ distanceKm: '', sessionFee: quote.sessionFee.toString(), transportFee: quote.transportFee.toString(), materialCost: quote.materialCost.toString(), margin: marginPercent, validDays: '30', notes: '' })
    setIsModalOpen(true)
  }

  const calculateTotal = () => {
    const sessionFee = parseFloat(formData.sessionFee) || 0
    const transportFee = parseFloat(formData.transportFee) || 0
    const materialCost = parseFloat(formData.materialCost) || 0
    const margin = parseFloat(formData.margin) || 15
    const subtotal = sessionFee + transportFee + materialCost
    return subtotal + subtotal * (margin / 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingQuote ? `/api/quotes/${editingQuote.id}` : '/api/quotes'
      const method = editingQuote ? 'PATCH' : 'POST'
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + parseInt(formData.validDays))
      const marginRate = parseFloat(formData.margin) / 100
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequest, sessionFee: parseFloat(formData.sessionFee), transportFee: parseFloat(formData.transportFee), materialCost: parseFloat(formData.materialCost), marginRate, validUntil: validUntil.toISOString(), notes: formData.notes }),
      })
      if (res.ok) { setIsModalOpen(false); resetForm(); router.refresh() }
      else { const errorData = await res.json(); console.error('Quote save error:', errorData); alert('저장 실패: ' + (errorData.error || '알 수 없는 오류')) }
    } catch (error) { console.error('Failed to save quote:', error); alert('견적 저장 중 오류가 발생했습니다.') }
    finally { setLoading(false) }
  }

  const handleDownloadPdf = async (quoteId: string, quoteNumber: string, schoolName: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`)
      if (!response.ok) throw new Error('PDF 생성 실패')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `견적서_${quoteNumber}_${schoolName}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) { console.error('PDF download error:', error); alert('PDF 다운로드 중 오류가 발생했습니다.') }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={openCreateModal} disabled={pendingRequests.length === 0} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          <PlusIcon className="h-5 w-5" />견적 작성
        </button>
      </div>
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">견적번호</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">학교</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">프로그램</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">강사비</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">교통비</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">최종 금액</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">상태</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">유효기한</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center"><DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-semibold text-gray-900">견적이 없습니다</h3><p className="mt-1 text-sm text-gray-500">학교 요청에 대한 견적을 작성해주세요.</p></td></tr>
            ) : quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{quote.quoteNumber}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{quote.request.school.name}</td>
                <td className="px-3 py-4 text-sm text-gray-900">{quote.request.program?.name || quote.request.customProgram}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">{Number(quote.sessionFee).toLocaleString()}원</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">{Number(quote.transportFee).toLocaleString()}원</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-semibold text-gray-900">{Number(quote.finalTotal).toLocaleString()}원</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[quote.status]}`}>{statusLabels[quote.status]}</span></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{new Date(quote.validUntil).toLocaleDateString('ko-KR')}</td>
                <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                  <button onClick={() => openEditModal(quote)} className="text-blue-600 hover:text-blue-900 mr-2" title="수정"><PencilIcon className="h-4 w-4" /></button>
                  <button className="text-gray-600 hover:text-gray-900 mr-2" title="미리보기"><EyeIcon className="h-4 w-4" /></button>
                  <button className="text-gray-600 hover:text-gray-900" title="인쇄"><PrinterIcon className="h-4 w-4" /></button>
                  <button onClick={() => handleDownloadPdf(quote.id, quote.quoteNumber, quote.request.school.name)} className="text-green-600 hover:text-green-900 ml-2" title="PDF 다운로드"><ArrowDownTrayIcon className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuote ? '견적 수정' : '견적 작성'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingQuote && <div><label className="block text-sm font-medium text-gray-700">요청 선택 *</label><select required value={selectedRequest} onChange={(e) => setSelectedRequest(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"><option value="">요청을 선택하세요</option>{pendingRequests.map((req) => <option key={req.id} value={req.id}>{req.school.name} - {req.program?.name || req.customProgram} ({req.sessions}회)</option>)}</select></div>}
          {editingQuote && <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600"><strong>{editingQuote.request.school.name}</strong> - {editingQuote.request.program?.name || editingQuote.request.customProgram}</p><p className="text-sm text-gray-500 mt-1">{editingQuote.request.sessions}회 × {editingQuote.request.studentCount}명</p></div>}
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">강사비 (원) *</label><input type="number" required value={formData.sessionFee} onChange={(e) => setFormData({ ...formData, sessionFee: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /></div><div><label className="block text-sm font-medium text-gray-700">강사-학교 거리 (km)</label><input type="number" placeholder="거리 입력 시 교통비 자동 계산" value={formData.distanceKm} onChange={(e) => handleDistanceChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /><p className="mt-1 text-xs text-gray-500">0-20km: {parseInt(settings.transport_0_20).toLocaleString()}원 | 20-40km: {parseInt(settings.transport_20_40).toLocaleString()}원 | 40-60km: {parseInt(settings.transport_40_60).toLocaleString()}원</p></div></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">교통비 (원)</label><input type="number" value={formData.transportFee} onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /><p className="mt-1 text-xs text-gray-500">거리 입력 시 자동 계산됩니다.</p></div><div><label className="block text-sm font-medium text-gray-700">재료비 (원)</label><input type="number" value={formData.materialCost} onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700">마진율 (%)</label><input type="number" value={formData.margin} onChange={(e) => setFormData({ ...formData, margin: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">유효기간 (일)</label><input type="number" value={formData.validDays} onChange={(e) => setFormData({ ...formData, validDays: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">비고</label><textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" /></div>
          <div className="rounded-lg bg-blue-50 p-4"><div className="flex justify-between items-center"><span className="text-sm font-medium text-blue-900">예상 총액</span><span className="text-lg font-bold text-blue-900">{calculateTotal().toLocaleString()}원</span></div></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">취소</button><button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">{loading ? '저장 중...' : editingQuote ? '수정' : '저장'}</button></div>
        </form>
      </FormModal>
    </>
  )
}
