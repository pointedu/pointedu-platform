'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdvancedSearchFilter from '../../components/AdvancedSearchFilter'
import Modal from '../../components/Modal'
import FormModal from '../../components/FormModal'
import ExportButton from '../../components/ExportButton'
import { exportToExcel, instructorExcelConfig } from '../../lib/excel'
import ResponsiveList from '../../components/ResponsiveList'
import InstructorCard from '../../components/cards/InstructorCard'
import {
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'
import {
  INTERNAL_GRADES,
  EXTERNAL_GRADES,
  getGradeBadgeData,
} from '../../lib/instructor-grade'

interface Instructor {
  id: string
  name: string
  homeBase: string
  phoneNumber: string
  email?: string | null
  subjects: string[]
  rangeKm: string
  availableDays: string[]
  status: string
  rating: number | null
  totalClasses: number
  bankName?: string | null
  accountNumber?: string | null
  accountHolder?: string | null
  bankAccount?: string | null
  residentNumber?: string | null
  emergencyContact?: string | null
  experience?: number | null
  certifications?: string[]
  notes?: string | null
  createdAt?: string
  instructorType?: 'INTERNAL' | 'EXTERNAL'
  grade?: string | null
  externalGrade?: string | null
  feeMultiplier?: number
  _count: {
    assignments: number
    payments: number
  }
}

interface InstructorListProps {
  initialInstructors: Instructor[]
}

const statusColors = {
  PENDING: 'bg-orange-100 text-orange-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800',
  TERMINATED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const statusLabels = {
  PENDING: '승인대기',
  ACTIVE: '활동중',
  INACTIVE: '휴면',
  ON_LEAVE: '휴직',
  TERMINATED: '퇴사',
  REJECTED: '거절됨',
}

const filters = [
  {
    key: 'instructorType',
    label: '강사 유형',
    options: [
      { value: 'INTERNAL', label: '내부 강사' },
      { value: 'EXTERNAL', label: '외부 강사' },
    ],
  },
  {
    key: 'status',
    label: '상태',
    multiple: true,
    options: [
      { value: 'PENDING', label: '승인대기' },
      { value: 'ACTIVE', label: '활동중' },
      { value: 'INACTIVE', label: '휴면' },
      { value: 'ON_LEAVE', label: '휴직' },
      { value: 'TERMINATED', label: '퇴사' },
      { value: 'REJECTED', label: '거절됨' },
    ],
  },
  {
    key: 'homeBase',
    label: '거주지',
    multiple: true,
    options: [
      { value: '영주', label: '영주' },
      { value: '안동', label: '안동' },
      { value: '봉화', label: '봉화' },
      { value: '예천', label: '예천' },
      { value: '문경', label: '문경' },
    ],
  },
  {
    key: 'rangeKm',
    label: '활동 범위',
    options: [
      { value: '40-60', label: '40-60km' },
      { value: '70-90', label: '70-90km' },
      { value: '100-120', label: '100-120km' },
    ],
  },
]

const sortOptions = [
  { key: 'name', label: '이름' },
  { key: 'totalClasses', label: '수업수' },
  { key: 'rating', label: '평점' },
]

const availableSubjects = [
  'AI/코딩',
  '드론',
  '3D프린팅',
  '메이커',
  '진로체험',
  '과학실험',
  '로봇',
  '앱개발',
]

export default function InstructorList({ initialInstructors }: InstructorListProps) {
  const router = useRouter()
  const [instructors, setInstructors] = useState(initialInstructors)
  const [filteredInstructors, setFilteredInstructors] = useState(initialInstructors)

  // initialInstructors가 변경되면 상태 업데이트
  useEffect(() => {
    setInstructors(initialInstructors)
    setFilteredInstructors(initialInstructors)
  }, [initialInstructors])
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [currentSort, setCurrentSort] = useState<{ key: string; label: string; direction: 'asc' | 'desc' } | null>(null)

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(false)

  // Grade modal state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [gradeLoading, setGradeLoading] = useState(false)
  const [gradeFormData, setGradeFormData] = useState({
    instructorType: 'INTERNAL' as 'INTERNAL' | 'EXTERNAL',
    grade: 'LEVEL1',
    externalGrade: 'EXTERNAL_BASIC',
  })

  const [formData, setFormData] = useState({
    name: '',
    homeBase: '영주',
    phoneNumber: '',
    email: '',
    subjects: [] as string[],
    rangeKm: '40-60',
    availableDays: [] as string[],
    status: 'ACTIVE',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  })

  const applyFilters = (
    query: string,
    filters: Record<string, string[]>,
    sort: { key: string; direction: 'asc' | 'desc' } | null = currentSort
  ) => {
    let result = instructors

    if (query) {
      const lowerQuery = query.toLowerCase()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(lowerQuery) ||
          i.subjects.some((s) => s.toLowerCase().includes(lowerQuery)) ||
          i.homeBase.toLowerCase().includes(lowerQuery)
      )
    }

    // 다중 선택 필터링
    if (filters.status?.length > 0) {
      result = result.filter((i) => filters.status.includes(i.status))
    }

    if (filters.homeBase?.length > 0) {
      result = result.filter((i) => filters.homeBase.some(hb => i.homeBase.includes(hb)))
    }

    if (filters.rangeKm?.length > 0) {
      result = result.filter((i) => filters.rangeKm.includes(i.rangeKm))
    }

    if (filters.instructorType?.length > 0) {
      result = result.filter((i) => filters.instructorType.includes(i.instructorType || 'INTERNAL'))
    }

    // 정렬 적용
    if (sort) {
      result = [...result].sort((a, b) => {
        const aVal = a[sort.key as keyof Instructor]
        const bVal = b[sort.key as keyof Instructor]
        const modifier = sort.direction === 'asc' ? 1 : -1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * modifier
        }
        return ((Number(aVal) || 0) - (Number(bVal) || 0)) * modifier
      })
    }

    setFilteredInstructors(result)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(query, activeFilters)
  }

  const handleFilter = (filters: Record<string, string[]>) => {
    setActiveFilters(filters)
    applyFilters(searchQuery, filters)
  }

  const handleSort = (sort: { key: string; label: string; direction: 'asc' | 'desc' } | null) => {
    setCurrentSort(sort)
    applyFilters(searchQuery, activeFilters, sort)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      homeBase: '영주',
      phoneNumber: '',
      email: '',
      subjects: [],
      rangeKm: '40-60',
      availableDays: [],
      status: 'ACTIVE',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
    })
    setEditingInstructor(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsFormModalOpen(true)
  }

  const openEditModal = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      name: instructor.name,
      homeBase: instructor.homeBase,
      phoneNumber: instructor.phoneNumber,
      email: instructor.email || '',
      subjects: instructor.subjects,
      rangeKm: instructor.rangeKm,
      availableDays: instructor.availableDays,
      status: instructor.status,
      bankName: instructor.bankName || '',
      accountNumber: instructor.accountNumber || '',
      accountHolder: instructor.accountHolder || '',
    })
    setSelectedInstructor(null)
    setIsFormModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingInstructor
        ? `/api/instructors/${editingInstructor.id}`
        : '/api/instructors'
      const method = editingInstructor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const savedInstructor = await res.json()
        // 성공 시 데이터가 data 속성에 있을 수 있음
        const newInstructor = savedInstructor.data || savedInstructor

        if (!editingInstructor && newInstructor.id) {
          // 새 강사 등록 시 로컬 상태에 즉시 추가
          const formattedInstructor = {
            ...newInstructor,
            _count: newInstructor._count || { assignments: 0, payments: 0 },
          }
          setInstructors(prev => [...prev, formattedInstructor])
          setFilteredInstructors(prev => [...prev, formattedInstructor])
        }

        setIsFormModalOpen(false)
        resetForm()
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(errorData.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to save instructor:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/instructors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSelectedInstructor(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete instructor:', error)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('이 강사의 가입을 승인하시겠습니까?')) return

    try {
      const res = await fetch(`/api/instructors/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to approve instructor:', error)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('거절 사유를 입력해주세요:')
    if (reason === null) return

    try {
      const res = await fetch(`/api/instructors/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to reject instructor:', error)
    }
  }

  // 강사 퇴사 처리
  const handleTerminate = async (id: string, name: string) => {
    const confirmMessage = `${name} 강사를 퇴사 처리하시겠습니까?\n\n진행 중인 수업 배정도 함께 취소됩니다.`
    if (!confirm(confirmMessage)) return

    const reason = prompt('퇴사 사유를 입력해주세요 (선택):')

    try {
      const res = await fetch(`/api/instructors/${id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || undefined,
          cancelPendingAssignments: true,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        if (result.cancelledAssignments > 0) {
          alert(`퇴사 처리 완료\n\n취소된 수업 배정: ${result.cancelledAssignments}건${result.inProgressAssignments > 0 ? `\n진행 중인 수업: ${result.inProgressAssignments}건 (수동 처리 필요)` : ''}`)
        }
        // 로컬 상태 업데이트
        setInstructors(prev =>
          prev.map(i => i.id === id ? { ...i, status: 'TERMINATED' } : i)
        )
        setFilteredInstructors(prev =>
          prev.map(i => i.id === id ? { ...i, status: 'TERMINATED' } : i)
        )
        setSelectedInstructor(null)
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(errorData.error || '퇴사 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to terminate instructor:', error)
      alert('퇴사 처리 중 오류가 발생했습니다.')
    }
  }

  // 등급 모달 열기
  const openGradeModal = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setGradeFormData({
      instructorType: instructor.instructorType || 'INTERNAL',
      grade: instructor.grade || 'LEVEL1',
      externalGrade: instructor.externalGrade || 'EXTERNAL_BASIC',
    })
    setSelectedInstructor(null)
    setIsGradeModalOpen(true)
  }

  // 등급 저장
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInstructor) return
    setGradeLoading(true)

    try {
      const res = await fetch(`/api/instructors/${editingInstructor.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorType: gradeFormData.instructorType,
          grade: gradeFormData.instructorType === 'INTERNAL' ? gradeFormData.grade : null,
          externalGrade: gradeFormData.instructorType === 'EXTERNAL' ? gradeFormData.externalGrade : null,
        }),
      })

      if (res.ok) {
        setIsGradeModalOpen(false)
        setEditingInstructor(null)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '등급 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to update grade:', error)
      alert('등급 변경에 실패했습니다.')
    } finally {
      setGradeLoading(false)
    }
  }

  // 등급 배지 렌더링
  const renderGradeBadge = (instructor: Instructor) => {
    const badge = getGradeBadgeData(
      instructor.instructorType || 'INTERNAL',
      instructor.grade || null,
      instructor.externalGrade || null
    )
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${badge.bgColor} ${badge.color}`}>
        {badge.icon && <span>{badge.icon}</span>}
        {badge.label}
      </span>
    )
  }

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }))
  }

  const handleExportExcel = () => {
    const exportData = filteredInstructors.map(instructor => ({
      ...instructor,
      statusLabel: statusLabels[instructor.status as keyof typeof statusLabels] || instructor.status,
      assignmentCount: instructor._count.assignments,
      paymentCount: instructor._count.payments,
    }))
    exportToExcel({
      filename: '강사목록',
      sheetName: '강사',
      columns: instructorExcelConfig,
      data: exportData,
    })
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
        <div className="flex-1">
          <AdvancedSearchFilter
            placeholder="강사명, 과목, 지역으로 검색..."
            filters={filters}
            sortOptions={sortOptions}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
          />
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={handleExportExcel} />
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <PlusIcon className="h-5 w-5" />
            강사 등록
          </button>
        </div>
      </div>

      <ResponsiveList
        mobileView={
          <div className="space-y-4">
            {filteredInstructors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {instructors.length === 0 ? '등록된 강사가 없습니다.' : '검색 결과가 없습니다.'}
              </div>
            ) : (
              filteredInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  onSelect={() => setSelectedInstructor(instructor)}
                  onEdit={() => openEditModal(instructor)}
                  onDelete={() => handleDelete(instructor.id)}
                  onApprove={() => handleApprove(instructor.id)}
                  onReject={() => handleReject(instructor.id)}
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
                  이름
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  등급
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  거주지
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  전문 과목
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  활동 범위
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  가능 요일
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  배정/정산
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
              {filteredInstructors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    {instructors.length === 0
                      ? '등록된 강사가 없습니다.'
                      : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredInstructors.map((instructor) => (
                  <tr
                    key={instructor.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedInstructor(instructor)}
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {instructor.name}
                      <div className="text-xs text-gray-500">{instructor.phoneNumber}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      {renderGradeBadge(instructor)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {instructor.homeBase}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {instructor.subjects.join(', ')}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {instructor.rangeKm}km
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {instructor.availableDays.join(', ')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {instructor._count.assignments}건 / {instructor._count.payments}건
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          statusColors[instructor.status as keyof typeof statusColors] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[instructor.status as keyof typeof statusLabels] ||
                          instructor.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                      {instructor.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(instructor.id)
                            }}
                            className="text-green-600 hover:text-green-900 mr-2"
                            title="승인"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(instructor.id)
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="거절"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openGradeModal(instructor)
                            }}
                            className="text-purple-600 hover:text-purple-900 mr-2"
                            title="등급 변경"
                          >
                            <ShieldCheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(instructor)
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            title="수정"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {instructor.status !== 'TERMINATED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTerminate(instructor.id, instructor.name)
                              }}
                              className="text-orange-600 hover:text-orange-900 mr-2"
                              title="퇴사 처리"
                            >
                              <NoSymbolIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(instructor.id)
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
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
      <Modal
        isOpen={!!selectedInstructor}
        onClose={() => setSelectedInstructor(null)}
        title="강사 상세 정보"
        size="lg"
      >
        {selectedInstructor && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <UserIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedInstructor.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4" />
                    {selectedInstructor.phoneNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {selectedInstructor.homeBase}
                  </span>
                  {selectedInstructor.rating && (
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      {Number(selectedInstructor.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      statusColors[selectedInstructor.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[selectedInstructor.status as keyof typeof statusLabels]}
                  </span>
                  {renderGradeBadge(selectedInstructor)}
                  <button
                    onClick={() => openGradeModal(selectedInstructor)}
                    className="text-xs text-purple-600 hover:text-purple-800 underline ml-1"
                  >
                    등급 변경
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <AcademicCapIcon className="h-4 w-4" />
                  전문 과목
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedInstructor.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <CalendarIcon className="h-4 w-4" />
                  가능 요일
                </h4>
                <div className="mt-2 flex gap-1">
                  {['월', '화', '수', '목', '금'].map((day) => (
                    <span
                      key={day}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                        selectedInstructor.availableDays.includes(day)
                          ? 'bg-green-100 text-green-700 font-semibold'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">활동 범위</h4>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {selectedInstructor.rangeKm}km
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">총 수업</h4>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {selectedInstructor.totalClasses}회
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedInstructor._count.assignments}
                </p>
                <p className="text-sm text-gray-500">배정 건수</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {selectedInstructor._count.payments}
                </p>
                <p className="text-sm text-gray-500">정산 건수</p>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">연락처 정보</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedInstructor.email && (
                  <div>
                    <span className="text-gray-500">이메일:</span>
                    <span className="ml-2 text-gray-900">{selectedInstructor.email}</span>
                  </div>
                )}
                {selectedInstructor.emergencyContact && (
                  <div>
                    <span className="text-gray-500">비상연락처:</span>
                    <span className="ml-2 text-gray-900">{selectedInstructor.emergencyContact}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 정산 정보 */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">정산 정보</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedInstructor.residentNumber && (
                  <div>
                    <span className="text-gray-500">주민등록번호:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedInstructor.residentNumber.slice(0, 8)}******
                    </span>
                  </div>
                )}
                {selectedInstructor.bankAccount && (
                  <div>
                    <span className="text-gray-500">계좌정보:</span>
                    <span className="ml-2 text-gray-900">{selectedInstructor.bankAccount}</span>
                  </div>
                )}
                {selectedInstructor.bankName && (
                  <div>
                    <span className="text-gray-500">은행:</span>
                    <span className="ml-2 text-gray-900">{selectedInstructor.bankName}</span>
                  </div>
                )}
                {selectedInstructor.accountNumber && (
                  <div>
                    <span className="text-gray-500">계좌번호:</span>
                    <span className="ml-2 text-gray-900">{selectedInstructor.accountNumber}</span>
                  </div>
                )}
                {selectedInstructor.accountHolder && (
                  <div>
                    <span className="text-gray-500">예금주:</span>
                    <span className="ml-2 text-gray-900">{selectedInstructor.accountHolder}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 경력 및 자격 */}
            {(Number(selectedInstructor.experience || 0) > 0 || (selectedInstructor.certifications && selectedInstructor.certifications.length > 0)) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">경력 및 자격</h4>
                <div className="space-y-2 text-sm">
                  {Number(selectedInstructor.experience || 0) > 0 && (
                    <div>
                      <span className="text-gray-500">경력:</span>
                      <span className="ml-2 text-gray-900">{selectedInstructor.experience}년</span>
                    </div>
                  )}
                  {selectedInstructor.certifications && selectedInstructor.certifications.length > 0 && (
                    <div>
                      <span className="text-gray-500">자격증:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedInstructor.certifications.map((cert, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 메모 및 가입일 */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedInstructor.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500">신청 메시지:</span>
                    <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{selectedInstructor.notes}</p>
                  </div>
                )}
                {selectedInstructor.createdAt && (
                  <div>
                    <span className="text-gray-500">가입 신청일:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedInstructor.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => handleDelete(selectedInstructor.id)}
                className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                삭제
              </button>
              {selectedInstructor.status !== 'TERMINATED' && (
                <button
                  type="button"
                  onClick={() => handleTerminate(selectedInstructor.id, selectedInstructor.name)}
                  className="rounded-md bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                >
                  퇴사 처리
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedInstructor(null)}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => openEditModal(selectedInstructor)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                수정하기
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingInstructor ? '강사 수정' : '강사 등록'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">상태</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">이메일</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">거주지 *</label>
              <select
                value={formData.homeBase}
                onChange={(e) => setFormData({ ...formData, homeBase: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="영주">영주</option>
                <option value="안동">안동</option>
                <option value="봉화">봉화</option>
                <option value="예천">예천</option>
                <option value="문경">문경</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">활동 범위 *</label>
              <select
                value={formData.rangeKm}
                onChange={(e) => setFormData({ ...formData, rangeKm: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="40-60">40-60km</option>
                <option value="70-90">70-90km</option>
                <option value="100-120">100-120km</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전문 과목</label>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    formData.subjects.includes(subject)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">가능 요일</label>
            <div className="flex gap-2">
              {['월', '화', '수', '목', '금'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    formData.availableDays.includes(day)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">계좌 정보</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">은행명</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">계좌번호</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">예금주</label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '저장 중...' : editingInstructor ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Grade Change Modal */}
      <FormModal
        isOpen={isGradeModalOpen}
        onClose={() => {
          setIsGradeModalOpen(false)
          setEditingInstructor(null)
        }}
        title={`강사 등급 변경 - ${editingInstructor?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleGradeSubmit} className="space-y-6">
          {/* 강사 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">강사 유형</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="instructorType"
                  value="INTERNAL"
                  checked={gradeFormData.instructorType === 'INTERNAL'}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, instructorType: e.target.value as 'INTERNAL' | 'EXTERNAL' })}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">내부 강사</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="instructorType"
                  value="EXTERNAL"
                  checked={gradeFormData.instructorType === 'EXTERNAL'}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, instructorType: e.target.value as 'INTERNAL' | 'EXTERNAL' })}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">외부 강사</span>
              </label>
            </div>
          </div>

          {/* 등급 선택 */}
          {gradeFormData.instructorType === 'INTERNAL' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">내부 강사 등급</label>
              <div className="space-y-3">
                {Object.entries(INTERNAL_GRADES).map(([key, info]) => (
                  <label
                    key={key}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      gradeFormData.grade === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="grade"
                      value={key}
                      checked={gradeFormData.grade === key}
                      onChange={(e) => setGradeFormData({ ...gradeFormData, grade: e.target.value })}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${info.bgColor} ${info.color}`}>
                          {info.nameKr}
                        </span>
                        <span className="text-xs text-gray-500">강사비 ×{info.feeMultiplier}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {info.benefits.join(' / ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">외부 강사 등급</label>
              <div className="space-y-3">
                {Object.entries(EXTERNAL_GRADES).map(([key, info]) => (
                  <label
                    key={key}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      gradeFormData.externalGrade === key
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="externalGrade"
                      value={key}
                      checked={gradeFormData.externalGrade === key}
                      onChange={(e) => setGradeFormData({ ...gradeFormData, externalGrade: e.target.value })}
                      className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${info.bgColor} ${info.color}`}>
                          {info.nameKr}
                        </span>
                        <span className="text-xs text-gray-500">강사비 ×{info.feeMultiplier}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {info.benefits.join(' / ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsGradeModalOpen(false)
                setEditingInstructor(null)
              }}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={gradeLoading}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
            >
              {gradeLoading ? '저장 중...' : '등급 변경'}
            </button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
