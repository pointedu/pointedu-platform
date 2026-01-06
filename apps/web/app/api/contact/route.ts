import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, school, position, phone, email, studentCount, preferredDate, programInterest, message } = body

    if (!name || !school || !phone || !message) {
      return NextResponse.json(
        { error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Create notification for admin
    await prisma.notification.create({
      data: {
        type: 'EMAIL',
        title: `[웹사이트 문의] ${school} - ${name}`,
        message: `
담당자: ${name}
학교/기관: ${school}
직책: ${position || '-'}
연락처: ${phone}
이메일: ${email || '-'}
예상 학생수: ${studentCount || '-'}
희망 일정: ${preferredDate || '-'}
관심 프로그램: ${programInterest || '-'}

문의 내용:
${message}
        `.trim(),
        relatedType: 'Contact',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: '문의 접수에 실패했습니다.' },
      { status: 500 }
    )
  }
}
