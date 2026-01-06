/**
 * 알림 관리자
 * 이메일, SMS, 푸시 알림 자동 발송
 */

import { prisma } from '@pointedu/database'

export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH'

export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
}

/**
 * 알림 템플릿
 */
export const NOTIFICATION_TEMPLATES = {
  // 강사 배정 알림
  INSTRUCTOR_ASSIGNED: {
    instructor: {
      type: 'EMAIL' as NotificationType,
      title: '새로운 수업이 배정되었습니다',
      message: (data: { schoolName: string; programName: string; date: string }) =>
        `안녕하세요,\n\n${data.schoolName}의 ${data.programName} 수업이 배정되었습니다.\n일정: ${data.date}\n\n포인트교육 드림`,
    },
    admin: {
      type: 'EMAIL' as NotificationType,
      title: '강사 배정 완료',
      message: (data: { instructorName: string; schoolName: string }) =>
        `${data.instructorName} 강사가 ${data.schoolName}에 배정되었습니다.`,
    },
  },

  // 견적 생성 알림
  QUOTE_GENERATED: {
    school: {
      type: 'EMAIL' as NotificationType,
      title: '견적서가 발송되었습니다',
      message: (data: { schoolName: string; amount: string }) =>
        `안녕하세요 ${data.schoolName} 담당자님,\n\n요청하신 프로그램 견적서가 준비되었습니다.\n견적 금액: ${data.amount}원\n\n포인트교육 드림`,
    },
  },

  // 정산 완료 알림
  PAYMENT_PROCESSED: {
    instructor: {
      type: 'EMAIL' as NotificationType,
      title: '정산이 완료되었습니다',
      message: (data: { month: string; amount: string }) =>
        `안녕하세요,\n\n${data.month} 정산이 완료되었습니다.\n지급액: ${data.amount}원\n\n포인트교육 드림`,
    },
  },

  // 요청서 접수 알림
  REQUEST_RECEIVED: {
    admin: {
      type: 'EMAIL' as NotificationType,
      title: '새로운 요청서가 접수되었습니다',
      message: (data: { schoolName: string; programName: string }) =>
        `${data.schoolName}에서 ${data.programName} 요청서가 접수되었습니다.`,
    },
  },

  // 수업 완료 알림
  CLASS_COMPLETED: {
    admin: {
      type: 'EMAIL' as NotificationType,
      title: '수업이 완료되었습니다',
      message: (data: { instructorName: string; schoolName: string }) =>
        `${data.instructorName} 강사의 ${data.schoolName} 수업이 완료되었습니다.`,
    },
  },
}

/**
 * 알림 생성 및 저장
 */
export async function createNotification(params: {
  userId?: string
  email?: string
  phoneNumber?: string
  type: NotificationType
  title: string
  message: string
  relatedType?: string
  relatedId?: string
}): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      email: params.email,
      phoneNumber: params.phoneNumber,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      sent: false,
      read: false,
    },
  })

  return notification.id
}

/**
 * 강사 배정 알림 발송
 */
export async function notifyInstructorAssignment(assignmentId: string): Promise<void> {
  const assignment = await prisma.instructorAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      instructor: {
        include: { user: true },
      },
      request: {
        include: {
          school: true,
          program: true,
        },
      },
    },
  })

  if (!assignment) return

  const template = NOTIFICATION_TEMPLATES.INSTRUCTOR_ASSIGNED.instructor
  const data = {
    schoolName: assignment.request.school.name,
    programName: assignment.request.program?.name || assignment.request.customProgram || '프로그램',
    date: assignment.scheduledDate?.toLocaleDateString('ko-KR') || '미정',
  }

  await createNotification({
    userId: assignment.instructor.userId,
    email: assignment.instructor.email || assignment.instructor.user.email,
    type: template.type,
    title: template.title,
    message: template.message(data),
    relatedType: 'InstructorAssignment',
    relatedId: assignmentId,
  })
}

/**
 * 견적 생성 알림 발송
 */
export async function notifyQuoteGenerated(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      request: {
        include: {
          school: {
            include: {
              contacts: {
                where: { isPrimary: true },
                include: { user: true },
              },
            },
          },
        },
      },
    },
  })

  if (!quote) return

  const template = NOTIFICATION_TEMPLATES.QUOTE_GENERATED.school
  const data = {
    schoolName: quote.request.school.name,
    amount: Number(quote.finalTotal).toLocaleString(),
  }

  const primaryContact = quote.request.school.contacts[0]
  if (primaryContact) {
    await createNotification({
      userId: primaryContact.userId,
      email: primaryContact.email || primaryContact.user.email,
      type: template.type,
      title: template.title,
      message: template.message(data),
      relatedType: 'Quote',
      relatedId: quoteId,
    })
  }
}

/**
 * 정산 완료 알림 발송
 */
export async function notifyPaymentProcessed(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      instructor: {
        include: { user: true },
      },
    },
  })

  if (!payment) return

  const template = NOTIFICATION_TEMPLATES.PAYMENT_PROCESSED.instructor
  const data = {
    month: payment.accountingMonth,
    amount: Number(payment.netAmount).toLocaleString(),
  }

  await createNotification({
    userId: payment.instructor.userId,
    email: payment.instructor.email || payment.instructor.user.email,
    type: template.type,
    title: template.title,
    message: template.message(data),
    relatedType: 'Payment',
    relatedId: paymentId,
  })
}

/**
 * 미발송 알림 조회
 */
export async function getPendingNotifications(limit: number = 10) {
  return await prisma.notification.findMany({
    where: {
      sent: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
  })
}

/**
 * 알림 발송 완료 처리
 */
export async function markNotificationAsSent(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      sent: true,
      sentAt: new Date(),
    },
  })
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  })
}

/**
 * 사용자 알림 조회
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean
    limit?: number
  } = {}
) {
  return await prisma.notification.findMany({
    where: {
      userId,
      ...(options.unreadOnly ? { read: false } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options.limit || 50,
  })
}
