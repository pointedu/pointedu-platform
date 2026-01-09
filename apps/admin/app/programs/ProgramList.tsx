'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'
import { parseExcelFile, downloadExcelTemplate, programExcelTemplateConfig, categoryMapping } from '../../lib/excel'

interface Program {
  id: string
  name: string
  category: string
  description?: string | null
  sessionMinutes?: number | null
  maxStudents?: number | null
  baseSessionFee?: number | string | null
  active: boolean
  _count: { requests: number }
}

const categoryLabels: Record<string, string> = {
  FOURTHIND: '4차산업',
  CULTURE: '문화예술',
  MEDICAL: '메디컬',
  PROFESSIONAL: '전문직',
  STEAM: 'STEAM',
  EXPERIENCE: '체험형',
  CAREER: '진로탐색',
  OTHER: '기타',
}

// 카테고리 탭 순서 정의
const categoryOrder = ['전체', 'FOURTHIND', 'CULTURE', 'MEDICAL', 'PROFESSIONAL', 'STEAM', 'EXPERIENCE', 'CAREER', 'OTHER']

export default function ProgramList({ initialPrograms }: { initialPrograms: Program[] }) {
  const router = useRouter()
  const [programs, setPrograms] = useState(initialPrograms)
  const [filteredPrograms, setFilteredPrograms] = useState(initialPrograms)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // initialPrograms가 변경되면 상태 업데이트
  useEffect(() => {
    setPrograms(initialPrograms)
  }, [initialPrograms])

  // 카테고리별 필터링
  useEffect(() => {
    startTransition(() => {
      if (activeCategory === '전체') {
        setFilteredPrograms(programs)
      } else {
        setFilteredPrograms(
          programs.filter((program) => program.category === activeCategory)
        )
      }
    })
  }, [activeCategory, programs])

  // 카테고리별 카운트 계산
  const categoryCounts: Record<string, number> = {
    전체: programs.length,
    ...Object.keys(categoryLabels).reduce((acc, category) => {
      acc[category] = programs.filter((p) => p.category === category).length
      return acc
    }, {} as Record<string, number>),
  }

  // 탭 변경 핸들러
  const handleCategoryChange = useCallback((category: string) => {
    startTransition(() => {
      setActiveCategory(category)
    })
  }, [])
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'CAREER',
    description: '',
    sessionMinutes: '45',
    maxStudents: '',
    baseSessionFee: '',
  })

  // 엑셀 업로드 관련 상태
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'CAREER',
      description: '',
      sessionMinutes: '45',
      maxStudents: '',
      baseSessionFee: '',
    })
    setEditingProgram(null)
  }

  // INP 최적화: 폼 입력 핸들러
  const handleFormChange = useCallback((field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    startTransition(() => {
      setFormData(prev => ({ ...prev, [field]: value }))
    })
  }, [])

  // 엑셀 관련 함수들
  const resetExcelForm = () => {
    setExcelData([])
    setUploadError(null)
    setIsExcelModalOpen(false)
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate('프로그램', programExcelTemplateConfig, '프로그램')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    try {
      const data = await parseExcelFile(file)
      if (data.length === 0) {
        setUploadError('엑셀 파일에 데이터가 없습니다.')
        return
      }
      setExcelData(data)
    } catch (error) {
      console.error('Excel parse error:', error)
      setUploadError('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExcelSubmit = async () => {
    if (excelData.length === 0) {
      setUploadError('업로드된 데이터가 없습니다.')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const programsToCreate = excelData.map((row) => {
        const name = String(row['프로그램명'] || row['name'] || '').trim()
        let category = String(row['카테고리'] || row['category'] || 'OTHER').trim()

        // 카테고리 매핑
        if (categoryMapping[category]) {
          category = categoryMapping[category]
        }

        return {
          name,
          category,
          description: String(row['설명'] || row['description'] || ''),
          sessionMinutes: parseInt(String(row['수업시간(분)'] || row['sessionMinutes'] || '45')) || 45,
          maxStudents: parseInt(String(row['최대학생수'] || row['maxStudents'] || '')) || null,
          baseSessionFee: parseFloat(String(row['기본가격'] || row['baseSessionFee'] || '')) || null,
        }
      }).filter((p) => p.name)

      if (programsToCreate.length === 0) {
        setUploadError('유효한 프로그램 데이터가 없습니다.')
        setUploading(false)
        return
      }

      const res = await fetch('/api/programs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programs: programsToCreate }),
      })

      if (res.ok) {
        const result = await res.json()
        alert(`${result.count}개의 프로그램이 등록되었습니다.`)
        resetExcelForm()
        router.refresh()
      } else {
        const error = await res.json()
        setUploadError(error.error || '등록 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Failed to create programs from excel:', error)
      setUploadError(error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (program: Program) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      category: program.category,
      description: program.description || '',
      sessionMinutes: program.sessionMinutes?.toString() || '45',
      maxStudents: program.maxStudents?.toString() || '',
      baseSessionFee: program.baseSessionFee?.toString() || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingProgram
        ? `/api/programs/${editingProgram.id}`
        : '/api/programs'
      const method = editingProgram ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsModalOpen(false)
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save program:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        startTransition(() => {
          setPrograms(prev => prev.filter(p => p.id !== id))
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete program:', error)
    } finally {
      setActionLoading(null)
    }
  }, [router])

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => setIsExcelModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
        >
          <ArrowUpTrayIcon className="h-5 w-5" />
          엑셀 업로드
        </button>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
          프로그램 등록
        </button>
      </div>

      {/* 카테고리별 탭 필터 */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 overflow-x-auto pb-px" aria-label="카테고리별 필터">
          {categoryOrder.map((category) => {
            const count = categoryCounts[category] || 0
            const isActive = activeCategory === category
            const label = category === '전체' ? '전체' : categoryLabels[category]
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                disabled={isPending}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } ${isPending ? 'opacity-50' : ''}`}
              >
                {label}
                <span
                  className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrograms.length === 0 ? (
          <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              {activeCategory === '전체' ? '등록된 프로그램이 없습니다' : `${categoryLabels[activeCategory] || activeCategory} 카테고리에 등록된 프로그램이 없습니다`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">새 프로그램을 등록해주세요.</p>
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {categoryLabels[program.category] || program.category}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{program.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(program)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(program.id)}
                    disabled={actionLoading === program.id || isPending}
                    className={`text-red-600 hover:text-red-900 ${actionLoading === program.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {actionLoading === program.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {program.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{program.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {program.sessionMinutes || 45}분
                </span>
                {program.maxStudents && (
                  <span>최대 {program.maxStudents}명</span>
                )}
                {program.baseSessionFee && (
                  <span className="flex items-center gap-1">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    {Number(program.baseSessionFee).toLocaleString()}원
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  요청 수: {program._count.requests}건
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProgram ? '프로그램 수정' : '프로그램 등록'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">프로그램명 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleFormChange('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">카테고리</label>
              <select
                value={formData.category}
                onChange={handleFormChange('category')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">설명</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={handleFormChange('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">수업 시간 (분) *</label>
              <input
                type="number"
                required
                value={formData.sessionMinutes}
                onChange={handleFormChange('sessionMinutes')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">최대 학생 수</label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={handleFormChange('maxStudents')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">기본 가격 (원)</label>
              <input
                type="number"
                value={formData.baseSessionFee}
                onChange={handleFormChange('baseSessionFee')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '저장 중...' : editingProgram ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* 엑셀 업로드 모달 */}
      <FormModal
        isOpen={isExcelModalOpen}
        onClose={resetExcelForm}
        title="프로그램 엑셀 업로드"
        size="lg"
      >
        <div className="space-y-6">
          {/* 템플릿 다운로드 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">1. 엑셀 양식 다운로드</h3>
            <p className="text-sm text-blue-700 mb-3">
              아래 버튼을 클릭하여 엑셀 양식을 다운로드한 후, 프로그램 데이터를 입력하세요.
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              엑셀 양식 다운로드
            </button>
          </div>

          {/* 카테고리 안내 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">카테고리 입력 방법</h4>
            <p className="text-sm text-gray-600">
              한글 또는 영문으로 입력 가능합니다:
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div>4차산업 → FOURTHIND</div>
              <div>문화예술 → CULTURE</div>
              <div>메디컬 → MEDICAL</div>
              <div>전문직 → PROFESSIONAL</div>
              <div>STEAM/과학 → STEAM</div>
              <div>체험형 → EXPERIENCE</div>
              <div>진로탐색 → CAREER</div>
              <div>기타 → OTHER</div>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">2. 엑셀 파일 업로드</h3>
            <p className="text-sm text-gray-600 mb-3">
              작성한 엑셀 파일을 업로드하세요.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              파일 선택
            </button>
          </div>

          {/* 에러 메시지 */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* 업로드된 데이터 미리보기 */}
          {excelData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentIcon className="h-5 w-5" />
                  업로드된 데이터 ({excelData.length}건)
                </h3>
                <button
                  type="button"
                  onClick={() => setExcelData([])}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">프로그램명</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">카테고리</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">수업시간</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">기본가격</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {excelData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{String(row['프로그램명'] || row['name'] || '')}</td>
                        <td className="px-3 py-2">{String(row['카테고리'] || row['category'] || '')}</td>
                        <td className="px-3 py-2">{String(row['수업시간(분)'] || row['sessionMinutes'] || '')}분</td>
                        <td className="px-3 py-2">{String(row['기본가격'] || row['baseSessionFee'] || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={resetExcelForm}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleExcelSubmit}
              disabled={uploading || excelData.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {uploading ? '등록 중...' : `${excelData.length}개 프로그램 등록`}
            </button>
          </div>
        </div>
      </FormModal>
    </>
  )
}
