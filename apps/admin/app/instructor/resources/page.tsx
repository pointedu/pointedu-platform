export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import {
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

async function getResources(userId: string) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
    })

    if (!instructor) {
      return []
    }

    // Get public resources OR resources specifically shared with this instructor
    const resources = await prisma.resource.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            accessList: {
              some: {
                instructorId: instructor.id,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return resources
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return []
  }
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

export default async function InstructorResourcesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const resources = await getResources(userId)

  // Group by category
  const groupedResources = resources.reduce((acc, resource) => {
    const category = resource.category || 'GENERAL'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(resource)
    return acc
  }, {} as Record<string, typeof resources>)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">자료실</h1>
        <p className="mt-1 text-sm text-gray-600">
          교육 자료 및 서식을 다운로드할 수 있습니다.
        </p>
      </div>

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
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                      <a
                        href={resource.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        다운로드
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
