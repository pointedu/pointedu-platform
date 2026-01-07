'use client'

import { useState } from 'react'
import {
  MegaphoneIcon,
  XMarkIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

interface Notice {
  id: string
  title: string
  content: string
  category: string
  isPinned: boolean
  viewCount: number
  authorName: string
  fileName?: string | null
  fileSize?: number | null
  filePath?: string | null
  createdAt: string
}

interface NoticeViewProps {
  notices: Notice[]
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  GENERAL: { label: '일반', color: 'bg-gray-100 text-gray-800' },
  IMPORTANT: { label: '중요', color: 'bg-red-100 text-red-800' },
  EVENT: { label: '이벤트', color: 'bg-blue-100 text-blue-800' },
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function NoticeView({ notices }: NoticeViewProps) {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  const openDetail = async (notice: Notice) => {
    setSelectedNotice(notice)
    // 조회수 증가 API 호출
    try {
      await fetch(`/api/notices/${notice.id}`)
    } catch (_e) {
      // 조회수 실패해도 무시
    }
  }

  return (
    <>
      {notices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {notices.map((notice) => (
            <button
              key={notice.id}
              onClick={() => openDetail(notice)}
              className="w-full p-6 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                {notice.isPinned && (
                  <div className="flex-shrink-0 mt-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                      <MapPinIcon className="w-3 h-3 text-red-600" />
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        categoryLabels[notice.category]?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {categoryLabels[notice.category]?.label || notice.category}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">{notice.title}</h3>
                    {notice.filePath && (
                      <PaperClipIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {notice.content.substring(0, 150)}...
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>{notice.authorName}</span>
                    <span>
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span>조회 {notice.viewCount}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30" onClick={() => setSelectedNotice(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  {selectedNotice.isPinned && (
                    <MapPinIcon className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      categoryLabels[selectedNotice.category]?.color || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {categoryLabels[selectedNotice.category]?.label || selectedNotice.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedNotice.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{selectedNotice.authorName}</span>
                  <span>
                    {new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span>조회 {selectedNotice.viewCount + 1}</span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {selectedNotice.content}
                  </div>
                </div>

                {/* 첨부파일 */}
                {selectedNotice.filePath && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">첨부파일</h4>
                    <a
                      href={selectedNotice.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
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
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
