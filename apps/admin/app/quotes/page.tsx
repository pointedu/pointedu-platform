export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import QuoteList from './QuoteList'

async function getQuotes() {
  try {
    return await prisma.quote.findMany({
      include: {
        request: {
          include: {
            school: true,
            program: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })
  } catch (error) {
    console.error('Failed to fetch quotes:', error)
    return []
  }
}

async function getPendingRequests() {
  try {
    return await prisma.schoolRequest.findMany({
      where: {
        status: {
          in: ['SUBMITTED', 'REVIEWING', 'APPROVED'],
        },
        quote: null,
      },
      include: {
        school: true,
        program: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  } catch (error) {
    console.error('Failed to fetch pending requests:', error)
    return []
  }
}

export default async function QuotesPage() {
  const [quotes, pendingRequests] = await Promise.all([
    getQuotes(),
    getPendingRequests(),
  ])

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">견적 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            발송된 견적서 {quotes.length}건을 확인하고 관리합니다.
            {pendingRequests.length > 0 && (
              <span className="ml-2 text-blue-600">
                (대기중인 요청: {pendingRequests.length}건)
              </span>
            )}
          </p>
        </div>
      </div>

      <QuoteList initialQuotes={quotes as any} pendingRequests={pendingRequests as any} />
    </div>
  )
}
