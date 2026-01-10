import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - List all quotations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { projectName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ])

    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch quotations:', error)
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
  }
}

// POST - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quotationNumber,
      issueDate,
      validUntil,
      clientName,
      clientAddress,
      clientContact,
      clientPhone,
      clientEmail,
      title,
      projectName,
      notes,
      items,
      totalSupplyAmount,
      totalVat,
      totalAmount,
    } = body

    // 필수값 검증
    if (!clientName || !items || items.length === 0) {
      return NextResponse.json(
        { error: '기관명과 최소 1개 이상의 품목이 필요합니다.' },
        { status: 400 }
      )
    }

    // 견적번호 중복 확인
    const existingQuotation = await prisma.quotation.findUnique({
      where: { quotationNumber },
    })

    let finalQuotationNumber = quotationNumber

    if (existingQuotation) {
      // 같은 날짜의 견적 개수 확인하고 새 번호 생성
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/')
      const todayQuotations = await prisma.quotation.count({
        where: {
          quotationNumber: {
            startsWith: today,
          },
        },
      })
      finalQuotationNumber = `${today}-${todayQuotations + 1}`
    }

    // 견적서 생성
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: finalQuotationNumber,
        issueDate: new Date(issueDate),
        validUntil: validUntil ? new Date(validUntil) : null,
        clientName,
        clientAddress: clientAddress || null,
        clientContact: clientContact || null,
        clientPhone: clientPhone || null,
        clientEmail: clientEmail || null,
        title: title || '교육 프로그램 견적서',
        projectName: projectName || null,
        notes: notes || null,
        totalSupplyAmount: Math.round(totalSupplyAmount),
        totalVat: Math.round(totalVat),
        totalAmount: Math.round(totalAmount),
        status: 'ISSUED',
        createdBy: 'admin', // TODO: 세션에서 가져오기
        createdByName: '관리자',
        items: {
          create: items.map((item: Record<string, unknown>, index: number) => ({
            sortOrder: index,
            itemCode: (item.itemCode as string) || null,
            itemName: item.itemName as string,
            specification: (item.specification as string) || null,
            quantity: item.quantity as number,
            unit: (item.unit as string) || '명',
            unitPrice: Math.round(item.unitPrice as number),
            supplyAmount: Math.round(item.supplyAmount as number),
            vat: Math.round((item.vat as number) || 0),
            remark: (item.remark as string) || null,
          })),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    console.error('Failed to create quotation:', error)
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
  }
}
