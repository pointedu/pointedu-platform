import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import crypto from 'crypto'

// 솔라피 API 인증 헤더 생성
function createSolapiHeaders() {
  const apiKey = process.env.SOLAPI_API_KEY?.trim()
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim()

  if (!apiKey || !apiSecret) {
    throw new Error('Solapi credentials not configured')
  }

  const timestamp = new Date().toISOString()
  const salt = crypto.randomBytes(16).toString('hex')
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(`${timestamp}${salt}`)
    .digest('hex')

  return {
    'Content-Type': 'application/json',
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
  }
}

// POST - 강사에게 알림 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorIds, message, notificationType = 'sms' } = body

    if (!instructorIds || !Array.isArray(instructorIds) || instructorIds.length === 0) {
      return NextResponse.json({ error: '강사를 선택해주세요.' }, { status: 400 })
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
    }

    // 선택된 강사들의 전화번호 조회
    const instructors = await prisma.instructor.findMany({
      where: {
        id: { in: instructorIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
    })

    if (instructors.length === 0) {
      return NextResponse.json({ error: '활성화된 강사가 없습니다.' }, { status: 400 })
    }

    // 전화번호가 있는 강사만 필터링
    const validInstructors = instructors.filter(i => i.phoneNumber && i.phoneNumber.trim() !== '')

    if (validInstructors.length === 0) {
      return NextResponse.json({ error: '전화번호가 등록된 강사가 없습니다.' }, { status: 400 })
    }

    const senderNumber = process.env.SOLAPI_SENDER_NUMBER?.trim()
    if (!senderNumber) {
      return NextResponse.json({ error: '발신번호가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 메시지 발송
    const messages = validInstructors.map(instructor => ({
      to: instructor.phoneNumber.replace(/-/g, ''),
      from: senderNumber.replace(/-/g, ''),
      type: 'SMS',
      text: `[포인트교육] ${instructor.name}님, ${message}`,
    }))

    const headers = createSolapiHeaders()
    const response = await fetch('https://api.solapi.com/messages/v4/send-many', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    })

    const result = await response.json()

    console.log('Send notification response:', JSON.stringify(result, null, 2))

    if (response.ok && result.groupId) {
      return NextResponse.json({
        success: true,
        message: `${validInstructors.length}명의 강사에게 알림을 발송했습니다.`,
        details: {
          groupId: result.groupId,
          sentTo: validInstructors.map(i => i.name),
          totalCount: validInstructors.length,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.errorMessage || result.message || '알림 발송 실패',
        details: result,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
