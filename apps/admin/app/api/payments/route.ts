import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - List all payments
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            bankAccount: true,
            residentNumber: true,
          },
        },
        assignment: {
          select: {
            scheduledDate: true,
            request: {
              include: {
                school: true,
                program: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
