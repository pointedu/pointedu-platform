export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { withAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// GET - 견적 상세 조회 (인증 필요)
export const GET = withAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            school: true,
            program: true,
          },
        },
      },
    })

    if (!quote) {
      return errorResponse('견적을 찾을 수 없습니다.', 404)
    }

    return successResponse(quote)
  } catch (error) {
    console.error('Failed to fetch quote:', error)
    return errorResponse('견적 정보를 불러오는데 실패했습니다.', 500)
  }
})

// PATCH - 견적 수정 (관리자 전용 - 수동 인증 유지)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionFee,
      transportFee,
      materialCost,
      assistantFee,
      overhead,
      marginRate,
      discount,
      notes,
      status,
    } = body

    // Recalculate totals if fee fields are updated
    let updateData: Record<string, unknown> = { notes }

    if (status) {
      updateData.status = status
      if (status === 'ACCEPTED') {
        updateData.acceptedAt = new Date()
      }
    }

    if (sessionFee !== undefined) {
      const subtotal = parseFloat(sessionFee) + parseFloat(transportFee || 0) + parseFloat(materialCost || 0) + parseFloat(assistantFee || 0) + parseFloat(overhead || 0)
      const marginAmount = subtotal * parseFloat(marginRate || 0.15)
      const vat = (subtotal + marginAmount) * 0.1
      const total = subtotal + marginAmount + vat
      const finalTotal = total - parseFloat(discount || 0)

      updateData = {
        ...updateData,
        sessionFee: parseFloat(sessionFee),
        transportFee: parseFloat(transportFee || 0),
        materialCost: parseFloat(materialCost || 0),
        assistantFee: parseFloat(assistantFee || 0),
        overhead: parseFloat(overhead || 0),
        subtotal,
        marginRate: parseFloat(marginRate || 0.15),
        marginAmount,
        vat,
        total,
        discount: parseFloat(discount || 0),
        finalTotal,
      }
    }

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        request: {
          include: { school: true, program: true },
        },
      },
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Failed to update quote:', error)
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
  }
}

// DELETE - 견적 삭제 (관리자 전용 - 수동 인증 유지)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.quote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quote:', error)
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 })
  }
}
