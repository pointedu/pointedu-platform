export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import Link from 'next/link'

type NoticeType = Awaited<ReturnType<typeof prisma.notice.findMany>>[number]

async function getNotices(): Promise<NoticeType[]> {
  try {
    const notices = await prisma.notice.findMany({
      where: { isPublished: true },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    })
    return notices
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return []
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function NoticePage() {
  const notices = await getNotices()

  return (
    <div className="pt-24">
      <section className="relative py-24 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">공지사항</h1>
            <p className="text-xl text-white/80">
              포인트교육의 소식과 공지사항을 확인하세요.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          {notices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notice/${notice.id}`}
                  className="block py-6 hover:bg-gray-50 transition-colors -mx-4 px-4 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    {notice.isPinned && (
                      <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
                        중요
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
                        {notice.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatDate(notice.createdAt)}</span>
                        <span>조회 {notice.viewCount}</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                          {notice.category === 'IMPORTANT' ? '중요' :
                           notice.category === 'EVENT' ? '이벤트' : '일반'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
