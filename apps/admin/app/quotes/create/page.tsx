'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import QuotationForm, { QuotationFormData } from '../../../components/quotation/QuotationForm'
import QuotationPrint from '../../../components/quotation/QuotationPrint'

export default function CreateQuotationPage() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<QuotationFormData | null>(null)
  const [initialNumber, setInitialNumber] = useState<string>('')

  // 견적번호 가져오기
  useEffect(() => {
    fetch('/api/quotations/next-number')
      .then(res => res.json())
      .then(data => {
        if (data.quotationNumber) {
          setInitialNumber(data.quotationNumber)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (data: QuotationFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '저장에 실패했습니다.')
      }

      const result = await response.json()
      router.push(`/quotes/${result.id}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
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

  if (!initialNumber) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">새 견적서 작성</h1>
        </div>
      </div>

      {/* 폼 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <QuotationForm
          initialData={{ quotationNumber: initialNumber }}
          onSubmit={handleSubmit}
          onPrint={handlePrint}
          loading={loading}
        />
      </div>

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
