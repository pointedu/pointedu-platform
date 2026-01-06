'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'

interface Event {
  id: string
  title: string
  date: string
  instructor: string
  instructorId: string
  school: string
  schoolId: string
  program: string
  sessions: number
  status: string
}

interface School {
  id: string
  name: string
  region: string
}

interface Instructor {
  id: string
  name: string
  homeBase: string
  subjects: string[]
}

interface ScheduleCalendarProps {
  events: Event[]
  schools: School[]
  instructors: Instructor[]
}

const statusColors: Record<string, string> = {
  PROPOSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
}

export default function ScheduleCalendar({
  events,
  schools,
  instructors,
}: ScheduleCalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filterInstructor, setFilterInstructor] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    schoolId: '',
    programName: '',
    instructorId: '',
    date: '',
    sessions: '1',
    studentCount: '25',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      schoolId: '',
      programName: '',
      instructorId: '',
      date: selectedDate,
      sessions: '1',
      studentCount: '25',
      notes: '',
    })
  }

  const openAddModal = (date?: string) => {
    if (date) {
      setSelectedDate(date)
      setFormData((prev) => ({ ...prev, date }))
    }
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: formData.schoolId,
          programName: formData.programName,
          instructorId: formData.instructorId,
          date: formData.date,
          sessions: parseInt(formData.sessions),
          studentCount: parseInt(formData.studentCount),
          notes: formData.notes,
        }),
      })

      if (res.ok) {
        setIsAddModalOpen(false)
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filterInstructor && event.instructorId !== filterInstructor) return false
    if (filterSchool && event.schoolId !== filterSchool) return false
    return true
  })

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const calendarDays = getCalendarDays()
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ]
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <>
      {/* Filters and Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterInstructor}
              onChange={(e) => setFilterInstructor(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">전체 강사</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">전체 학교</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => openAddModal(formatDateForInput(new Date()))}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
          일정 추가
        </button>
      </div>

      {/* Calendar Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={goToPreviousMonth}
              className="rounded-md p-2 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="rounded-md p-2 hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            오늘
          </button>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              viewMode === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              viewMode === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            주간
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`py-3 text-center text-sm font-semibold ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day.date)
            const dateStr = formatDateForInput(day.date)

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r p-2 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                onClick={() => day.isCurrentMonth && openAddModal(dateStr)}
              >
                <div
                  className={`mb-1 text-sm font-medium ${
                    !day.isCurrentMonth
                      ? 'text-gray-400'
                      : isToday(day.date)
                      ? 'flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white'
                      : index % 7 === 0
                      ? 'text-red-600'
                      : index % 7 === 6
                      ? 'text-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => e.stopPropagation()}
                      className={`cursor-pointer truncate rounded border px-1.5 py-0.5 text-xs ${statusColors[event.status]}`}
                    >
                      {event.school.slice(0, 6)}... - {event.instructor}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-yellow-200 bg-yellow-100"></div>
          <span className="text-gray-600">제안됨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-green-200 bg-green-100"></div>
          <span className="text-gray-600">확정됨</span>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">예정된 일정</h3>
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">예정된 일정이 없습니다.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">날짜</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">학교</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">프로그램</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">강사</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.slice(0, 10).map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(event.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{event.school}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{event.program}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{event.instructor}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[event.status]}`}>
                        {event.status === 'CONFIRMED' ? '확정' : '제안'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="일정 추가"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">학교 *</label>
              <select
                required
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              <label className="block text-sm font-medium text-gray-700">강사 *</label>
              <select
                required
                value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">강사 선택</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.homeBase})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">프로그램명 *</label>
            <input
              type="text"
              required
              value={formData.programName}
              onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
              placeholder="예: AI 진로체험"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">날짜 *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">차시 수</label>
              <input
                type="number"
                min="1"
                value={formData.sessions}
                onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">학생 수</label>
              <input
                type="number"
                min="1"
                value={formData.studentCount}
                onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">비고</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="특이사항이나 메모를 입력하세요"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '추가 중...' : '일정 추가'}
            </button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
