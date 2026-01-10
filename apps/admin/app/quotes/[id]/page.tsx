'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import QuotationForm, { QuotationFormData, QuotationItemData } from '../../../components/quotation/QuotationForm'
import QuotationPrint from '../../../components/quotation/QuotationPrint'

interface QuotationData {
  id: string
  quotationNumber: string
  issueDate: string
  validUntil: string | null
  clientName: string
  clientAddress: string | null
  clientContact: string | null
  clientPhone: string | null
  clientEmail: string | null
  title: string
  projectName: string | null
  notes: string | null
  totalSupplyAmount: number
  totalVat: number
  totalAmount: number
  status: string
  items: Array<{
    id: string
    itemCode: string | null
    itemName: string
    specification: string | null
    quantity: number
    unit: string
    unitPrice: number
    supplyAmount: number
    vat: number
    remark: string | null
  }>
}

export default function EditQuotationPage() {
  const router = useRouter()
  const params = useParams()
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<QuotationFormData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 견적서 불러오기
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/${params.id}`)
        if (!response.ok) {
          throw new Error('견적서를 찾을 수 없습니다.')
        }
        const data = await response.json()
        setQuotation(data)
      } catch (error) {
        alert(error instanceof Error ? error.message : '견적서 로드 실패')
        router.push('/quotes')
      } finally {
        setFetching(false)
      }
    }

    if (params.id) {
      fetchQuotation()
    }
  }, [params.id, router])

  const handleSubmit = async (data: QuotationFormData) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '저장에 실패했습니다.')
      }

      alert('저장되었습니다.')
      // 데이터 갱신
      const updated = await response.json()
      setQuotation(updated)
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.')
      }

      router.push('/quotes')
    } catch (error) {
      alert(error instanceof Error ? error.message : '삭제에 실패했습니다.')
    }
  }

  const handlePrint = (data: QuotationFormData) => {
    setPreviewData(data)
    setShowPreview(true)
  }

  const executePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>견적서 - ${previewData?.clientName}</title>
              <meta charset="utf-8" />
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; }
                @page { size: A4; margin: 0; }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quotation) {
    return null
  }

  // 폼 데이터 변환
  const initialData: Partial<QuotationFormData> = {
    quotationNumber: quotation.quotationNumber,
    issueDate: quotation.issueDate.split('T')[0],
    validUntil: quotation.validUntil ? quotation.validUntil.split('T')[0] : '',
    clientName: quotation.clientName,
    clientAddress: quotation.clientAddress || '',
    clientContact: quotation.clientContact || '',
    clientPhone: quotation.clientPhone || '',
    clientEmail: quotation.clientEmail || '',
    title: quotation.title,
    projectName: quotation.projectName || '',
    notes: quotation.notes || '',
    totalSupplyAmount: quotation.totalSupplyAmount,
    totalVat: quotation.totalVat,
    totalAmount: quotation.totalAmount,
    items: quotation.items.map((item): QuotationItemData => ({
      id: item.id,
      itemCode: item.itemCode || '',
      itemName: item.itemName,
      specification: item.specification || '',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      supplyAmount: item.supplyAmount,
      vat: item.vat,
      remark: item.remark || '',
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">견적서 수정</h1>
              <p className="text-sm text-gray-500">{quotation.quotationNumber}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            <TrashIcon className="h-4 w-4" />
            삭제
          </button>
        </div>
      </div>

      {/* 폼 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <QuotationForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onPrint={handlePrint}
          loading={loading}
        />
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">견적서 삭제</h3>
            <p className="text-gray-600 mb-4">
              이 견적서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 인쇄 미리보기 모달 */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[230mm] max-h-[95vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">인쇄 미리보기</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={executePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500"
                >
                  인쇄하기
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="p-4" style={{ backgroundColor: '#f5f5f5' }}>
              <QuotationPrint ref={printRef} data={previewData} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
