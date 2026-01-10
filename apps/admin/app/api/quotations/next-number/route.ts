import { NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get next quotation number for today
export async function GET() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const datePrefix = `${year}/${month}/${day}`

    // 오늘 날짜로 시작하는 견적서 개수 조회
    const todayQuotations = await prisma.quotation.count({
      where: {
        quotationNumber: {
          startsWith: datePrefix,
        },
      },
    })

    const nextNumber = `${datePrefix}-${todayQuotations + 1}`

    return NextResponse.json({ quotationNumber: nextNumber })
  } catch (error) {
    console.error('Failed to get next quotation number:', error)
    return NextResponse.json({ error: 'Failed to get next number' }, { status: 500 })
  }
}
