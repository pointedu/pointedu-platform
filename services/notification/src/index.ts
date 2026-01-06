// Notification Service for Point Education Platform
// Handles email, SMS, and push notifications

export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH'

export interface NotificationPayload {
  type: NotificationType
  to: string
  subject?: string
  title: string
  message: string
  template?: string
  data?: Record<string, any>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface SMSConfig {
  apiKey: string
  senderId: string
}

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  REQUEST_RECEIVED: 'request-received',
  REQUEST_APPROVED: 'request-approved',
  INSTRUCTOR_ASSIGNED: 'instructor-assigned',
  PAYMENT_COMPLETED: 'payment-completed',
  REMINDER: 'reminder',
} as const

// SMS templates
export const SMS_TEMPLATES = {
  VERIFICATION: 'verification',
  REMINDER: 'reminder',
  NOTIFICATION: 'notification',
} as const

// Template rendering
export function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  })
  return result
}

// Email template contents
export const emailTemplates: Record<string, { subject: string; body: string }> = {
  [EMAIL_TEMPLATES.WELCOME]: {
    subject: '포인트교육에 오신 것을 환영합니다',
    body: `
안녕하세요 {{name}}님,

포인트교육에 가입해 주셔서 감사합니다.
저희와 함께 미래 교육을 만들어 나가요!

문의사항이 있으시면 언제든 연락해 주세요.

감사합니다.
포인트교육 드림
    `.trim(),
  },
  [EMAIL_TEMPLATES.REQUEST_RECEIVED]: {
    subject: '[포인트교육] 교육 신청이 접수되었습니다',
    body: `
안녕하세요 {{schoolName}} {{contactName}}님,

교육 신청이 정상적으로 접수되었습니다.

신청 번호: {{requestNumber}}
프로그램: {{programName}}
희망 일자: {{desiredDate}}
학생 수: {{studentCount}}명

담당자가 검토 후 빠른 시일 내에 연락드리겠습니다.

감사합니다.
포인트교육 드림
    `.trim(),
  },
  [EMAIL_TEMPLATES.INSTRUCTOR_ASSIGNED]: {
    subject: '[포인트교육] 강사가 배정되었습니다',
    body: `
안녕하세요 {{name}}님,

{{requestNumber}} 요청에 강사가 배정되었습니다.

배정 강사: {{instructorName}}
수업 일자: {{scheduledDate}}
수업 시간: {{scheduledTime}}

문의사항이 있으시면 연락해 주세요.

감사합니다.
포인트교육 드림
    `.trim(),
  },
  [EMAIL_TEMPLATES.PAYMENT_COMPLETED]: {
    subject: '[포인트교육] 정산이 완료되었습니다',
    body: `
안녕하세요 {{instructorName}}님,

{{paymentNumber}} 정산이 완료되어 안내드립니다.

정산 금액: {{amount}}원
지급일: {{paidAt}}

이번 달도 수고 많으셨습니다.

감사합니다.
포인트교육 드림
    `.trim(),
  },
}

// Notification queue (in-memory for demo)
const notificationQueue: NotificationPayload[] = []

export function queueNotification(payload: NotificationPayload): void {
  notificationQueue.push(payload)
  console.log(`Notification queued: ${payload.type} to ${payload.to}`)
}

export function getQueuedNotifications(): NotificationPayload[] {
  return [...notificationQueue]
}

export function clearNotificationQueue(): void {
  notificationQueue.length = 0
}

// Send functions (placeholder implementations)
export async function sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
  console.log(`[EMAIL] Sending to ${payload.to}: ${payload.subject || payload.title}`)
  // In production, use nodemailer or similar
  return { success: true, messageId: `email-${Date.now()}` }
}

export async function sendSMS(payload: NotificationPayload): Promise<NotificationResult> {
  console.log(`[SMS] Sending to ${payload.to}: ${payload.message}`)
  // In production, integrate with SMS provider
  return { success: true, messageId: `sms-${Date.now()}` }
}

export async function sendPush(payload: NotificationPayload): Promise<NotificationResult> {
  console.log(`[PUSH] Sending to ${payload.to}: ${payload.title}`)
  // In production, integrate with push notification service
  return { success: true, messageId: `push-${Date.now()}` }
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  switch (payload.type) {
    case 'EMAIL':
      return sendEmail(payload)
    case 'SMS':
      return sendSMS(payload)
    case 'PUSH':
      return sendPush(payload)
    default:
      return { success: false, error: 'Unknown notification type' }
  }
}

// Bulk notifications
export async function sendBulkNotifications(
  payloads: NotificationPayload[]
): Promise<NotificationResult[]> {
  return Promise.all(payloads.map(sendNotification))
}

// Export service
export const notificationService = {
  sendEmail,
  sendSMS,
  sendPush,
  sendNotification,
  sendBulkNotifications,
  queueNotification,
  getQueuedNotifications,
  clearNotificationQueue,
  renderTemplate,
  emailTemplates,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
}

console.log('Notification service module loaded')
