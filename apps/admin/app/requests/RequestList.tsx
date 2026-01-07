'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClockIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import AutomateButton from './AutomateButton'
import FormModal from '../../components/FormModal'
import ExportButton from '../../components/ExportButton'
import { exportToExcel, requestExcelConfig } from '../../lib/excel'
import ResponsiveList from '../../components/ResponsiveList'
import RequestCard from '../../components/cards/RequestCard'
import AdvancedSearchFilter from '../../components/AdvancedSearchFilter'

interface Instructor {
  id: string
  name: string
  homeBase: string
  subjects: string[]
  rangeKm: string
  availableDays: string[]
  status: string
}

interface Request {
  id: string
  requestNumber: string
  status: string
  sessions: number
  studentCount: number
  schoolBudget?: number | null
  preferredDates?: string[] | null
  school: {
    id: string
    name: string
    region: string
    distanceKm?: number | null
  }
  program?: {
    name: string
    category: string
  } | null
  customProgram?: string | null
  assignments: Array<{
    id: string
    status: string
    instructor: {
      id: string
      name: string
    }
  }>
}

interface School {
  id: string
  name: string
  region: string
}

interface Program {
  id: string
  name: string
  category: string
}

interface TransportSettings {
  transport_0_20: string
  transport_20_40: string
  transport_40_60: string
  transport_60_80: string
  transport_80_plus: string
}

interface RequestListProps {
  initialRequests: Request[]
  availableInstructors: Instructor[]
  schools: School[]
  programs: Program[]
  transportSettings: TransportSettings
}

// 거리 기반 교통비 계산 함수
function calculateTransportFee(distanceKm: number, settings: TransportSettings): number {
  if (distanceKm <= 20) return parseInt(settings.transport_0_20) || 0
  if (distanceKm <= 40) return parseInt(settings.transport_20_40) || 15000
  if (distanceKm <= 60) return parseInt(settings.transport_40_60) || 25000
  if (distanceKm <= 80) return parseInt(settings.transport_60_80) || 35000
  return parseInt(settings.transport_80_plus) || 45000
}

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  QUOTED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: '접수됨',
  QUOTED: '견적 발송',
  ASSIGNED: '강사 배정',
  CONFIRMED: '확정됨',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
}

const filters = [
  {
    key: 'status',
    label: '상태',
    multiple: true,
    options: [
      { value: 'SUBMITTED', label: '접수됨' },
      { value: 'QUOTED', label: '견적 발송' },
      { value: 'ASSIGNED', label: '강사 배정' },
      { value: 'CONFIRMED', label: '확정됨' },
      { value: 'COMPLETED', label: '완료' },
      { value: 'CANCELLED', label: '취소됨' },
    ],
  },
  {
    key: 'region',
    label: '지역',
    multiple: true,
    options: [
      { value: '영주', label: '영주' },
      { value: '안동', label: '안동' },
      { value: '봉화', label: '봉화' },
      { value: '예천', label: '예천' },
      { value: '문경', label: '문경' },
    ],
  },
]

const sortOptions = [
  { key: 'requestNumber', label: '요청번호' },
  { key: 'sessions', label: '차시' },
  { key: 'studentCount', label: '학생수' },
]

export default function RequestList({ initialRequests, availableInstructors, schools, programs, transportSettings }: RequestListProps) {
  const router = useRouter()
  const [requests] = useState(initialRequests)
  const [filteredRequests, setFilteredRequests] = useState(initialRequests)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [currentSort, setCurrentSort] = useState<{ key: string; label: string; direction: 'asc' | 'desc' } | null>(null)
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [assignDistanceKm, setAssignDistanceKm] = useState('')
  const [assignTransportFee, setAssignTransportFee] = useState('')
  const [assignScheduledDate, setAssignScheduledDate] = useState('')
  const [assignScheduledTime, setAssignScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailRequest, setDetailRequest] = useState<Request | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    schoolId: '',
    programId: '',
    customProgram: '',
    sessions: '2',
    studentCount: '25',
    targetGrade: '',
    desiredDate: '',
    alternateDate: '',
    schoolBudget: '',
    requirements: '',
  })

  const applyFilters = (
    query: string,
    filters: Record<string, string[]>,
    dates: { start: Date | null; end: Date | null } = dateRange,
    sort: { key: string; direction: 'asc' | 'desc' } | null = currentSort
  ) => {
    let result = requests

    if (query) {
      const lowerQuery = query.toLowerCase()
      result = result.filter(
        (r) =>
          r.school.name.toLowerCase().includes(lowerQuery) ||
          r.program?.name.toLowerCase().includes(lowerQuery) ||
          r.customProgram?.toLowerCase().includes(lowerQuery) ||
          r.requestNumber.toLowerCase().includes(lowerQuery)
      )
    }

    // 다중 선택 필터링
    if (filters.status?.length > 0) {
      result = result.filter((r) => filters.status.includes(r.status))
    }

    if (filters.region?.length > 0) {
      result = result.filter((r) => filters.region.some(region => r.school.region.includes(region)))
    }

    // 날짜 범위 필터링
    if (dates.start || dates.end) {
      result = result.filter((r) => {
        if (!r.preferredDates || r.preferredDates.length === 0) return false
        return r.preferredDates.some(dateStr => {
          const date = new Date(dateStr)
          if (dates.start && date < dates.start) return false
          if (dates.end && date > dates.end) return false
          return true
        })
      })
    }

    // 정렬 적용
    if (sort) {
      result = [...result].sort((a, b) => {
        const aVal = a[sort.key as keyof Request]
        const bVal = b[sort.key as keyof Request]
        const modifier = sort.direction === 'asc' ? 1 : -1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * modifier
        }
        return ((Number(aVal) || 0) - (Number(bVal) || 0)) * modifier
      })
    }

    setFilteredRequests(result)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(query, activeFilters)
  }

  const handleFilter = (filters: Record<string, string[]>) => {
    setActiveFilters(filters)
    applyFilters(searchQuery, filters)
  }

  const handleDateChange = (range: { start: Date | null; end: Date | null }) => {
    setDateRange(range)
    applyFilters(searchQuery, activeFilters, range)
  }

  const handleSort = (sort: { key: string; label: string; direction: 'asc' | 'desc' } | null) => {
    setCurrentSort(sort)
    applyFilters(searchQuery, activeFilters, dateRange, sort)
  }

  const openAssignModal = (request: Request) => {
    setSelectedRequest(request)
    setSelectedInstructorId('')
    setAssignDistanceKm('')
    setAssignTransportFee('')
    // 희망일이 있으면 기본값으로 설정
    const preferredDate = request.preferredDates?.[0] || ''
    setAssignScheduledDate(preferredDate ? preferredDate.split('T')[0] : '')
    setAssignScheduledTime('')
    setIsAssignModalOpen(true)
  }

  const handleDistanceChange = (value: string) => {
    const distance = parseInt(value) || 0
    const transportFee = calculateTransportFee(distance, transportSettings)
    setAssignDistanceKm(value)
    setAssignTransportFee(transportFee.toString())
  }

  const openDetailModal = (request: Request) => {
    setDetailRequest(request)
    setIsDetailModalOpen(true)
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequest.schoolId) return

    setLoading(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      })

      if (res.ok) {
        setIsCreateModalOpen(false)
        setNewRequest({
          schoolId: '',
          programId: '',
          customProgram: '',
          sessions: '2',
          studentCount: '25',
          targetGrade: '',
          desiredDate: '',
          alternateDate: '',
          schoolBudget: '',
          requirements: '',
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !selectedInstructorId) return

    setLoading(true)

    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: selectedInstructorId,
          scheduledDate: assignScheduledDate || null,
          scheduledTime: assignScheduledTime || null,
          distanceKm: assignDistanceKm,
          transportFee: assignTransportFee,
        }),
      })

      if (res.ok) {
        setIsAssignModalOpen(false)
        setSelectedRequest(null)
        setSelectedInstructorId('')
        setAssignDistanceKm('')
        setAssignTransportFee('')
        setAssignScheduledDate('')
        setAssignScheduledTime('')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to assign instructor:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendedInstructors = () => {
    if (!selectedRequest) return availableInstructors

    return availableInstructors.filter((instructor) => {
      // Filter by status
      if (instructor.status !== 'ACTIVE') return false

      // Match by subject if possible
      const programCategory = selectedRequest.program?.category
      if (programCategory) {
        const hasMatchingSubject = instructor.subjects.some((s) => {
          if (programCategory === 'AI_CODING') return s.includes('AI') || s.includes('코딩')
          if (programCategory === 'MAKER') return s.includes('메이커') || s.includes('3D')
          if (programCategory === 'SCIENCE') return s.includes('과학')
          if (programCategory === 'CAREER') return s.includes('진로')
          return true
        })
        if (!hasMatchingSubject) return false
      }

      return true
    }).sort((a, b) => {
      // Sort by region match
      const aRegionMatch = a.homeBase === selectedRequest.school.region
      const bRegionMatch = b.homeBase === selectedRequest.school.region
      if (aRegionMatch && !bRegionMatch) return -1
      if (!aRegionMatch && bRegionMatch) return 1
      return 0
    })
  }

  const statusTabs = [
    { value: '', label: '전체', count: requests.length },
    { value: 'SUBMITTED', label: '접수됨', count: requests.filter((r) => r.status === 'SUBMITTED').length },
    { value: 'QUOTED', label: '견적발송', count: requests.filter((r) => r.status === 'QUOTED').length },
    { value: 'ASSIGNED', label: '배정완료', count: requests.filter((r) => r.status === 'ASSIGNED').length },
    { value: 'COMPLETED', label: '완료', count: requests.filter((r) => r.status === 'COMPLETED').length },
  ]

  const handleExportExcel = () => {
    const exportData = filteredRequests.map(request => ({
      schoolName: request.school.name,
      programName: request.program?.name || request.customProgram || '',
      preferredDate: request.preferredDates?.join(', ') || '',
      sessions: request.sessions,
      studentCount: request.studentCount,
      contactName: '',
      contactPhone: '',
      statusLabel: statusLabels[request.status] || request.status,
      instructorName: request.assignments?.[0]?.instructor?.name || '',
      createdAt: '',
    }))
    exportToExcel({
      filename: '학교요청목록',
      sheetName: '요청',
      columns: requestExcelConfig,
      data: exportData,
    })
  }

  return (
    <>
      {/* Header with AdvancedSearchFilter */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
        <div className="flex-1">
          <AdvancedSearchFilter
            placeholder="학교명, 프로그램, 요청번호로 검색..."
            filters={filters}
            sortOptions={sortOptions}
            showDateFilter={true}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onDateChange={handleDateChange}
            onSort={handleSort}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ExportButton onClick={handleExportExcel} />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            + 새 요청 등록
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="mb-6 grid grid-cols-5 gap-2">
        {statusTabs.map((tab) => (
          <div
            key={tab.value}
            className="bg-white rounded-lg border border-gray-200 p-3 text-center"
          >
            <div className="text-2xl font-bold text-gray-900">{tab.count}</div>
            <div className="text-xs text-gray-500">{tab.label}</div>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <ResponsiveList
        mobileView={
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">요청이 없습니다</h3>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onSelect={() => openDetailModal(request)}
                  onAssign={() => openAssignModal(request)}
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
                  요청번호
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  학교
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  프로그램
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  차시/인원
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  예산
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  상태
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  배정 강사
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">요청이 없습니다</h3>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const assignment = request.assignments?.[0]
                  const canAutomate = request.status === 'SUBMITTED'
                  const canAssign = ['SUBMITTED', 'QUOTED'].includes(request.status) && !assignment

                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {request.requestNumber}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {request.school.name}
                        <div className="text-xs text-gray-500">
                          {request.school.region}
                          {Number(request.school.distanceKm || 0) > 0 && ` (${request.school.distanceKm}km)`}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {request.program?.name || request.customProgram}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {request.sessions}차시 / {request.studentCount}명
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {request.schoolBudget
                          ? `${Number(request.schoolBudget).toLocaleString()}원`
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[request.status]}`}
                        >
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {assignment ? (
                          <div>
                            <div className="font-medium">{assignment.instructor.name}</div>
                            <div className="text-xs text-gray-500">
                              {assignment.status === 'CONFIRMED' ? '확정됨' : '제안됨'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          {canAutomate && (
                            <AutomateButton requestId={request.id} />
                          )}
                          {canAssign && (
                            <button
                              onClick={() => openAssignModal(request)}
                              className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                            >
                              <UserPlusIcon className="h-3.5 w-3.5" />
                              수동 배정
                            </button>
                          )}
                          <button
                            onClick={() => openDetailModal(request)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            상세
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </ResponsiveList>

      {/* Assign Modal */}
      <FormModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="강사 수동 배정"
        size="lg"
      >
        {selectedRequest && (
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="font-medium text-gray-900">{selectedRequest.school.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedRequest.program?.name || selectedRequest.customProgram}
                <span className="mx-2">·</span>
                {selectedRequest.sessions}차시
                <span className="mx-2">·</span>
                {selectedRequest.studentCount}명
              </p>
              {selectedRequest.preferredDates && selectedRequest.preferredDates.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  희망일: {selectedRequest.preferredDates.slice(0, 3).join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강사 선택 *
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getRecommendedInstructors().length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    조건에 맞는 강사가 없습니다.
                  </p>
                ) : (
                  getRecommendedInstructors().map((instructor) => {
                    const isRegionMatch = instructor.homeBase === selectedRequest.school.region

                    return (
                      <label
                        key={instructor.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedInstructorId === instructor.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="instructor"
                          value={instructor.id}
                          checked={selectedInstructorId === instructor.id}
                          onChange={() => setSelectedInstructorId(instructor.id)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{instructor.name}</span>
                            {isRegionMatch && (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                지역 일치
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {instructor.homeBase} · {instructor.rangeKm}km
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {instructor.subjects.join(', ')}
                          </div>
                        </div>
                        {selectedInstructorId === instructor.id && (
                          <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* 수업 일정 입력 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수업 날짜 *
                </label>
                <input
                  type="date"
                  value={assignScheduledDate}
                  onChange={(e) => setAssignScheduledDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                {selectedRequest?.preferredDates && selectedRequest.preferredDates.length > 0 && (
                  <p className="mt-1 text-xs text-blue-600">
                    희망일: {selectedRequest.preferredDates.slice(0, 2).map(d =>
                      new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    ).join(', ')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수업 시간
                </label>
                <input
                  type="time"
                  value={assignScheduledTime}
                  onChange={(e) => setAssignScheduledTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  예: 09:00, 13:30
                </p>
              </div>
            </div>

            {/* 거리 및 교통비 입력 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  강사-학교 거리 (km)
                </label>
                <input
                  type="number"
                  value={assignDistanceKm}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  placeholder="거리를 입력하면 교통비가 자동 계산됩니다"
                  min="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  0-20km: {parseInt(transportSettings.transport_0_20).toLocaleString()}원 |
                  20-40km: {parseInt(transportSettings.transport_20_40).toLocaleString()}원 |
                  40-60km: {parseInt(transportSettings.transport_40_60).toLocaleString()}원
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  교통비 (원)
                </label>
                <input
                  type="number"
                  value={assignTransportFee}
                  onChange={(e) => setAssignTransportFee(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  자동 계산 후 필요 시 수동 조정 가능
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !selectedInstructorId}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? '배정 중...' : '배정하기'}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      {/* Detail Modal */}
      <FormModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="요청 상세 정보"
        size="lg"
      >
        {detailRequest && (
          <div className="space-y-6">
            {/* Request Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">요청번호</p>
                  <p className="font-semibold text-lg">{detailRequest.requestNumber}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusColors[detailRequest.status]}`}>
                  {statusLabels[detailRequest.status]}
                </span>
              </div>
            </div>

            {/* School Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">학교 정보</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">학교명</p>
                  <p className="font-medium">{detailRequest.school.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">지역</p>
                  <p className="font-medium">{detailRequest.school.region}</p>
                </div>
                {Number(detailRequest.school.distanceKm || 0) > 0 && (
                  <div>
                    <p className="text-gray-500">거리</p>
                    <p className="font-medium">{detailRequest.school.distanceKm}km</p>
                  </div>
                )}
              </div>
            </div>

            {/* Program Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">프로그램 정보</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">프로그램</p>
                  <p className="font-medium">{detailRequest.program?.name || detailRequest.customProgram || '-'}</p>
                </div>
                {detailRequest.program?.category && (
                  <div>
                    <p className="text-gray-500">카테고리</p>
                    <p className="font-medium">{detailRequest.program.category}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">차시</p>
                  <p className="font-medium">{detailRequest.sessions}차시</p>
                </div>
                <div>
                  <p className="text-gray-500">학생 수</p>
                  <p className="font-medium">{detailRequest.studentCount}명</p>
                </div>
                <div>
                  <p className="text-gray-500">예산</p>
                  <p className="font-medium">
                    {detailRequest.schoolBudget
                      ? `${Number(detailRequest.schoolBudget).toLocaleString()}원`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Preferred Dates */}
            {detailRequest.preferredDates && detailRequest.preferredDates.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">희망 날짜</h4>
                <div className="flex flex-wrap gap-2">
                  {detailRequest.preferredDates.map((date, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment Info */}
            {detailRequest.assignments && detailRequest.assignments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">배정 강사</h4>
                <div className="space-y-2">
                  {detailRequest.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium">{assignment.instructor.name}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        assignment.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.status === 'CONFIRMED' ? '확정됨' : '제안됨'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="새 요청 등록"
        size="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학교 *
              </label>
              <select
                value={newRequest.schoolId}
                onChange={(e) => setNewRequest({ ...newRequest, schoolId: e.target.value })}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">학교 선택</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.region})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로그램
              </label>
              <select
                value={newRequest.programId}
                onChange={(e) => setNewRequest({ ...newRequest, programId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">프로그램 선택</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기타 프로그램 (선택사항)
            </label>
            <input
              type="text"
              value={newRequest.customProgram}
              onChange={(e) => setNewRequest({ ...newRequest, customProgram: e.target.value })}
              placeholder="기타 프로그램명 입력"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                차시 *
              </label>
              <input
                type="number"
                value={newRequest.sessions}
                onChange={(e) => setNewRequest({ ...newRequest, sessions: e.target.value })}
                required
                min="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학생 수 *
              </label>
              <input
                type="number"
                value={newRequest.studentCount}
                onChange={(e) => setNewRequest({ ...newRequest, studentCount: e.target.value })}
                required
                min="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대상 학년
              </label>
              <input
                type="text"
                value={newRequest.targetGrade}
                onChange={(e) => setNewRequest({ ...newRequest, targetGrade: e.target.value })}
                placeholder="예: 중2"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희망 날짜
              </label>
              <input
                type="date"
                value={newRequest.desiredDate}
                onChange={(e) => setNewRequest({ ...newRequest, desiredDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예산 (원)
              </label>
              <input
                type="number"
                value={newRequest.schoolBudget}
                onChange={(e) => setNewRequest({ ...newRequest, schoolBudget: e.target.value })}
                placeholder="예: 200000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              요청사항
            </label>
            <textarea
              value={newRequest.requirements}
              onChange={(e) => setNewRequest({ ...newRequest, requirements: e.target.value })}
              rows={3}
              placeholder="특별 요청사항이나 메모를 입력하세요"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !newRequest.schoolId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
