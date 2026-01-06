export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import NoticeView from './NoticeView'

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
    return notices
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return []
  }
}

export default async function InstructorNoticesPage() {
  const notices = await getNotices()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        <p className="mt-1 text-sm text-gray-600">
          포인트교육의 공지사항을 확인하세요.
        </p>
      </div>

      <NoticeView notices={notices as any} />
    </div>
  )
}
