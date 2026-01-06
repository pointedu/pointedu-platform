import crypto from 'crypto'

interface NotificationData {
  phoneNumber: string
  instructorName: string
  schoolName?: string
  programName?: string
  date?: string
  sessions?: number
  time?: string
}

interface InstructorApprovalData {
  phoneNumber: string
  instructorName: string
  registrationDate?: string
  specialties?: string
}

interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

// 솔라피 API 인증 헤더 생성
function createSolapiHeaders() {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET

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

// 솔라피 메시지 발송
async function sendSolapiMessage(
  to: string,
  text: string,
  kakaoOptions?: {
    templateId: string
    variables?: Record<string, string>
  }
): Promise<NotificationResult> {
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER
  const pfId = process.env.SOLAPI_PF_ID

  if (!senderNumber) {
    return { success: false, error: 'Sender number not configured' }
  }

  try {
    const headers = createSolapiHeaders()

    const messageBody: any = {
      message: {
        to: to.replace(/-/g, ''),
        from: senderNumber.replace(/-/g, ''),
      },
    }

    // 카카오 알림톡 사용 (템플릿이 있는 경우)
    if (pfId && kakaoOptions?.templateId) {
      messageBody.message.kakaoOptions = {
        pfId,
        templateId: kakaoOptions.templateId,
        ...(kakaoOptions.variables && { variables: kakaoOptions.variables }),
      }
    } else {
      // SMS 대체 발송
      messageBody.message.text = text
    }

    console.log('Sending notification:', JSON.stringify(messageBody, null, 2))

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messageBody),
    })

    const result = await response.json()

    if (response.ok && result.statusCode === '2000') {
      console.log('Notification sent successfully:', result.messageId || result.groupId)
      return { success: true, messageId: result.messageId || result.groupId }
    } else {
      console.error('Notification failed:', result)
      return { success: false, error: result.statusMessage || result.message || 'Send failed' }
    }
  } catch (error) {
    console.error('Notification exception:', error)
    return { success: false, error: String(error) }
  }
}

// 강사 배정 알림 (카카오 알림톡)
export async function sendAssignmentNotification(data: NotificationData): Promise<NotificationResult> {
  const apiKey = process.env.SOLAPI_API_KEY
  if (!apiKey) {
    console.log('Solapi credentials not configured, skipping notification')
    return { success: false, error: 'Credentials not configured' }
  }

  const templateId = process.env.SOLAPI_TEMPLATE_ASSIGNMENT
  const timeStr = data.time ? ` ${data.time}` : ''

  // SMS 대체 메시지
  const smsText = `[포인트교육] ${data.instructorName}님, ${data.schoolName} ${data.programName} 수업에 배정되었습니다.\n\n일시: ${data.date}${timeStr}\n차시: ${data.sessions}차시\n\n관리자 페이지에서 확인해주세요.`

  // 카카오 알림톡 템플릿 변수 (실제 템플릿에 맞춤)
  // 템플릿: #{강사명}, #{학교명}, #{수업일}, #{수업시간}, #{과목명}, #{도착시간}
  const variables = {
    '#{강사명}': data.instructorName,
    '#{학교명}': data.schoolName || '',
    '#{수업일}': data.date || '',
    '#{수업시간}': data.time || '',
    '#{과목명}': data.programName || '',
    '#{도착시간}': data.time ? `${data.time} 30분 전` : '',
  }

  return sendSolapiMessage(data.phoneNumber, smsText,
    templateId ? { templateId, variables } : undefined
  )
}

// 수업 리마인더 알림 (5일 전)
export async function sendReminderNotification(data: NotificationData): Promise<NotificationResult> {
  const apiKey = process.env.SOLAPI_API_KEY
  if (!apiKey) {
    console.log('Solapi credentials not configured, skipping notification')
    return { success: false, error: 'Credentials not configured' }
  }

  const templateId = process.env.SOLAPI_TEMPLATE_REMINDER
  const timeStr = data.time ? ` ${data.time}` : ''

  // SMS 대체 메시지
  const smsText = `[포인트교육] ${data.instructorName}님, 수업 일정 알림입니다.\n\n학교: ${data.schoolName}\n프로그램: ${data.programName}\n일시: ${data.date}${timeStr}\n차시: ${data.sessions}차시\n\n5일 후 수업이 예정되어 있습니다. 준비 부탁드립니다.`

  // 카카오 알림톡 템플릿 변수 (실제 템플릿에 맞춤)
  // 템플릿: #{강사명}, #{학교명}, #{수업일}, #{수업시간}, #{과목명}
  const variables = {
    '#{강사명}': data.instructorName,
    '#{학교명}': data.schoolName || '',
    '#{수업일}': data.date || '',
    '#{수업시간}': data.time || '',
    '#{과목명}': data.programName || '',
  }

  return sendSolapiMessage(data.phoneNumber, smsText,
    templateId ? { templateId, variables } : undefined
  )
}

// 강사 승인 완료 알림 (카카오 알림톡)
export async function sendInstructorApprovalNotification(data: InstructorApprovalData): Promise<NotificationResult> {
  const apiKey = process.env.SOLAPI_API_KEY
  if (!apiKey) {
    console.log('Solapi credentials not configured, skipping notification')
    return { success: false, error: 'Credentials not configured' }
  }

  const templateId = process.env.SOLAPI_TEMPLATE_INSTRUCTOR_APPROVED
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // SMS 대체 메시지
  const smsText = `[포인트교육] ${data.instructorName}님, 강사 등록이 승인되었습니다.\n\n이제 포인트교육 관리자 페이지에 로그인하여 수업에 지원할 수 있습니다.\n\n감사합니다.`

  // 카카오 알림톡 템플릿 변수 (실제 템플릿에 맞춤)
  // 템플릿: #{등록일}, #{담당분야}, #{강사연락처}
  const variables = {
    '#{등록일}': data.registrationDate || today,
    '#{담당분야}': data.specialties || '전 분야',
    '#{강사연락처}': data.phoneNumber,
  }

  return sendSolapiMessage(data.phoneNumber, smsText,
    templateId ? { templateId, variables } : undefined
  )
}

// 수업 완료 알림
export async function sendCompletionNotification(data: NotificationData): Promise<NotificationResult> {
  const apiKey = process.env.SOLAPI_API_KEY
  if (!apiKey) {
    console.log('Solapi credentials not configured, skipping notification')
    return { success: false, error: 'Credentials not configured' }
  }

  const smsText = `[포인트교육] ${data.instructorName}님, ${data.schoolName} ${data.programName} 수업이 완료 처리되었습니다. 정산 내역을 확인해주세요.`

  return sendSolapiMessage(data.phoneNumber, smsText)
}

// 테스트 알림
export async function sendTestNotification(phoneNumber: string): Promise<NotificationResult> {
  const apiKey = process.env.SOLAPI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Credentials not configured' }
  }

  const smsText = `[포인트교육] 알림 테스트 메시지입니다. 이 메시지가 정상적으로 수신되었다면 알림 설정이 완료된 것입니다.`

  return sendSolapiMessage(phoneNumber, smsText)
}
