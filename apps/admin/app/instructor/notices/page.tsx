export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { MegaphoneIcon } from '@heroicons/react/24/outline'

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

const categoryLabels: Record<string, { label: string; color: string }> = {
  GENERAL: { label: '일반', color: 'bg-gray-100 text-gray-800' },
  IMPORTANT: { label: '중요', color: 'bg-red-100 text-red-800' },
  EVENT: { label: '이벤트', color: 'bg-blue-100 text-blue-800' },
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

      {notices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {notices.map((notice) => (
            <div key={notice.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                {notice.isPinned && (
                  <div className="flex-shrink-0 mt-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                      <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"/>
                        <path d="M10 11a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1z"/>
                      </svg>
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        categoryLabels[notice.category]?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {categoryLabels[notice.category]?.label || notice.category}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">{notice.title}</h3>
                  </div>
                  <div
                    className="mt-2 text-sm text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: notice.content.replace(/\n/g, '<br>').substring(0, 200) }}
                  />
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
