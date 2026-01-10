import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Failed to fetch quotation:', error)
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 })
  }
}

// PUT - Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
    } = body

    // 기존 견적서 확인
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 필수값 검증
    if (!clientName || !items || items.length === 0) {
      return NextResponse.json(
        { error: '기관명과 최소 1개 이상의 품목이 필요합니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 업데이트
    const quotation = await prisma.$transaction(async (tx) => {
      // 기존 아이템 삭제
      await tx.quotationItem.deleteMany({
        where: { quotationId: params.id },
      })

      // 견적서 업데이트
      return tx.quotation.update({
        where: { id: params.id },
        data: {
          quotationNumber,
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
          status: status || existingQuotation.status,
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
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Failed to update quotation:', error)
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 })
  }
}

// DELETE - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Cascade delete로 items도 함께 삭제됨
    await prisma.quotation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quotation:', error)
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 })
  }
}
