'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'
import ExportButton from '../../components/ExportButton'
import ResponsiveList from '../../components/ResponsiveList'
import SchoolCard from '../../components/cards/SchoolCard'
import { exportToExcel, schoolExcelConfig, parseExcelFile, downloadExcelTemplate, schoolExcelTemplateConfig, schoolTypeMapping } from '../../lib/excel'

interface School {
  id: string
  name: string
  type: string
  address: string
  region: string
  phoneNumber: string
  email?: string | null
  distanceKm?: number | null
  transportFee?: number | null
  totalStudents?: number | null
  notes?: string | null
  active: boolean
  _count: { requests: number }
}

const schoolTypes = {
  ELEMENTARY: '초등학교',
  MIDDLE: '중학교',
  HIGH: '고등학교',
  SPECIAL: '특수학교',
  ALTERNATIVE: '대안학교',
  INSTITUTION: '기관',
}

// 지역 목록 (탭 필터용)
const regions = ['전체', '영주', '안동', '봉화', '예천', '문경', '기타']

export default function SchoolList({ initialSchools }: { initialSchools: School[] }) {
  const router = useRouter()
  const [schools, setSchools] = useState(initialSchools)
  const [filteredSchools, setFilteredSchools] = useState(initialSchools)
  const [activeRegion, setActiveRegion] = useState('전체')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // initialSchools가 변경되면 상태 업데이트
  useEffect(() => {
    setSchools(initialSchools)
  }, [initialSchools])

  // 지역별 필터링
  useEffect(() => {
    startTransition(() => {
      if (activeRegion === '전체') {
        setFilteredSchools(schools)
      } else if (activeRegion === '기타') {
        // 주요 지역에 해당하지 않는 학교
        const mainRegions = ['영주', '안동', '봉화', '예천', '문경']
        setFilteredSchools(
          schools.filter((school) =>
            !mainRegions.some((r) => school.region.includes(r))
          )
        )
      } else {
        setFilteredSchools(
          schools.filter((school) => school.region.includes(activeRegion))
        )
      }
    })
  }, [activeRegion, schools])

  // 지역별 카운트 계산
  const regionCounts = {
    전체: schools.length,
    영주: schools.filter((s) => s.region.includes('영주')).length,
    안동: schools.filter((s) => s.region.includes('안동')).length,
    봉화: schools.filter((s) => s.region.includes('봉화')).length,
    예천: schools.filter((s) => s.region.includes('예천')).length,
    문경: schools.filter((s) => s.region.includes('문경')).length,
    기타: schools.filter((s) => {
      const mainRegions = ['영주', '안동', '봉화', '예천', '문경']
      return !mainRegions.some((r) => s.region.includes(r))
    }).length,
  }

  // 탭 변경 핸들러
  const handleRegionChange = useCallback((region: string) => {
    startTransition(() => {
      setActiveRegion(region)
    })
  }, [])
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(false)

  // 엑셀 업로드 관련 상태
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    type: 'MIDDLE',
    address: '',
    region: '',
    phoneNumber: '',
    email: '',
    distanceKm: '',
    transportFee: '',
    totalStudents: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'MIDDLE',
      address: '',
      region: '',
      phoneNumber: '',
      email: '',
      distanceKm: '',
      transportFee: '',
      totalStudents: '',
      notes: '',
    })
    setEditingSchool(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = useCallback((school: School) => {
    setEditingSchool(school)
    setFormData({
      name: school.name,
      type: school.type,
      address: school.address,
      region: school.region,
      phoneNumber: school.phoneNumber,
      email: school.email || '',
      distanceKm: school.distanceKm?.toString() || '',
      transportFee: school.transportFee?.toString() || '',
      totalStudents: school.totalStudents?.toString() || '',
      notes: school.notes || '',
    })
    setIsModalOpen(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingSchool
        ? `/api/schools/${editingSchool.id}`
        : '/api/schools'
      const method = editingSchool ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const savedSchool = await res.json()
        // 즉시 모달 닫기 (INP 최적화)
        setIsModalOpen(false)
        resetForm()

        // 낙관적 UI 업데이트
        startTransition(() => {
          if (editingSchool) {
            setSchools(prev => prev.map(s =>
              s.id === editingSchool.id
                ? { ...s, ...savedSchool, _count: s._count }
                : s
            ))
          } else {
            setSchools(prev => [...prev, { ...savedSchool, _count: { requests: 0 } }])
          }
        })

        // 백그라운드에서 서버 데이터 동기화
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '학교 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to save school:', error)
      alert('학교 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/schools/${id}`, { method: 'DELETE' })
      if (res.ok) {
        startTransition(() => {
          setSchools(prev => prev.filter(s => s.id !== id))
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete school:', error)
    } finally {
      setActionLoading(null)
    }
  }, [router])

  const handleExportExcel = () => {
    const exportData = schools.map(school => ({
      name: school.name,
      address: school.address,
      contactName: '',
      contactPhone: school.phoneNumber,
      contactEmail: school.email || '',
      requestCount: school._count.requests,
    }))
    exportToExcel({
      filename: '학교목록',
      sheetName: '학교',
      columns: schoolExcelConfig,
      data: exportData,
    })
  }

  // 엑셀 업로드 관련 함수들
  const resetExcelForm = useCallback(() => {
    setExcelData([])
    setUploadError(null)
    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDownloadTemplate = useCallback(() => {
    downloadExcelTemplate(
      '학교등록_템플릿',
      schoolExcelTemplateConfig,
      '학교'
    )
  }, [])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    try {
      // 컬럼 매핑 (한글 헤더 → 영문 key)
      const columnMapping: Record<string, string> = {}
      schoolExcelTemplateConfig.forEach(col => {
        columnMapping[col.header] = col.key
      })

      const rawData = await parseExcelFile(file)

      if (rawData.length === 0) {
        setUploadError('엑셀 파일에 데이터가 없습니다.')
        return
      }

      // 컬럼명 변환 (한글 → 영문)
      const data = rawData.map(row => {
        const mappedRow: Record<string, unknown> = {}
        for (const [korKey, value] of Object.entries(row)) {
          const engKey = columnMapping[korKey] || korKey
          mappedRow[engKey] = value
        }
        return mappedRow
      })

      // 데이터 유효성 검사
      const invalidRows: number[] = []
      data.forEach((row, index) => {
        if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
          invalidRows.push(index + 2) // 헤더 행 고려
        }
      })

      if (invalidRows.length > 0) {
        setUploadError(`다음 행에 학교명이 없습니다: ${invalidRows.join(', ')}`)
        return
      }

      setExcelData(data)
    } catch (error) {
      console.error('Excel parse error:', error)
      setUploadError('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }
  }, [])

  const handleExcelSubmit = useCallback(async () => {
    if (excelData.length === 0) {
      setUploadError('업로드할 데이터가 없습니다.')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      // 데이터 전처리 (학교 유형 변환)
      const processedData = excelData.map(row => ({
        ...row,
        type: row.type ? (schoolTypeMapping[String(row.type)] || String(row.type)) : undefined,
      }))

      const res = await fetch('/api/schools/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schools: processedData }),
      })

      const result = await res.json()

      if (res.ok) {
        // 모달 닫기 및 상태 초기화
        setIsExcelModalOpen(false)
        resetExcelForm()

        // 낙관적 UI 업데이트
        startTransition(() => {
          if (result.schools && result.schools.length > 0) {
            setSchools(prev => [...prev, ...result.schools.map((s: School) => ({
              ...s,
              _count: { requests: 0 }
            }))])
          }
        })

        // 백그라운드에서 서버 데이터 동기화
        router.refresh()

        alert(`${result.count}개의 학교가 등록되었습니다.`)
      } else {
        setUploadError(result.error || '학교 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      setUploadError('서버와 통신 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }, [excelData, resetExcelForm, router, startTransition])

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <ExportButton onClick={handleExportExcel} />
        <button
          onClick={() => {
            resetExcelForm()
            setIsExcelModalOpen(true)
          }}
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
          학교 등록
        </button>
      </div>

      {/* 지역별 탭 필터 */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="지역별 필터">
          {regions.map((region) => {
            const count = regionCounts[region as keyof typeof regionCounts]
            const isActive = activeRegion === region
            return (
              <button
                key={region}
                onClick={() => handleRegionChange(region)}
                disabled={isPending}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } ${isPending ? 'opacity-50' : ''}`}
              >
                {region}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
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

      <ResponsiveList
        mobileView={
          <div className="space-y-4">
            {filteredSchools.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  {activeRegion === '전체' ? '등록된 학교가 없습니다' : `${activeRegion} 지역에 등록된 학교가 없습니다`}
                </h3>
              </div>
            ) : (
              filteredSchools.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  onEdit={() => openEditModal(school)}
                  onDelete={() => handleDelete(school.id)}
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
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">학교명</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">유형</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">지역</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">연락처</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">거리/교통비</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">요청</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                      {activeRegion === '전체' ? '등록된 학교가 없습니다' : `${activeRegion} 지역에 등록된 학교가 없습니다`}
                    </h3>
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {school.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {schoolTypes[school.type as keyof typeof schoolTypes]}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        {school.region}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        {school.phoneNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {school.distanceKm ? `${school.distanceKm}km` : '-'} /
                      {school.transportFee ? ` ${Number(school.transportFee).toLocaleString()}원` : ' -'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {school._count.requests}건
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                      <button
                        onClick={() => openEditModal(school)}
                        disabled={actionLoading === school.id || isPending}
                        className={`text-blue-600 hover:text-blue-900 mr-3 ${actionLoading === school.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(school.id)}
                        disabled={actionLoading === school.id || isPending}
                        className={`text-red-600 hover:text-red-900 ${actionLoading === school.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {actionLoading === school.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ResponsiveList>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchool ? '학교 수정' : '학교 등록'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학교명, 유형 - 모바일: 1열, 데스크탑: 2열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">학교명 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">학교 유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              >
                {Object.entries(schoolTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">주소 *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
            />
          </div>

          {/* 지역, 전화번호 - 모바일: 1열, 데스크탑: 2열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">지역 *</label>
              <input
                type="text"
                required
                placeholder="예: 영주시"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
          </div>

          {/* 거리, 교통비, 학생수 - 모바일: 1열, 데스크탑: 3열 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">거리 (km)</label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.distanceKm}
                onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">교통비 (원)</label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.transportFee}
                onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">전체 학생수</label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.totalStudents}
                onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">메모</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="학교 관련 특이사항, 담당자 정보 등을 입력하세요..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
            />
          </div>

          {/* 버튼 - 모바일에서 전체 너비 */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto rounded-md bg-white px-4 py-3 sm:py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:bg-gray-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-3 sm:py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '저장 중...' : editingSchool ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* 엑셀 업로드 모달 */}
      <FormModal
        isOpen={isExcelModalOpen}
        onClose={() => {
          setIsExcelModalOpen(false)
          resetExcelForm()
        }}
        title="엑셀로 학교 대량 등록"
        size="lg"
      >
        <div className="space-y-4">
          {/* 템플릿 다운로드 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DocumentIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800">엑셀 템플릿 안내</h4>
                <p className="text-xs text-blue-700 mt-1">
                  먼저 템플릿을 다운로드하여 양식에 맞게 데이터를 입력하세요.<br />
                  학교명은 필수이며, 유형/지역은 학교명에서 자동 추론됩니다.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  템플릿 다운로드
                </button>
              </div>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              엑셀 파일 선택
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* 에러 메시지 */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* 데이터 미리보기 */}
          {excelData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                데이터 미리보기 ({excelData.length}건)
              </h4>
              <div className="max-h-60 overflow-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">학교명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">유형</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">지역</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">전화번호</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {excelData.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs text-gray-500">{index + 1}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{String(row.name || '-')}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{String(row.type || '자동')}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{String(row.region || '자동')}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{String(row.phoneNumber || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelData.length > 10 && (
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 text-center">
                    외 {excelData.length - 10}건 더 있음
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsExcelModalOpen(false)
                resetExcelForm()
              }}
              className="w-full sm:w-auto rounded-md bg-white px-4 py-3 sm:py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleExcelSubmit}
              disabled={uploading || excelData.length === 0}
              className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-3 sm:py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '등록 중...' : `${excelData.length}개 학교 등록`}
            </button>
          </div>
        </div>
      </FormModal>
    </>
  )
}
