'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'
import ExportButton from '../../components/ExportButton'
import ResponsiveList from '../../components/ResponsiveList'
import SchoolCard from '../../components/cards/SchoolCard'
import { exportToExcel, schoolExcelConfig } from '../../lib/excel'

interface School {
  id: string
  name: string
  type: string
  address: string
  region: string
  phoneNumber: string
  email?: string | null
  distanceKm?: number | null
  transportFee?: number | null
  totalStudents?: number | null
  active: boolean
  _count: { requests: number }
}

const schoolTypes = {
  ELEMENTARY: '초등학교',
  MIDDLE: '중학교',
  HIGH: '고등학교',
  SPECIAL: '특수학교',
  ALTERNATIVE: '대안학교',
}

export default function SchoolList({ initialSchools }: { initialSchools: School[] }) {
  const router = useRouter()
  const [schools, setSchools] = useState(initialSchools)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // initialSchools가 변경되면 상태 업데이트
  useEffect(() => {
    setSchools(initialSchools)
  }, [initialSchools])
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'MIDDLE',
    address: '',
    region: '',
    phoneNumber: '',
    email: '',
    distanceKm: '',
    transportFee: '',
    totalStudents: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'MIDDLE',
      address: '',
      region: '',
      phoneNumber: '',
      email: '',
      distanceKm: '',
      transportFee: '',
      totalStudents: '',
    })
    setEditingSchool(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (school: School) => {
    setEditingSchool(school)
    setFormData({
      name: school.name,
      type: school.type,
      address: school.address,
      region: school.region,
      phoneNumber: school.phoneNumber,
      email: school.email || '',
      distanceKm: school.distanceKm?.toString() || '',
      transportFee: school.transportFee?.toString() || '',
      totalStudents: school.totalStudents?.toString() || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingSchool
        ? `/api/schools/${editingSchool.id}`
        : '/api/schools'
      const method = editingSchool ? 'PUT' : 'POST'

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
      console.error('Failed to save school:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/schools/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete school:', error)
    }
  }

  const handleExportExcel = () => {
    const exportData = schools.map(school => ({
      name: school.name,
      address: school.address,
      contactName: '',
      contactPhone: school.phoneNumber,
      contactEmail: school.email || '',
      requestCount: school._count.requests,
    }))
    exportToExcel({
      filename: '학교목록',
      sheetName: '학교',
      columns: schoolExcelConfig,
      data: exportData,
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <ExportButton onClick={handleExportExcel} />
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
          학교 등록
        </button>
      </div>

      <ResponsiveList
        mobileView={
          <div className="space-y-4">
            {schools.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">등록된 학교가 없습니다</h3>
              </div>
            ) : (
              schools.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  onEdit={() => openEditModal(school)}
                  onDelete={() => handleDelete(school.id)}
                />
              ))
            )}
          </div>
        }
      >
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">학교명</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">유형</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">지역</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">연락처</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">거리/교통비</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">요청</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">등록된 학교가 없습니다</h3>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {school.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {schoolTypes[school.type as keyof typeof schoolTypes]}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        {school.region}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        {school.phoneNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {school.distanceKm ? `${school.distanceKm}km` : '-'} /
                      {school.transportFee ? ` ${Number(school.transportFee).toLocaleString()}원` : ' -'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {school._count.requests}건
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                      <button
                        onClick={() => openEditModal(school)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(school.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ResponsiveList>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchool ? '학교 수정' : '학교 등록'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">학교명 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">학교 유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(schoolTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">주소 *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">지역 *</label>
              <input
                type="text"
                required
                placeholder="예: 영주시"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">거리 (km)</label>
              <input
                type="number"
                value={formData.distanceKm}
                onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">교통비 (원)</label>
              <input
                type="number"
                value={formData.transportFee}
                onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">전체 학생수</label>
              <input
                type="number"
                value={formData.totalStudents}
                onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
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
              {loading ? '저장 중...' : editingSchool ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
