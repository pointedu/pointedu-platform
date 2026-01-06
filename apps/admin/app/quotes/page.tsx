export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import QuoteList from './QuoteList'
import { serializeDecimalArray } from '../../lib/utils'

async function getQuotes() {
  try {
    const quotes = await prisma.quote.findMany({
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
    return serializeDecimalArray(quotes)
  } catch (error) {
    console.error('Failed to fetch quotes:', error)
    return []
  }
}

async function getPendingRequests() {
  try {
    const requests = await prisma.schoolRequest.findMany({
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
    return serializeDecimalArray(requests)
  } catch (error) {
    console.error('Failed to fetch pending requests:', error)
    return []
  }
}

async function getTransportSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['transport_0_20', 'transport_20_40', 'transport_40_60', 'transport_60_80', 'transport_80_plus'],
        },
      },
    })
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => {
      settingsMap[s.key] = s.value
    })
    return {
      transport_0_20: settingsMap['transport_0_20'] || '0',
      transport_20_40: settingsMap['transport_20_40'] || '15000',
      transport_40_60: settingsMap['transport_40_60'] || '25000',
      transport_60_80: settingsMap['transport_60_80'] || '35000',
      transport_80_plus: settingsMap['transport_80_plus'] || '45000',
    }
  } catch (error) {
    console.error('Failed to fetch transport settings:', error)
    return {
      transport_0_20: '0',
      transport_20_40: '15000',
      transport_40_60: '25000',
      transport_60_80: '35000',
      transport_80_plus: '45000',
    }
  }
}

export default async function QuotesPage() {
  const [quotes, pendingRequests, transportSettings] = await Promise.all([
    getQuotes(),
    getPendingRequests(),
    getTransportSettings(),
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

      <QuoteList
        initialQuotes={quotes as any}
        pendingRequests={pendingRequests as any}
        transportSettings={transportSettings}
      />
    </div>
  )
}
