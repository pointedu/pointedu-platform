'use client'

import { memo } from 'react'
import {
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Instructor {
  id: string
  name: string
  homeBase: string
  phoneNumber: string
  subjects: string[]
  rangeKm: string
  availableDays: string[]
  status: string
  _count: { assignments: number; payments: number }
}

interface InstructorCardProps {
  instructor: Instructor
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onApprove?: () => void
  onReject?: () => void
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<string, string> = {
  PENDING: '승인대기',
  ACTIVE: '활동중',
  INACTIVE: '휴면',
  ON_LEAVE: '휴직',
  TERMINATED: '퇴사',
  REJECTED: '거절됨',
}

function InstructorCard({
  instructor,
  onSelect,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: InstructorCardProps) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
      onClick={onSelect}
    >
      {/* 헤더: 이름 + 상태 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{instructor.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {instructor.homeBase}
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[instructor.status]}`}>
          {statusLabels[instructor.status]}
        </span>
      </div>

      {/* 연락처 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <PhoneIcon className="h-4 w-4" />
        <a href={`tel:${instructor.phoneNumber}`} className="hover:text-blue-600">
          {instructor.phoneNumber}
        </a>
      </div>

      {/* 과목 태그 */}
      <div className="flex flex-wrap gap-1.5">
        {instructor.subjects.slice(0, 3).map((subject) => (
          <span key={subject} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
            {subject}
          </span>
        ))}
        {instructor.subjects.length > 3 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            +{instructor.subjects.length - 3}
          </span>
        )}
      </div>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{instructor.rangeKm}km</p>
          <p className="text-xs text-gray-500">활동범위</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-blue-600">{instructor._count.assignments}</p>
          <p className="text-xs text-gray-500">배정</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-green-600">{instructor._count.payments}</p>
          <p className="text-xs text-gray-500">정산</p>
        </div>
      </div>

      {/* 가능 요일 */}
      <div className="flex justify-center gap-1 pt-2">
        {['월', '화', '수', '목', '금'].map((day) => (
          <span
            key={day}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
              instructor.availableDays.includes(day)
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        {instructor.status === 'PENDING' ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove?.() }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
            >
              <CheckIcon className="h-4 w-4" /> 승인
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReject?.() }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
            >
              <XMarkIcon className="h-4 w-4" /> 거절
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
            >
              <PencilIcon className="h-4 w-4" /> 수정
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
            >
              <TrashIcon className="h-4 w-4" /> 삭제
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// React.memo로 불필요한 리렌더링 방지
export default memo(InstructorCard)
