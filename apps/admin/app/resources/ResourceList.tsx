'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import FormModal from '../../components/FormModal'
import {
  FolderIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

interface Instructor {
  id: string
  name: string
}

interface ResourceAccess {
  instructor: Instructor
}

interface Resource {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  isPublic: boolean
  downloadCount: number
  authorId: string
  authorName: string
  createdAt: string
  accessList: ResourceAccess[]
}

interface ResourceListProps {
  initialResources: Resource[]
  instructors: Instructor[]
}

const categoryOptions = [
  { value: 'GENERAL', label: '일반', color: 'bg-gray-100 text-gray-800' },
  { value: 'EDUCATION', label: '교육자료', color: 'bg-blue-100 text-blue-800' },
  { value: 'FORM', label: '서식', color: 'bg-green-100 text-green-800' },
  { value: 'MANUAL', label: '매뉴얼', color: 'bg-purple-100 text-purple-800' },
]

function getFileIcon(fileType: string) {
  if (fileType.includes('image')) return PhotoIcon
  if (fileType.includes('video')) return VideoCameraIcon
  if (fileType.includes('pdf')) return DocumentTextIcon
  return DocumentIcon
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ResourceList({ initialResources, instructors }: ResourceListProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    isPublic: true,
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'GENERAL',
      isPublic: true,
    })
    setUploadedFile(null)
    setEditingResource(null)
  }

  // INP 최적화: 폼 입력 핸들러
  const handleFormChange = useCallback((field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    startTransition(() => {
      setFormData(prev => ({ ...prev, [field]: value }))
    })
  }, [])

  const openCreateModal = () => {
    resetForm()
    setIsFormModalOpen(true)
  }

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description || '',
      category: resource.category,
      isPublic: resource.isPublic,
    })
    setIsFormModalOpen(true)
  }

  const openAccessModal = (resource: Resource) => {
    setSelectedResource(resource)
    setSelectedInstructors(resource.accessList.map((a) => a.instructor.id))
    setIsAccessModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.split('.').slice(0, -1).join('.'),
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingResource) {
        // Update existing resource
        const res = await fetch(`/api/resources/${editingResource.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (res.ok) {
          setIsFormModalOpen(false)
          resetForm()
          router.refresh()
        }
      } else {
        // Create new resource with file upload
        if (!uploadedFile) {
          alert('파일을 선택해주세요.')
          setLoading(false)
          return
        }

        const formDataToSend = new FormData()
        formDataToSend.append('file', uploadedFile)
        formDataToSend.append('title', formData.title)
        formDataToSend.append('description', formData.description)
        formDataToSend.append('category', formData.category)
        formDataToSend.append('isPublic', String(formData.isPublic))

        const res = await fetch('/api/resources', {
          method: 'POST',
          body: formDataToSend,
        })

        if (res.ok) {
          setIsFormModalOpen(false)
          resetForm()
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Failed to save resource:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' })
      if (res.ok) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      console.error('Failed to delete resource:', error)
    } finally {
      setActionLoading(null)
    }
  }, [router])

  const handleAccessUpdate = async () => {
    if (!selectedResource) return

    setLoading(true)
    try {
      const res = await fetch(`/api/resources/${selectedResource.id}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorIds: selectedInstructors }),
      })

      if (res.ok) {
        setIsAccessModalOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update access:', error)
    } finally {
      setLoading(false)
    }
  }

  // INP 최적화: 토글 핸들러
  const toggleInstructor = useCallback((instructorId: string) => {
    startTransition(() => {
      setSelectedInstructors((prev) =>
        prev.includes(instructorId)
          ? prev.filter((id) => id !== instructorId)
          : [...prev, instructorId]
      )
    })
  }, [])

  const getCategoryInfo = (category: string) => {
    return categoryOptions.find((c) => c.value === category) || categoryOptions[0]
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
          자료 업로드
        </button>
      </div>

      {initialResources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">등록된 자료가 없습니다.</p>
        </div>
      ) : (
        <div className={`bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden ${isPending ? 'opacity-70' : ''}`}>
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  자료명
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  분류
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  파일 크기
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  접근 권한
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  다운로드
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  등록일
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {initialResources.map((resource) => {
                const categoryInfo = getCategoryInfo(resource.category)
                const FileIcon = getFileIcon(resource.fileType)
                return (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                          <FileIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{resource.title}</div>
                          <div className="text-xs text-gray-500">{resource.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {formatFileSize(resource.fileSize)}
                    </td>
                    <td className="px-3 py-4 text-sm">
                      {resource.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <GlobeAltIcon className="h-4 w-4" />
                          전체 공개
                        </span>
                      ) : resource.accessList.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <UserGroupIcon className="h-4 w-4" />
                          {resource.accessList.length}명 지정
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <LockClosedIcon className="h-4 w-4" />
                          비공개
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {resource.downloadCount}회
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {new Date(resource.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-3 py-4 text-right text-sm">
                      <a
                        href={resource.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-700 mr-2"
                        title="다운로드"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 inline" />
                      </a>
                      <button
                        onClick={() => openAccessModal(resource)}
                        className="text-purple-600 hover:text-purple-900 mr-2"
                        title="접근 권한 설정"
                      >
                        <UserGroupIcon className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => openEditModal(resource)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="수정"
                      >
                        <PencilIcon className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        disabled={actionLoading === resource.id || isPending}
                        className={`text-red-600 hover:text-red-900 ${actionLoading === resource.id ? 'opacity-50 cursor-wait' : ''}`}
                        title="삭제"
                      >
                        {actionLoading === resource.id ? (
                          <div className="h-4 w-4 inline-block animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <TrashIcon className="h-4 w-4 inline" />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingResource ? '자료 수정' : '자료 업로드'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingResource && (
            <div>
              <label className="block text-sm font-medium text-gray-700">파일 *</label>
              <div className="mt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {uploadedFile && (
                <p className="mt-1 text-sm text-gray-500">
                  선택된 파일: {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">제목 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleFormChange('title')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="자료 제목을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">분류</label>
              <select
                value={formData.category}
                onChange={handleFormChange('category')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={handleFormChange('isPublic')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">전체 강사에게 공개</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">설명</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={handleFormChange('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="자료에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '처리 중...' : editingResource ? '수정' : '업로드'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Access Control Modal */}
      <FormModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        title="접근 권한 설정"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            이 자료에 접근할 수 있는 강사를 선택하세요.
            {selectedResource?.isPublic && (
              <span className="ml-2 text-green-600">(현재 전체 공개 상태입니다)</span>
            )}
          </p>

          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
            {instructors.length === 0 ? (
              <p className="text-gray-500 text-center">활성화된 강사가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {instructors.map((instructor) => (
                  <label
                    key={instructor.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstructors.includes(instructor.id)}
                      onChange={() => toggleInstructor(instructor.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{instructor.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            선택된 강사: {selectedInstructors.length}명
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAccessModalOpen(false)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAccessUpdate}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </FormModal>
    </>
  )
}
