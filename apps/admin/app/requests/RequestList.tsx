'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClockIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import AutomateButton from './AutomateButton'
import FormModal from '../../components/FormModal'

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

interface RequestListProps {
  initialRequests: Request[]
  availableInstructors: Instructor[]
  schools: School[]
  programs: Program[]
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

export default function RequestList({ initialRequests, availableInstructors, schools, programs }: RequestListProps) {
  const router = useRouter()
  const [requests] = useState(initialRequests)
  const [filteredRequests, setFilteredRequests] = useState(initialRequests)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
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

  const applyFilters = (query: string, status: string) => {
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

    if (status) {
      result = result.filter((r) => r.status === status)
    }

    setFilteredRequests(result)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    applyFilters(query, statusFilter)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    applyFilters(searchQuery, status)
  }

  const openAssignModal = (request: Request) => {
    setSelectedRequest(request)
    setSelectedInstructorId('')
    setIsAssignModalOpen(true)
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
        body: JSON.stringify({ instructorId: selectedInstructorId }),
      })

      if (res.ok) {
        setIsAssignModalOpen(false)
        setSelectedRequest(null)
        setSelectedInstructorId('')
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

  return (
    <>
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="학교명, 프로그램으로 검색..."
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          />
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          + 새 요청 등록
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              statusFilter === tab.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 rounded-full bg-white px-2 py-0.5 text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Requests Table */}
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
                        {request.school.distanceKm && ` (${request.school.distanceKm}km)`}
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
                {detailRequest.school.distanceKm && (
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
