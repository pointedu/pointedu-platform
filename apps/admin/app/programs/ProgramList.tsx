'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'

interface Program {
  id: string
  name: string
  category: string
  description?: string | null
  duration: number
  maxStudents?: number | null
  basePrice?: number | null
  active: boolean
  _count: { requests: number }
}

const categoryLabels: Record<string, string> = {
  CAREER: '진로체험',
  AI_CODING: 'AI/코딩',
  MAKER: '메이커',
  SCIENCE: '과학실험',
  ART: '예술/창작',
  OTHER: '기타',
}

export default function ProgramList({ initialPrograms }: { initialPrograms: Program[] }) {
  const router = useRouter()
  const [programs, setPrograms] = useState(initialPrograms)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'CAREER',
    description: '',
    duration: '45',
    maxStudents: '',
    basePrice: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'CAREER',
      description: '',
      duration: '45',
      maxStudents: '',
      basePrice: '',
    })
    setEditingProgram(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (program: Program) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      category: program.category,
      description: program.description || '',
      duration: program.duration.toString(),
      maxStudents: program.maxStudents?.toString() || '',
      basePrice: program.basePrice?.toString() || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingProgram
        ? `/api/programs/${editingProgram.id}`
        : '/api/programs'
      const method = editingProgram ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsModalOpen(false)
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save program:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete program:', error)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
          프로그램 등록
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.length === 0 ? (
          <div className="col-span-full rounded-lg bg-white p-12 text-center shadow">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">등록된 프로그램이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새 프로그램을 등록해주세요.</p>
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {categoryLabels[program.category] || program.category}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{program.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(program)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(program.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {program.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{program.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {program.duration}분
                </span>
                {program.maxStudents && (
                  <span>최대 {program.maxStudents}명</span>
                )}
                {program.basePrice && (
                  <span className="flex items-center gap-1">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    {Number(program.basePrice).toLocaleString()}원
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  요청 수: {program._count.requests}건
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProgram ? '프로그램 수정' : '프로그램 등록'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">프로그램명 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">설명</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">수업 시간 (분) *</label>
              <input
                type="number"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">최대 학생 수</label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">기본 가격 (원)</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '저장 중...' : editingProgram ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
