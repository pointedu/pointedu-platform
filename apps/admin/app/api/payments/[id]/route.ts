import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// PUT - Update payment status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, approvedBy, paidBy } = body

    const updateData: any = { status }

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
      updateData.approvedBy = approvedBy || 'admin'
    }

    if (status === 'PAID') {
      updateData.paidAt = new Date()
      updateData.paidBy = paidBy || 'admin'
    }

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        instructor: true,
        assignment: {
          include: {
            request: { include: { school: true } },
          },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Failed to update payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
