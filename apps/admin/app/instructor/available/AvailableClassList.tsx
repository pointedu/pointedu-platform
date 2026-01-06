'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface ClassItem {
  id: string
  requestNumber: string
  school: {
    id: string
    name: string
    address: string
    region: string
  }
  program: {
    id: string
    name: string
  } | null
  customProgram: string | null
  sessions: number
  studentCount: number
  targetGrade: string
  desiredDate: string | null
  alternateDate: string | null
  requirements: string | null
  applications: {
    instructorId: string
    status: string
  }[]
}

interface Props {
  classes: ClassItem[]
  instructorId: string
  appliedRequestIds: string[]
}

export default function AvailableClassList({ classes, instructorId, appliedRequestIds }: Props) {
  const router = useRouter()
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)

  const handleApplyClick = (classItem: ClassItem) => {
    setSelectedClass(classItem)
    setMessage('')
    setShowModal(true)
  }

  const handleApply = async () => {
    if (!selectedClass) return

    setApplyingId(selectedClass.id)

    try {
      const res = await fetch('/api/instructor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedClass.id,
          instructorId,
          message,
        }),
      })

      if (!res.ok) {
        throw new Error('지원에 실패했습니다.')
      }

      setShowModal(false)
      router.refresh()
    } catch (error) {
      console.error('Apply error:', error)
      alert('지원 중 오류가 발생했습니다.')
    } finally {
      setApplyingId(null)
    }
  }

  const hasApplied = (classId: string) => {
    return appliedRequestIds.includes(classId)
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-gray-500">현재 지원 가능한 수업이 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {classes.map((classItem) => {
          const applied = hasApplied(classItem.id)
          const applicationCount = classItem.applications.length

          return (
            <div key={classItem.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{classItem.school.name}</h3>
                    <span className="text-xs text-gray-500">#{classItem.requestNumber}</span>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                      <span>{classItem.program?.name || classItem.customProgram}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span>{classItem.school.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>
                        {classItem.desiredDate
                          ? new Date(classItem.desiredDate).toLocaleDateString('ko-KR')
                          : '일정 협의'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <span>
                        {classItem.targetGrade} · {classItem.studentCount}명 · {classItem.sessions}
                        차시
                      </span>
                    </div>
                  </div>

                  {classItem.requirements && (
                    <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      {classItem.requirements}
                    </p>
                  )}

                  {applicationCount > 0 && (
                    <p className="mt-2 text-xs text-blue-600">
                      {applicationCount}명의 강사가 지원했습니다
                    </p>
                  )}
                </div>

                <div className="ml-4">
                  {applied ? (
                    <span className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                      <CheckCircleIcon className="h-4 w-4" />
                      지원완료
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplyClick(classItem)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      지원하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Apply Modal */}
      {showModal && selectedClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900">수업 지원</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedClass.school.name} - {selectedClass.program?.name || selectedClass.customProgram}
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  지원 메시지 (선택)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="관리자에게 전달할 메시지가 있으면 작성해주세요."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleApply}
                  disabled={applyingId === selectedClass.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {applyingId === selectedClass.id ? '처리중...' : '지원하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
