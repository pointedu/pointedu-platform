'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'

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

interface Instructor {
  id: string
  name: string
  homeBase: string
  subjects: string[]
}

interface BulkRequestItem {
  id: string
  programId: string
  customProgram: string
  instructorId: string
  sessions: number
  studentCount: number
  targetGrade: string
  scheduledTime: string
  note: string
}

interface BulkRequestModalProps {
  isOpen: boolean
  onClose: () => void
  schools: School[]
  programs: Program[]
  instructors: Instructor[]
}

export default function BulkRequestModal({
  isOpen,
  onClose,
  schools,
  programs,
  instructors,
}: BulkRequestModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [schoolId, setSchoolId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [items, setItems] = useState<BulkRequestItem[]>([
    createNewItem(),
  ])

  function createNewItem(): BulkRequestItem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      programId: '',
      customProgram: '',
      instructorId: '',
      sessions: 2,
      studentCount: 25,
      targetGrade: '',
      scheduledTime: '',
      note: '',
    }
  }

  const addItem = () => {
    setItems([...items, createNewItem()])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const duplicateItem = (item: BulkRequestItem) => {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof BulkRequestItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId || !scheduledDate || items.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          scheduledDate,
          items: items.map((item) => ({
            programId: item.programId || null,
            customProgram: item.customProgram || null,
            instructorId: item.instructorId || null,
            sessions: item.sessions,
            studentCount: item.studentCount,
            targetGrade: item.targetGrade,
            scheduledTime: item.scheduledTime,
            note: item.note,
          })),
        }),
      })

      if (res.ok) {
        const result = await res.json()
        alert(`${result.count}개의 요청이 등록되었습니다.`)
        onClose()
        resetForm()
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || '등록 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Failed to create bulk requests:', error)
      alert('등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSchoolId('')
    setScheduledDate('')
    setItems([createNewItem()])
  }

  // 시간 옵션 생성 (08:00 ~ 17:00)
  const timeOptions: string[] = []
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 10) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      timeOptions.push(time)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        resetForm()
      }}
      title="대량 수업 요청 등록"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 공통 정보 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">공통 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학교 *
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
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
                수업 날짜 *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 수업 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              수업 목록 ({items.length}개)
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              수업 추가
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    수업 #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateItem(item)}
                      className="text-gray-400 hover:text-blue-600"
                      title="복제"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {/* 과목/프로그램 */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      과목/프로그램
                    </label>
                    <select
                      value={item.programId}
                      onChange={(e) => updateItem(item.id, 'programId', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">선택 또는 직접입력</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                    {!item.programId && (
                      <input
                        type="text"
                        value={item.customProgram}
                        onChange={(e) => updateItem(item.id, 'customProgram', e.target.value)}
                        placeholder="직접 입력 (예: 에코코스메틱)"
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* 강사 */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      강사
                    </label>
                    <select
                      value={item.instructorId}
                      onChange={(e) => updateItem(item.id, 'instructorId', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">강사 선택 (선택사항)</option>
                      {instructors
                        .filter((i) => i.homeBase)
                        .map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name} ({instructor.homeBase})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* 수업 시간 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      수업 시간
                    </label>
                    <select
                      value={item.scheduledTime}
                      onChange={(e) => updateItem(item.id, 'scheduledTime', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">시간 선택</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 대상 학년 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      대상 학년
                    </label>
                    <input
                      type="text"
                      value={item.targetGrade}
                      onChange={(e) => updateItem(item.id, 'targetGrade', e.target.value)}
                      placeholder="예: 중2"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* 인원 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      인원
                    </label>
                    <input
                      type="number"
                      value={item.studentCount}
                      onChange={(e) => updateItem(item.id, 'studentCount', parseInt(e.target.value) || 25)}
                      min="1"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* 차시 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      차시
                    </label>
                    <input
                      type="number"
                      value={item.sessions}
                      onChange={(e) => updateItem(item.id, 'sessions', parseInt(e.target.value) || 2)}
                      min="1"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 메모 */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                    placeholder="메모 (예: 김진아 친구)"
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 추가 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const newItems = Array(5).fill(null).map(() => createNewItem())
              setItems([...items, ...newItems])
            }}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            +5개 추가
          </button>
          <button
            type="button"
            onClick={() => {
              const newItems = Array(10).fill(null).map(() => createNewItem())
              setItems([...items, ...newItems])
            }}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            +10개 추가
          </button>
        </div>

        {/* 요약 */}
        <div className="bg-gray-100 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">총 수업 수:</span>
            <span className="font-semibold">{items.length}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">강사 배정됨:</span>
            <span className="font-semibold">
              {items.filter((i) => i.instructorId).length}개
            </span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              onClose()
              resetForm()
            }}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || !schoolId || !scheduledDate || items.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? '등록 중...' : `${items.length}개 요청 등록`}
          </button>
        </div>
      </form>
    </FormModal>
  )
}
