'use client'

import { useState } from 'react'
import {
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface Resource {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  downloadCount: number
  authorName: string
  createdAt: string
}

interface ResourceViewProps {
  resources: Resource[]
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  GENERAL: { label: '일반', color: 'bg-gray-100 text-gray-800' },
  EDUCATION: { label: '교육자료', color: 'bg-blue-100 text-blue-800' },
  FORM: { label: '서식', color: 'bg-green-100 text-green-800' },
  MANUAL: { label: '매뉴얼', color: 'bg-purple-100 text-purple-800' },
}

function getFileIcon(fileType: string) {
  if (fileType.includes('image')) {
    return PhotoIcon
  } else if (fileType.includes('video')) {
    return VideoCameraIcon
  } else if (fileType.includes('pdf')) {
    return DocumentTextIcon
  }
  return DocumentIcon
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ResourceView({ resources }: ResourceViewProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  // Group by category
  const groupedResources = resources.reduce((acc, resource) => {
    const category = resource.category || 'GENERAL'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  const handleDownload = async (resource: Resource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    // 다운로드 카운트 증가 API 호출 (선택적)
    try {
      await fetch(`/api/resources/${resource.id}/download`, { method: 'POST' })
    } catch (err) {
      // 실패해도 무시
    }

    // 새 탭에서 파일 열기
    window.open(resource.filePath, '_blank')
  }

  return (
    <>
      {resources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">등록된 자료가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResources).map(([category, categoryResources]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    categoryLabels[category]?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {categoryLabels[category]?.label || category}
                </span>
              </div>
              <div className="divide-y divide-gray-200">
                {categoryResources.map((resource) => {
                  const FileIcon = getFileIcon(resource.fileType)
                  return (
                    <div
                      key={resource.id}
                      onClick={() => setSelectedResource(resource)}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                          <FileIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{resource.title}</h3>
                          {resource.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span>{resource.fileName}</span>
                            <span>{formatFileSize(resource.fileSize)}</span>
                            <span>다운로드 {resource.downloadCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedResource(resource)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(resource, e)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          다운로드
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30" onClick={() => setSelectedResource(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    categoryLabels[selectedResource.category]?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {categoryLabels[selectedResource.category]?.label || selectedResource.category}
                </span>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 p-3 bg-gray-100 rounded-lg">
                    {(() => {
                      const FileIcon = getFileIcon(selectedResource.fileType)
                      return <FileIcon className="h-8 w-8 text-gray-600" />
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedResource.title}</h2>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{selectedResource.authorName}</span>
                      <span>
                        {new Date(selectedResource.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedResource.description && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedResource.description}
                    </p>
                  </div>
                )}

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{selectedResource.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedResource.fileSize)} · 다운로드 {selectedResource.downloadCount}회
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(selectedResource)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      다운로드
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setSelectedResource(null)}
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
