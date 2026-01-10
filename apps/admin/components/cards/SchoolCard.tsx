'use client'

import { memo } from 'react'
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface School {
  id: string
  name: string
  type: string
  address: string
  region: string
  phoneNumber: string
  distanceKm?: number | null
  _count: { requests: number }
}

interface SchoolCardProps {
  school: School
  onEdit: () => void
  onDelete: () => void
}

const schoolTypes: Record<string, string> = {
  ELEMENTARY: '초등학교',
  MIDDLE: '중학교',
  HIGH: '고등학교',
  SPECIAL: '특수학교',
  ALTERNATIVE: '대안학교',
}

function SchoolCard({ school, onEdit, onDelete }: SchoolCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{school.name}</h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {schoolTypes[school.type] || school.type}
            </span>
          </div>
        </div>
        <span className="text-sm font-medium text-blue-600">
          {school._count.requests}건
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{school.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <a href={`tel:${school.phoneNumber}`} className="hover:text-blue-600">
            {school.phoneNumber}
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {school.region}
          {Number(school.distanceKm || 0) > 0 && ` · ${school.distanceKm}km`}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
        >
          <PencilIcon className="h-4 w-4" /> 수정
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
        >
          <TrashIcon className="h-4 w-4" /> 삭제
        </button>
      </div>
    </div>
  )
}

// React.memo로 불필요한 리렌더링 방지
export default memo(SchoolCard)
