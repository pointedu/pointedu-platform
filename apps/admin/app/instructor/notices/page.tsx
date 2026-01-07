export const revalidate = 180 // Revalidate every 3 minutes

import { prisma } from '@pointedu/database'
import NoticeView from './NoticeView'
import { serializeDecimalArray } from '../../../lib/utils'

async function getNotices() {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
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
  isPinned: boolean
  viewCount: number
  authorName: string
  fileName?: string | null
  fileSize?: number | null
  filePath?: string | null
  createdAt: string
}

export default async function InstructorNoticesPage() {
  const rawNotices = await getNotices()
  const notices = rawNotices as unknown as Notice[]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        <p className="mt-1 text-sm text-gray-600">
          포인트교육의 공지사항을 확인하세요.
        </p>
      </div>

      <NoticeView notices={notices} />
    </div>
  )
}
