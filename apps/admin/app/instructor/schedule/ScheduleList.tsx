'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
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
  }
}

interface ScheduleListProps {
  assignments: Assignment[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-gray-100 text-gray-800' },
  PROPOSED: { label: '제안됨', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: '수락됨', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-800' },
  IN_PROGRESS: { label: '진행중', color: 'bg-indigo-100 text-indigo-800' },
  COMPLETED: { label: '완료', color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: '취소됨', color: 'bg-red-100 text-red-800' },
  DECLINED: { label: '거절됨', color: 'bg-red-100 text-red-800' },
}

export default function ScheduleList({ assignments }: ScheduleListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null)

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
    } catch (error) {
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
    } catch (error) {
      alert('거절 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const renderAssignmentCard = (assignment: Assignment, showActions: boolean = false) => (
    <div key={assignment.id} className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
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
          <div className="mt-2 space-y-1 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-4 w-4" />
              <span>
                {assignment.request.program?.name || assignment.request.customProgram}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {assignment.scheduledDate
                  ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })
                  : '일정 미정'}
              </span>
            </div>
            {assignment.scheduledTime && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                <span>{assignment.scheduledTime}</span>
              </div>
            )}
            {assignment.request.school.address && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                <span>{assignment.request.school.address}</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            {assignment.request.studentCount && (
              <>
                <span className="text-gray-500">학생 수: </span>
                <span className="font-medium">{assignment.request.studentCount}명</span>
                <span className="mx-2 text-gray-300">|</span>
              </>
            )}
            <span className="text-gray-500">차시: </span>
            <span className="font-medium">{assignment.request.sessions}차시</span>
          </div>
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

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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

      {/* Upcoming Assignments */}
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
