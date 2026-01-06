import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - List all quotes
export async function GET() {
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
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Failed to fetch quotes:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

// POST - Create new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestId,
      sessionFee,
      transportFee,
      materialCost,
      assistantFee,
      overhead,
      marginRate,
      discount,
      validDays,
      notes,
    } = body

    // Generate quote number
    const year = new Date().getFullYear()
    const count = await prisma.quote.count({
      where: {
        quoteNumber: { startsWith: `QT-${year}` },
      },
    })
    const quoteNumber = `QT-${year}-${String(count + 1).padStart(3, '0')}`

    // Calculate totals
    const subtotal = parseFloat(sessionFee) + parseFloat(transportFee) + parseFloat(materialCost || 0) + parseFloat(assistantFee || 0) + parseFloat(overhead || 0)
    const marginAmount = subtotal * (parseFloat(marginRate || 0.15))
    const vat = (subtotal + marginAmount) * 0.1
    const total = subtotal + marginAmount + vat
    const finalTotal = total - parseFloat(discount || 0)

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (validDays || 30))

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        requestId,
        sessionFee: parseFloat(sessionFee),
        transportFee: parseFloat(transportFee),
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
        validUntil,
        notes,
        createdBy: 'admin',
      },
      include: {
        request: { include: { school: true, program: true } },
      },
    })

    // Update request status
    await prisma.schoolRequest.update({
      where: { id: requestId },
      data: { status: 'QUOTED' },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Failed to create quote:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}
