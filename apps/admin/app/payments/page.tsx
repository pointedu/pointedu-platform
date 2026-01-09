export const revalidate = 60 // Revalidate every 60 seconds

import { prisma } from '@pointedu/database'
import PaymentList from './PaymentList'
import { serializeDecimalArray } from '../../lib/utils'
import { getPublicUrl, listFiles, STORAGE_BUCKETS } from '../../lib/supabase'

interface CompanyInfo {
  name: string
  ceo: string
  address: string
  tel: string
  bizNumber: string
}

interface Payment {
  id: string
  paymentNumber: string
  accountingMonth: string
  sessions: number
  sessionFee: number
  transportFee: number
  bonus?: number
  subtotal: number
  taxWithholding: number
  deductions?: number
  netAmount: number
  status: string
  paidAt?: string | null
  instructor: {
    id: string
    name: string
    phoneNumber?: string | null
    bankName?: string | null
    accountNumber?: string | null
    bankAccount?: string | null
    residentNumber?: string | null
  }
  assignment: {
    scheduledDate?: string | null
    request: {
      school: { name: string }
      program?: { name: string } | null
      customProgram?: string | null
      sessions: number
    }
  }
}

async function getPayments() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        instructor: true,
        assignment: {
          include: {
            request: {
              include: {
                school: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })
    return serializeDecimalArray(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return []
  }
}

async function getCompanyInfo(): Promise<{ companyInfo: CompanyInfo; logoUrl: string | null }> {
  try {
    // 회사 정보 설정 가져오기
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['company_name', 'company_ceo', 'company_address', 'company_phone', 'business_number'],
        },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    const companyInfo: CompanyInfo = {
      name: settingsMap['company_name'] || '(주)포인트교육',
      ceo: settingsMap['company_ceo'] || '대표자',
      address: settingsMap['company_address'] || '경상북도 영주시',
      tel: settingsMap['company_phone'] || '054-000-0000',
      bizNumber: settingsMap['business_number'] || '000-00-00000',
    }

    // 로고 URL 가져오기
    let logoUrl: string | null = null
    try {
      const files = await listFiles(STORAGE_BUCKETS.LOGOS)
      const logoFile = files.find((f: { name?: string }) => f.name && f.name.startsWith('company-logo'))
      if (logoFile) {
        logoUrl = getPublicUrl(STORAGE_BUCKETS.LOGOS, logoFile.name)
      }
    } catch (logoError) {
      console.error('Failed to fetch logo:', logoError)
    }

    return { companyInfo, logoUrl }
  } catch (error) {
    console.error('Failed to fetch company info:', error)
    return {
      companyInfo: {
        name: '(주)포인트교육',
        ceo: '대표자',
        address: '경상북도 영주시',
        tel: '054-000-0000',
        bizNumber: '000-00-00000',
      },
      logoUrl: null,
    }
  }
}

export default async function PaymentsPage() {
  const [rawPayments, { companyInfo, logoUrl }] = await Promise.all([
    getPayments(),
    getCompanyInfo(),
  ])
  const payments = rawPayments as unknown as Payment[]

  const summary = {
    total: payments.length,
    pending: payments.filter((p) => ['PENDING', 'CALCULATED'].includes(p.status)).length,
    approved: payments.filter((p) => p.status === 'APPROVED').length,
    paid: payments.filter((p) => p.status === 'PAID').length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.netAmount || 0), 0),
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">정산 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            강사 정산 내역 {payments.length}건을 확인하고 관리합니다.
          </p>
        </div>
      </div>

      <PaymentList
        initialPayments={payments}
        summary={summary}
        companyInfo={companyInfo}
        logoUrl={logoUrl}
      />
    </div>
  )
}
