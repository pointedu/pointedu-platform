import { NextRequest, NextResponse } from 'next/server'
import { sendTestNotification, sendAssignmentNotification } from '../../../lib/notification'

// POST - 테스트 알림 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, type = 'test' } = body

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    let result

    if (type === 'assignment') {
      // 배정 알림 테스트
      result = await sendAssignmentNotification({
        phoneNumber,
        instructorName: '테스트 강사',
        schoolName: '테스트 중학교',
        programName: 'AI 진로체험',
        date: '2025년 1월 15일 수요일',
        time: '09:00',
        sessions: 2,
      })
    } else {
      // 기본 테스트 알림
      result = await sendTestNotification(phoneNumber)
    }

    return NextResponse.json({
      success: result.success,
      message: result.success ? '알림 발송 성공!' : '알림 발송 실패',
      details: result,
    })
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
