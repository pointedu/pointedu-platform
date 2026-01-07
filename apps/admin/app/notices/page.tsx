export const revalidate = 180 // Revalidate every 3 minutes

import { prisma } from '@pointedu/database'
import NoticeList from './NoticeList'
import { serializeDecimalArray } from '../../lib/utils'

async function getNotices() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return serializeDecimalArray(notices)
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return []
  }
}

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

export default async function NoticesPage() {
  const rawNotices = await getNotices()
  const notices = rawNotices as unknown as Notice[]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            공지사항을 작성하고 관리합니다. 강사들이 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <NoticeList initialNotices={notices} />
    </div>
  )
}
