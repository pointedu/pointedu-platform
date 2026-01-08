import crypto from 'crypto'

interface SolapiConfig {
  apiKey: string
  apiSecret: string
  pfId: string // 카카오 비즈니스 채널 ID
  senderNumber: string // 발신번호
}

interface AlimtalkMessage {
  to: string // 수신자 전화번호
  templateId: string // 템플릿 ID
  variables: Record<string, string> // 템플릿 변수
}

interface SmsMessage {
  to: string
  text: string
}

// 템플릿 ID로 브랜드 메시지 여부 확인
// KA01BP: 브랜드 메시지, KA01TP: 알림톡
function isBrandMessageTemplate(templateId: string): boolean {
  return templateId.startsWith('KA01BP')
}

export class SolapiClient {
  private apiKey: string
  private apiSecret: string
  private pfId: string
  private senderNumber: string
  private baseUrl = 'https://api.solapi.com'

  constructor(config: SolapiConfig) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.pfId = config.pfId
    this.senderNumber = config.senderNumber
  }

  private generateSignature(): { signature: string; timestamp: string; salt: string } {
    const timestamp = new Date().toISOString()
    const salt = crypto.randomBytes(16).toString('hex')
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(`${timestamp}${salt}`)
      .digest('hex')

    return { signature, timestamp, salt }
  }

  private getHeaders() {
    const { signature, timestamp, salt } = this.generateSignature()
    return {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${this.apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
    }
  }

  // 카카오 알림톡/브랜드메시지 발송
  async sendAlimtalk(message: AlimtalkMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // 전화번호에서 하이픈 제거
      const phoneNumber = message.to.replace(/-/g, '')
      const senderNumber = this.senderNumber.replace(/-/g, '')

      const isBrandMessage = isBrandMessageTemplate(message.templateId)

      // 기본 kakaoOptions 설정
      const kakaoOptions: {
        pfId: string
        templateId: string
        variables: Record<string, string>
        disableSms: boolean
        bms?: { targeting: string }
      } = {
        pfId: this.pfId,
        templateId: message.templateId,
        variables: message.variables || {},
        // 브랜드 메시지는 SMS 대체 발송 불가, 알림톡은 가능
        disableSms: isBrandMessage,
      }

      // 브랜드 메시지인 경우 bms 필드 추가
      if (isBrandMessage) {
        kakaoOptions.bms = {
          targeting: 'I', // 채널 친구만 발송
        }
      }

      console.log(`Sending ${isBrandMessage ? 'Brand Message (BMS)' : 'Alimtalk (ATA)'}:`, message.templateId)

      const response = await fetch(`${this.baseUrl}/messages/v4/send-many`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          messages: [{
            to: phoneNumber,
            from: senderNumber,
            kakaoOptions,
          }],
        }),
      })

      const result = await response.json()

      console.log('Solapi response:', JSON.stringify(result, null, 2))

      if (response.ok && result.groupId) {
        return { success: true, messageId: result.groupId }
      } else {
        console.error('Solapi error:', result)
        return { success: false, error: result.errorMessage || result.message || 'Failed to send message' }
      }
    } catch (error) {
      console.error('Solapi exception:', error)
      return { success: false, error: String(error) }
    }
  }

  // SMS 발송 (알림톡 실패 시 대체)
  async sendSms(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // 전화번호에서 하이픈 제거
      const phoneNumber = message.to.replace(/-/g, '')
      const senderNumber = this.senderNumber.replace(/-/g, '')

      const response = await fetch(`${this.baseUrl}/messages/v4/send-many`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          messages: [{
            to: phoneNumber,
            from: senderNumber,
            type: 'SMS',
            text: message.text,
          }],
        }),
      })

      const result = await response.json()

      console.log('Solapi SMS response:', JSON.stringify(result, null, 2))

      if (response.ok && result.groupId) {
        return { success: true, messageId: result.groupId }
      } else {
        console.error('Solapi SMS error:', result)
        return { success: false, error: result.errorMessage || result.message || 'Failed to send SMS' }
      }
    } catch (error) {
      console.error('Solapi SMS exception:', error)
      return { success: false, error: String(error) }
    }
  }

  // 알림톡 발송 (실패 시 SMS 대체 발송)
  async sendWithFallback(
    alimtalk: AlimtalkMessage,
    smsText: string
  ): Promise<{ success: boolean; channel: 'alimtalk' | 'sms'; messageId?: string; error?: string }> {
    // 먼저 알림톡 시도
    const alimtalkResult = await this.sendAlimtalk(alimtalk)

    if (alimtalkResult.success) {
      return { ...alimtalkResult, channel: 'alimtalk' }
    }

    // 알림톡 실패 시 SMS 발송
    console.log('Alimtalk failed, falling back to SMS')
    const smsResult = await this.sendSms({ to: alimtalk.to, text: smsText })

    return { ...smsResult, channel: 'sms' }
  }
}

// 알림 템플릿 정의
export const NotificationTemplates = {
  // 강사 배정 알림
  INSTRUCTOR_ASSIGNED: {
    templateId: 'KA01PF240101000001', // 실제 템플릿 ID로 변경 필요
    getVariables: (data: {
      instructorName: string
      schoolName: string
      programName: string
      date: string
      sessions: number
    }) => ({
      '#{강사명}': data.instructorName,
      '#{학교명}': data.schoolName,
      '#{프로그램}': data.programName,
      '#{날짜}': data.date,
      '#{차시}': String(data.sessions),
    }),
    getSmsText: (data: {
      instructorName: string
      schoolName: string
      programName: string
      date: string
      sessions: number
    }) => `[포인트교육] ${data.instructorName}님, ${data.schoolName} ${data.programName} 수업에 배정되었습니다. 일시: ${data.date}, ${data.sessions}차시`,
  },

  // 지원 승인 알림
  APPLICATION_APPROVED: {
    templateId: 'KA01PF240101000002',
    getVariables: (data: {
      instructorName: string
      schoolName: string
      programName: string
    }) => ({
      '#{강사명}': data.instructorName,
      '#{학교명}': data.schoolName,
      '#{프로그램}': data.programName,
    }),
    getSmsText: (data: {
      instructorName: string
      schoolName: string
      programName: string
    }) => `[포인트교육] ${data.instructorName}님, ${data.schoolName} ${data.programName} 수업 지원이 승인되었습니다.`,
  },

  // 지원 거절 알림
  APPLICATION_REJECTED: {
    templateId: 'KA01PF240101000003',
    getVariables: (data: {
      instructorName: string
      schoolName: string
      reason?: string
    }) => ({
      '#{강사명}': data.instructorName,
      '#{학교명}': data.schoolName,
      '#{사유}': data.reason || '내부 검토 결과',
    }),
    getSmsText: (data: {
      instructorName: string
      schoolName: string
      reason?: string
    }) => `[포인트교육] ${data.instructorName}님, ${data.schoolName} 수업 지원이 반려되었습니다. 사유: ${data.reason || '내부 검토 결과'}`,
  },

  // 정산 완료 알림
  PAYMENT_COMPLETED: {
    templateId: 'KA01PF240101000004',
    getVariables: (data: {
      instructorName: string
      amount: string
      period: string
    }) => ({
      '#{강사명}': data.instructorName,
      '#{금액}': data.amount,
      '#{정산기간}': data.period,
    }),
    getSmsText: (data: {
      instructorName: string
      amount: string
      period: string
    }) => `[포인트교육] ${data.instructorName}님, ${data.period} 정산금액 ${data.amount}원이 입금 처리되었습니다.`,
  },
}

// 싱글톤 인스턴스 생성 헬퍼
let solapiInstance: SolapiClient | null = null

export function getSolapiClient(): SolapiClient {
  if (!solapiInstance) {
    solapiInstance = new SolapiClient({
      apiKey: process.env.SOLAPI_API_KEY || '',
      apiSecret: process.env.SOLAPI_API_SECRET || '',
      pfId: process.env.SOLAPI_PF_ID || '',
      senderNumber: process.env.SOLAPI_SENDER_NUMBER || '',
    })
  }
  return solapiInstance
}
