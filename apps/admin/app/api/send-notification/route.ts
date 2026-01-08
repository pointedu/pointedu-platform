import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import crypto from 'crypto'

// 카카오톡 알림톡 템플릿 ID
const KAKAO_TEMPLATES = {
  INSTRUCTOR_REGISTERED: 'KA01TP260108025300386layhuFTYkJZ',  // 강사등록완료
  CLASS_ASSIGNED: 'KA01TP251231035539719ZS79k8bOV2r',         // 수업배정안내
  CLASS_REMINDER_5DAYS: 'KA01TP260106071810134mvSJxt6HmfL',   // 배정된 수업 5일 전
} as const

type KakaoTemplateType = keyof typeof KAKAO_TEMPLATES

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

// 템플릿별 변수 생성
function getTemplateVariables(
  templateType: KakaoTemplateType,
  instructorName: string,
  data?: {
    message?: string
    schoolName?: string
    programName?: string
    classDate?: string
    classTime?: string
  }
): Record<string, string> {
  switch (templateType) {
    case 'INSTRUCTOR_REGISTERED':
      // 강사등록완료 템플릿 변수
      return {
        '#{이름}': instructorName,
      }

    case 'CLASS_ASSIGNED':
      // 수업배정안내 템플릿 변수
      return {
        '#{이름}': instructorName,
        '#{학교명}': data?.schoolName || '',
        '#{프로그램}': data?.programName || '',
        '#{수업일}': data?.classDate || '',
        '#{수업시간}': data?.classTime || '',
      }

    case 'CLASS_REMINDER_5DAYS':
      // 배정된 수업 5일 전 템플릿 변수
      return {
        '#{이름}': instructorName,
        '#{학교명}': data?.schoolName || '',
        '#{프로그램}': data?.programName || '',
        '#{수업일}': data?.classDate || '',
        '#{수업시간}': data?.classTime || '',
      }

    default:
      return {
        '#{이름}': instructorName,
        '#{내용}': data?.message || '',
      }
  }
}

// POST - 강사에게 알림 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      instructorIds,
      message,
      notificationType = 'sms',
      templateType,
      templateData,
    } = body

    if (!instructorIds || !Array.isArray(instructorIds) || instructorIds.length === 0) {
      return NextResponse.json({ error: '강사를 선택해주세요.' }, { status: 400 })
    }

    // SMS의 경우에만 메시지 필수
    if (notificationType === 'sms' && (!message || message.trim() === '')) {
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
    let messages

    if (notificationType === 'kakao') {
      // 카카오톡 알림톡 발송
      const pfId = process.env.SOLAPI_PF_ID?.trim()
      if (!pfId) {
        return NextResponse.json({
          error: '카카오톡 발송을 위한 PF ID가 설정되지 않았습니다.'
        }, { status: 500 })
      }

      // 템플릿 타입 확인
      const selectedTemplateType = (templateType as KakaoTemplateType) || 'INSTRUCTOR_REGISTERED'
      const templateId = KAKAO_TEMPLATES[selectedTemplateType]

      if (!templateId) {
        return NextResponse.json({
          error: '유효하지 않은 템플릿 타입입니다.'
        }, { status: 400 })
      }

      messages = validInstructors.map(instructor => ({
        to: instructor.phoneNumber.replace(/-/g, ''),
        from: senderNumber.replace(/-/g, ''),
        type: 'ATA',  // 알림톡 타입 명시
        kakaoOptions: {
          pfId: pfId,
          templateId: templateId,
          variables: getTemplateVariables(selectedTemplateType, instructor.name, {
            message,
            ...templateData,
          }),
          disableSms: false,  // 알림톡 실패 시 SMS 대체 발송
        },
      }))
    } else {
      // SMS 발송
      messages = validInstructors.map(instructor => ({
        to: instructor.phoneNumber.replace(/-/g, ''),
        from: senderNumber.replace(/-/g, ''),
        type: 'SMS',
        text: `[포인트교육] ${instructor.name}님, ${message}`,
      }))
    }

    const headers = createSolapiHeaders()
    const response = await fetch('https://api.solapi.com/messages/v4/send-many', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    })

    const result = await response.json()

    console.log('Send notification response:', JSON.stringify(result, null, 2))

    const typeLabel = notificationType === 'kakao' ? '카카오톡' : 'SMS'

    if (response.ok && result.groupId) {
      return NextResponse.json({
        success: true,
        message: `${validInstructors.length}명의 강사에게 ${typeLabel} 알림을 발송했습니다.`,
        details: {
          groupId: result.groupId,
          sentTo: validInstructors.map(i => i.name),
          totalCount: validInstructors.length,
          notificationType: typeLabel,
          templateType: notificationType === 'kakao' ? templateType : undefined,
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

// 템플릿 목록 조회
export async function GET() {
  return NextResponse.json({
    templates: [
      {
        type: 'INSTRUCTOR_REGISTERED',
        name: '강사등록완료',
        description: '강사 가입 승인 시 발송',
        variables: ['이름'],
      },
      {
        type: 'CLASS_ASSIGNED',
        name: '수업배정안내',
        description: '수업 배정 시 발송',
        variables: ['이름', '학교명', '프로그램', '수업일', '수업시간'],
      },
      {
        type: 'CLASS_REMINDER_5DAYS',
        name: '배정된 수업 5일 전',
        description: '수업 5일 전 리마인더',
        variables: ['이름', '학교명', '프로그램', '수업일', '수업시간'],
      },
    ],
  })
}
