'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

interface Assignment {
  id: string
  status: string
  scheduledDate?: string | null
  scheduledTime?: string | null
  completedAt?: string | null
  request: {
    school: {
      name: string
      address?: string
    }
    program?: { name: string } | null
    customProgram?: string | null
    studentCount?: number
    sessions: number
    desiredDate?: string | null
  }
}

interface ScheduleListProps {
  assignments: Assignment[]
}

const statusLabels: Record<string, { label: string; color: string; dotColor: string }> = {
  PENDING: { label: '대기중', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-400' },
  PROPOSED: { label: '제안됨', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' },
  ACCEPTED: { label: '수락됨', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
  IN_PROGRESS: { label: '진행중', color: 'bg-indigo-100 text-indigo-800', dotColor: 'bg-indigo-500' },
  COMPLETED: { label: '완료', color: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
  CANCELLED: { label: '취소됨', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-400' },
  DECLINED: { label: '거절됨', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-400' },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function ScheduleList({ assignments }: ScheduleListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'both' | 'calendar' | 'list'>('both')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Group assignments by status
  const proposedAssignments = assignments.filter((a) =>
    ['PROPOSED', 'PENDING'].includes(a.status)
  )
  const upcomingAssignments = assignments.filter((a) =>
    ['CONFIRMED', 'ACCEPTED', 'IN_PROGRESS'].includes(a.status)
  )
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED')
  const cancelledAssignments = assignments.filter((a) =>
    ['CANCELLED', 'DECLINED'].includes(a.status)
  )

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay, year, month }
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Group assignments by date for calendar
  const assignmentsByDate = useMemo(() => {
    const grouped: Record<string, Assignment[]> = {}
    assignments.forEach((assignment) => {
      const dateStr = assignment.scheduledDate || assignment.request.desiredDate
      if (dateStr) {
        const date = new Date(dateStr)
        const key = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate())
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(assignment)
      }
    })
    return grouped
  }, [assignments])

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate)

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // Get assignments for selected date or all upcoming
  const displayedAssignments = useMemo(() => {
    if (selectedDate) {
      return assignmentsByDate[selectedDate] || []
    }
    return upcomingAssignments
  }, [selectedDate, assignmentsByDate, upcomingAssignments])

  const handleAccept = async (assignmentId: string) => {
    if (!confirm('이 수업을 수락하시겠습니까?')) return

    setLoading(assignmentId)
    try {
      const res = await fetch(`/api/instructor/assignments/${assignmentId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '수락 처리 중 오류가 발생했습니다.')
      }
    } catch (_error) {
      alert('수락 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const handleDecline = async (assignmentId: string) => {
    setLoading(assignmentId)
    try {
      const res = await fetch(`/api/instructor/assignments/${assignmentId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', reason: declineReason }),
      })

      if (res.ok) {
        setShowDeclineModal(null)
        setDeclineReason('')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '거절 처리 중 오류가 발생했습니다.')
      }
    } catch (_error) {
      alert('거절 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const renderAssignmentCard = (assignment: Assignment, showActions: boolean = false, compact: boolean = false) => (
    <div key={assignment.id} className={compact ? "p-4" : "p-6"}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : ''}`}>
              {assignment.request.school.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                statusLabels[assignment.status]?.color || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabels[assignment.status]?.label || assignment.status}
            </span>
          </div>
          <div className={`mt-2 space-y-1 text-sm text-gray-500 ${compact ? 'text-xs' : ''}`}>
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {assignment.request.program?.name || assignment.request.customProgram}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span>
                {assignment.scheduledDate ? (
                  new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })
                ) : assignment.request.desiredDate ? (
                  <span className="flex items-center gap-1">
                    {new Date(assignment.request.desiredDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                    <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">(희망일)</span>
                  </span>
                ) : (
                  <span className="text-red-500">일정 미정</span>
                )}
              </span>
            </div>
            {assignment.scheduledTime && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                <span>{assignment.scheduledTime}</span>
              </div>
            )}
            {!compact && assignment.request.school.address && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                <span>{assignment.request.school.address}</span>
              </div>
            )}
          </div>
          {!compact && (
            <div className="mt-2 text-sm">
              {Number(assignment.request.studentCount || 0) > 0 && (
                <>
                  <span className="text-gray-500">학생 수: </span>
                  <span className="font-medium">{assignment.request.studentCount}명</span>
                  <span className="mx-2 text-gray-300">|</span>
                </>
              )}
              <span className="text-gray-500">차시: </span>
              <span className="font-medium">{assignment.request.sessions}차시</span>
            </div>
          )}
        </div>

        {/* Accept/Decline buttons for proposed assignments */}
        {showActions && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => handleAccept(assignment.id)}
              disabled={loading === assignment.id}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />
              수락
            </button>
            <button
              onClick={() => setShowDeclineModal(assignment.id)}
              disabled={loading === assignment.id}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
              거절
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Calendar component
  const renderCalendar = () => {
    const today = new Date()
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
    const days: React.ReactNode[] = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day)
      const dayAssignments = assignmentsByDate[dateKey] || []
      const isToday = dateKey === todayKey
      const isSelected = dateKey === selectedDate

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
          className={`h-24 p-1 text-left border-t transition-colors ${
            isSelected
              ? 'bg-blue-50 ring-2 ring-blue-500'
              : isToday
              ? 'bg-yellow-50'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col h-full">
            <span
              className={`text-sm font-medium ${
                isToday
                  ? 'text-blue-600'
                  : isSelected
                  ? 'text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              {day}
            </span>
            <div className="flex-1 overflow-hidden">
              {dayAssignments.slice(0, 2).map((assignment, idx) => (
                <div
                  key={idx}
                  className={`text-xs px-1 py-0.5 rounded truncate mb-0.5 ${
                    statusLabels[assignment.status]?.color || 'bg-gray-100'
                  }`}
                  title={assignment.request.school.name}
                >
                  {assignment.request.school.name}
                </div>
              ))}
              {dayAssignments.length > 2 && (
                <div className="text-xs text-gray-500 px-1">
                  +{dayAssignments.length - 2}개 더
                </div>
              )}
            </div>
          </div>
        </button>
      )
    }

    return days
  }

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">제안된 수업</p>
          <p className="text-2xl font-bold text-yellow-600">{proposedAssignments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">예정된 수업</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingAssignments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">완료한 수업</p>
          <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">취소/거절</p>
          <p className="text-2xl font-bold text-gray-600">{cancelledAssignments.length}</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('both')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'both'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarDaysIcon className="h-4 w-4" />
            캘린더+목록
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            캘린더
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ListBulletIcon className="h-4 w-4" />
            목록
          </button>
        </div>
      </div>

      {/* Proposed Assignments - Need Response */}
      {proposedAssignments.length > 0 && (
        <div className="bg-yellow-50 rounded-lg shadow mb-6 border border-yellow-200">
          <div className="px-6 py-4 border-b border-yellow-200 bg-yellow-100 rounded-t-lg">
            <h2 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              응답 대기중인 수업 제안
            </h2>
            <p className="text-sm text-yellow-700 mt-1">
              아래 수업 제안에 수락 또는 거절로 응답해주세요.
            </p>
          </div>
          <div className="divide-y divide-yellow-200">
            {proposedAssignments.map((assignment) =>
              renderAssignmentCard(assignment, true)
            )}
          </div>
        </div>
      )}

      {/* Calendar and List View */}
      {viewMode === 'both' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {year}년 {month + 1}월
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                >
                  오늘
                </button>
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((day, idx) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 border-b ${
                    idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedDate ? (
                  <>
                    {new Date(selectedDate).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })} 수업
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="ml-2 text-sm font-normal text-blue-600 hover:text-blue-700"
                    >
                      전체 보기
                    </button>
                  </>
                ) : (
                  '예정된 수업'
                )}
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {displayedAssignments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CalendarIcon className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm">
                    {selectedDate ? '선택한 날짜에 수업이 없습니다.' : '예정된 수업이 없습니다.'}
                  </p>
                </div>
              ) : (
                displayedAssignments.map((assignment) => renderAssignmentCard(assignment, false, true))
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar Only View */
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {year}년 {month + 1}월
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
              >
                오늘
              </button>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 border-b ${
                  idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
            {renderCalendar()}
          </div>
          {selectedDate && assignmentsByDate[selectedDate] && (
            <div className="border-t p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })} 수업
              </h3>
              <div className="space-y-2">
                {assignmentsByDate[selectedDate].map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">
                          {assignment.request.school.name}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {assignment.request.program?.name || assignment.request.customProgram}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusLabels[assignment.status]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[assignment.status]?.label || assignment.status}
                      </span>
                    </div>
                    {assignment.scheduledTime && (
                      <p className="text-sm text-gray-500 mt-1">
                        <ClockIcon className="inline h-4 w-4 mr-1" />
                        {assignment.scheduledTime}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List Only View */
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">예정된 수업</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAssignments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">예정된 수업이 없습니다.</p>
              </div>
            ) : (
              upcomingAssignments.map((assignment) => renderAssignmentCard(assignment))
            )}
          </div>
        </div>
      )}

      {/* Completed Assignments */}
      {completedAssignments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">완료한 수업</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {completedAssignments.slice(0, 10).map((assignment) => (
              <div key={assignment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {assignment.request.school.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {assignment.request.program?.name || assignment.request.customProgram}
                    </p>
                    <p className="text-sm text-gray-500">
                      {assignment.completedAt
                        ? new Date(assignment.completedAt).toLocaleDateString('ko-KR')
                        : assignment.scheduledDate
                        ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    완료
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowDeclineModal(null)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                수업 거절
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                거절 사유를 입력해주세요. (선택사항)
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="거절 사유를 입력하세요..."
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeclineModal(null)
                    setDeclineReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDecline(showDeclineModal)}
                  disabled={loading === showDeclineModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  거절하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
