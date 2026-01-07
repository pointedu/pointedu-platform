import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@pointedu/database'
import QuotePDF from '../../../../../components/QuotePDF'
import { createElement } from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        request: {
          include: {
            school: true,
            program: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: '견적서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // PDF 데이터 구성
    const pdfData = {
      quoteNumber: quote.quoteNumber,
      createdAt: new Date(quote.createdAt).toLocaleDateString('ko-KR'),
      validUntil: quote.validUntil
        ? new Date(quote.validUntil).toLocaleDateString('ko-KR')
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'),
      school: {
        name: quote.request.school.name,
        address: quote.request.school.address || '',
        phoneNumber: quote.request.school.phoneNumber || ''
      },
      program: {
        name: quote.request.program?.name || quote.request.customProgram || '맞춤 프로그램',
        sessions: quote.request.sessions,
        sessionMinutes: quote.request.program?.sessionMinutes || 45,
        studentCount: quote.request.studentCount
      },
      items: [
        {
          name: '강사비',
          quantity: quote.request.sessions,
          unitPrice: Number(quote.sessionFee) / quote.request.sessions,
          amount: Number(quote.sessionFee)
        },
        ...(Number(quote.transportFee) > 0 ? [{
          name: '교통비',
          quantity: quote.request.sessions,
          unitPrice: Number(quote.transportFee) / quote.request.sessions,
          amount: Number(quote.transportFee)
        }] : []),
        ...(Number(quote.materialCost) > 0 ? [{
          name: '재료비',
          quantity: quote.request.studentCount,
          unitPrice: Number(quote.materialCost) / quote.request.studentCount,
          amount: Number(quote.materialCost)
        }] : []),
        ...(Number(quote.assistantFee) > 0 ? [{
          name: '보조강사비',
          quantity: 1,
          unitPrice: Number(quote.assistantFee),
          amount: Number(quote.assistantFee)
        }] : []),
        ...(Number(quote.overhead) > 0 ? [{
          name: '운영비',
          quantity: 1,
          unitPrice: Number(quote.overhead),
          amount: Number(quote.overhead)
        }] : [])
      ],
      subtotal: Number(quote.subtotal),
      vat: Number(quote.vat),
      total: Number(quote.finalTotal || quote.total),
      notes: quote.notes || undefined
    }

    // PDF 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      createElement(QuotePDF, { data: pdfData }) as any
    )

    // 파일명 생성
    const fileName = `견적서_${quote.quoteNumber}_${pdfData.school.name}.pdf`
    const encodedFileName = encodeURIComponent(fileName)

    // Buffer를 Uint8Array로 변환
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    return NextResponse.json(
      { error: 'PDF 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
