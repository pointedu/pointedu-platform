'use client'

import { memo } from 'react'
import {
  BuildingOffice2Icon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

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

interface RequestCardProps {
  request: Request
  onSelect: () => void
  onAssign?: () => void
  onAutomate?: () => void
}

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  QUOTED: 'bg-blue-100 text-blue-800 border-blue-200',
  ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<string, string> = {
  SUBMITTED: '접수됨',
  QUOTED: '견적 발송',
  ASSIGNED: '강사 배정',
  CONFIRMED: '확정됨',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
}

function RequestCard({ request, onSelect, onAssign, onAutomate }: RequestCardProps) {
  const programName = request.program?.name || request.customProgram || '미정'
  const preferredDate = request.preferredDates?.[0] || '미정'
  const assignedInstructor = request.assignments?.[0]?.instructor?.name
  const canAutomate = request.status === 'SUBMITTED'
  const canAssign = ['SUBMITTED', 'QUOTED'].includes(request.status) && !assignedInstructor

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
      onClick={onSelect}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.school.name}</h3>
            <p className="text-sm text-gray-600">{programName}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      </div>

      {/* 요청번호 */}
      <div className="text-xs text-gray-500">
        요청번호: {request.requestNumber}
      </div>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span>{preferredDate}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span>{request.sessions}차시</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <UserGroupIcon className="h-4 w-4 text-gray-400" />
          <span>{request.studentCount}명</span>
        </div>
        {request.schoolBudget && (
          <div className="text-gray-600">
            예산: {Number(request.schoolBudget).toLocaleString()}원
          </div>
        )}
      </div>

      {/* 지역 정보 */}
      <div className="text-sm text-gray-500">
        {request.school.region}
        {Number(request.school.distanceKm || 0) > 0 && ` (${request.school.distanceKm}km)`}
      </div>

      {/* 배정 강사 */}
      {assignedInstructor && (
        <div className="pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">배정 강사: </span>
          <span className="text-sm font-medium text-gray-900">{assignedInstructor}</span>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        {canAutomate && onAutomate && (
          <button
            onClick={(e) => { e.stopPropagation(); onAutomate() }}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500"
          >
            자동 처리
          </button>
        )}
        {canAssign && onAssign && (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign() }}
            className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
          >
            수동 배정
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
        >
          상세
        </button>
      </div>
    </div>
  )
}

// React.memo로 불필요한 리렌더링 방지
export default memo(RequestCard)
