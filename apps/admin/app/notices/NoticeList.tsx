'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import FormModal from '../../components/FormModal'
import {
  MegaphoneIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  MapPinIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface Notice {
  id: string
  title: string
  content: string
  category: string
  isPublished: boolean
  isPinned: boolean
  viewCount: number
  authorId: string
  authorName: string
  fileName?: string | null
  fileType?: string | null
  fileSize?: number | null
  filePath?: string | null
  createdAt: string
  updatedAt: string
}

interface NoticeListProps {
  initialNotices: Notice[]
}

const categoryOptions = [
  { value: 'GENERAL', label: '일반', color: 'bg-gray-100 text-gray-800', icon: DocumentTextIcon },
  { value: 'IMPORTANT', label: '중요', color: 'bg-red-100 text-red-800', icon: ExclamationCircleIcon },
  { value: 'EVENT', label: '이벤트', color: 'bg-blue-100 text-blue-800', icon: CalendarDaysIcon },
]

function getContentPreview(content: string, maxLength: number = 80) {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
  if (plainText.length <= maxLength) return plainText
  return plainText.substring(0, maxLength) + '...'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function NoticeList({ initialNotices }: NoticeListProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notices, setNotices] = useState(initialNotices)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeExistingFile, setRemoveExistingFile] = useState(false)

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    isPublished: true,
    isPinned: false,
  })

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'GENERAL',
      isPublished: true,
      isPinned: false,
    })
    setEditingNotice(null)
    setSelectedFile(null)
    setRemoveExistingFile(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openCreateModal = () => {
    resetForm()
    setIsFormModalOpen(true)
  }

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      isPublished: notice.isPublished,
      isPinned: notice.isPinned,
    })
    setSelectedFile(null)
    setRemoveExistingFile(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsFormModalOpen(true)
  }

  const openDetailModal = (notice: Notice) => {
    setSelectedNotice(notice)
    setIsDetailModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setRemoveExistingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingNotice
        ? `/api/notices/${editingNotice.id}`
        : '/api/notices'
      const method = editingNotice ? 'PUT' : 'POST'

      // FormData를 사용하여 파일 포함 요청
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('content', formData.content)
      submitData.append('category', formData.category)
      submitData.append('isPublished', String(formData.isPublished))
      submitData.append('isPinned', String(formData.isPinned))

      if (selectedFile) {
        submitData.append('file', selectedFile)
      }

      if (removeExistingFile) {
        submitData.append('removeFile', 'true')
      }

      const res = await fetch(url, {
        method,
        body: submitData,
      })

      if (res.ok) {
        setIsFormModalOpen(false)
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save notice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        startTransition(() => {
          setNotices(prev => prev.filter(n => n.id !== id))
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete notice:', error)
    } finally {
      setActionLoading(null)
    }
  }, [router])

  const togglePublish = async (notice: Notice) => {
    try {
      const res = await fetch(`/api/notices/${notice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notice,
          isPublished: !notice.isPublished,
        }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error)
    }
  }

  const togglePin = async (notice: Notice) => {
    try {
      const res = await fetch(`/api/notices/${notice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notice,
          isPinned: !notice.isPinned,
        }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

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
          공지사항 작성
        </button>
      </div>

      {initialNotices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  공지사항
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  분류
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  공개 상태
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  조회수
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  작성일
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notices.map((notice) => {
                const categoryInfo = getCategoryInfo(notice.category)
                const CategoryIcon = categoryInfo.icon
                return (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${categoryInfo.color.split(' ')[0]}`}>
                          <CategoryIcon className={`h-5 w-5 ${categoryInfo.color.split(' ')[1]}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {notice.isPinned && (
                              <MapPinIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <button
                              onClick={() => openDetailModal(notice)}
                              className="font-medium text-gray-900 hover:text-blue-600 text-left truncate"
                            >
                              {notice.title}
                            </button>
                            {notice.filePath && (
                              <PaperClipIcon className="h-4 w-4 text-gray-400 flex-shrink-0" title="첨부파일 있음" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {getContentPreview(notice.content)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      {notice.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <GlobeAltIcon className="h-4 w-4" />
                          공개
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <LockClosedIcon className="h-4 w-4" />
                          비공개
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {notice.viewCount}회
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-3 py-4 text-right text-sm">
                      <button
                        onClick={() => openDetailModal(notice)}
                        className="text-gray-400 hover:text-gray-700 mr-2"
                        title="상세 보기"
                      >
                        <EyeIcon className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => togglePin(notice)}
                        className={`mr-2 ${notice.isPinned ? 'text-red-600' : 'text-gray-400'} hover:text-red-700`}
                        title={notice.isPinned ? '고정 해제' : '상단 고정'}
                      >
                        <MapPinIcon className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => togglePublish(notice)}
                        className="text-gray-400 hover:text-gray-700 mr-2"
                        title={notice.isPublished ? '비공개로 변경' : '공개로 변경'}
                      >
                        {notice.isPublished ? (
                          <GlobeAltIcon className="h-4 w-4 inline" />
                        ) : (
                          <LockClosedIcon className="h-4 w-4 inline" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(notice)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="수정"
                      >
                        <PencilIcon className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        disabled={actionLoading === notice.id || isPending}
                        className={`text-red-600 hover:text-red-900 ${actionLoading === notice.id ? 'opacity-50 cursor-wait' : ''}`}
                        title="삭제"
                      >
                        {actionLoading === notice.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent inline-block" />
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

      {/* Detail View Modal */}
      <FormModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="공지사항 상세"
        size="lg"
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedNotice.isPinned && (
                  <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                    <MapPinIcon className="h-4 w-4" />
                    고정됨
                  </span>
                )}
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getCategoryInfo(selectedNotice.category).color}`}>
                  {getCategoryInfo(selectedNotice.category).label}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                조회수: {selectedNotice.viewCount}회
              </span>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedNotice.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                작성자: {selectedNotice.authorName} | {new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {selectedNotice.content}
              </div>
            </div>

            {/* 첨부파일 표시 */}
            {selectedNotice.filePath && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">첨부파일</h4>
                <a
                  href={selectedNotice.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <PaperClipIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{selectedNotice.fileName}</span>
                  {Number(selectedNotice.fileSize || 0) > 0 && (
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(Number(selectedNotice.fileSize || 0))})
                    </span>
                  )}
                  <ArrowDownTrayIcon className="h-4 w-4 text-blue-600" />
                </a>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false)
                  openEditModal(selectedNotice)
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Create/Edit Form Modal */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingNotice ? '공지사항 수정' : '공지사항 작성'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">제목 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="공지사항 제목을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">분류</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">공개</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">상단 고정</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">내용 *</label>
            <textarea
              required
              rows={10}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="공지사항 내용을 입력하세요"
            />
          </div>

          {/* 파일 첨부 섹션 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">첨부파일</label>

            {/* 기존 파일 표시 (수정 시) */}
            {editingNotice?.filePath && !removeExistingFile && !selectedFile && (
              <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{editingNotice.fileName}</span>
                  {Number(editingNotice.fileSize || 0) > 0 && (
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(Number(editingNotice.fileSize || 0))})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveExistingFile(true)}
                  className="text-red-600 hover:text-red-800"
                  title="파일 삭제"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* 파일 삭제 표시 */}
            {removeExistingFile && !selectedFile && (
              <div className="mt-2 flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-200">
                <span className="text-sm text-red-700">기존 파일이 삭제됩니다</span>
                <button
                  type="button"
                  onClick={() => setRemoveExistingFile(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  취소
                </button>
              </div>
            )}

            {/* 새 파일 선택 */}
            {selectedFile ? (
              <div className="mt-2 flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-blue-700">{selectedFile.name}</span>
                  <span className="text-xs text-blue-500">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  title="선택 취소"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <label className="flex justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <PaperClipIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      파일을 선택하거나 드래그하세요
                    </span>
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
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
              {loading ? '저장 중...' : editingNotice ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
