export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import NoticeList from './NoticeList'

async function getNotices() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return notices
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return []
  }
}

export default async function NoticesPage() {
  const notices = await getNotices()

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

      <NoticeList initialNotices={notices as any} />
    </div>
  )
}
