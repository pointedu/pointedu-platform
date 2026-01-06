/**
 * Point Education Automation Package
 * 포인트교육 업무 자동화 패키지
 *
 * @module @pointedu/automation
 */

// Instructor Scheduler (강사 자동 배정)
export {
  matchInstructorsForRequest,
  autoAssignInstructor,
  type MatchCriteria,
  type InstructorMatch,
} from './instructor-scheduler/matcher'

// Payment Calculator (정산 자동 계산)
export {
  calculateSessionFee,
  calculatePaymentForAssignment,
  createPayment,
  autoGeneratePayment,
  getMonthlyPaymentSummary,
  SESSION_FEE_TABLE,
  TAX_WITHHOLDING_RATE,
  type PaymentCalculation,
} from './payment-calculator/calculator'

// Quote Generator (견적 자동 생성)
export {
  calculateQuoteForRequest,
  adjustQuoteToBudget,
  createQuote,
  autoGenerateQuote,
  type QuoteOptions,
  type QuoteCalculation,
} from './quote-generator/generator'

// Notification Manager (알림 관리)
export {
  createNotification,
  notifyInstructorAssignment,
  notifyQuoteGenerated,
  notifyPaymentProcessed,
  getPendingNotifications,
  markNotificationAsSent,
  markNotificationAsRead,
  getUserNotifications,
  NOTIFICATION_TEMPLATES,
  type NotificationType,
  type NotificationTemplate,
} from './notification-manager/manager'

// Utilities (유틸리티)
export {
  calculateDistance,
  calculateTransportFee,
  getTransportFeeForSchool,
  parseRangeKm,
  canInstructorTravel,
  POINTEDU_HQ,
  TRANSPORT_FEE_RANGES,
} from './utils/distance'

/**
 * 통합 자동화 워크플로우
 */
export class AutomationWorkflow {
  /**
   * 학교 요청 → 견적 → 강사 배정 → 정산 (전체 자동화)
   */
  static async processSchoolRequest(params: {
    requestId: string
    adminUserId: string
    autoAssign?: boolean
    adjustToBudget?: boolean
  }): Promise<{
    success: boolean
    quote?: { quoteId: string; amount: number }
    assignment?: { assignmentId: string; instructorName: string }
    message: string
  }> {
    try {
      const { requestId, adminUserId, autoAssign = true, adjustToBudget = true } = params

      // 1. 견적 자동 생성
      const quoteResult = await import('./quote-generator/generator').then((m) =>
        m.autoGenerateQuote(requestId, adminUserId, adjustToBudget)
      )

      if (!quoteResult.success) {
        return { success: false, message: `견적 생성 실패: ${quoteResult.message}` }
      }

      const quote = await import('@pointedu/database').then(({ prisma }) =>
        prisma.quote.findUnique({ where: { id: quoteResult.quoteId } })
      )

      const result: any = {
        success: true,
        quote: {
          quoteId: quoteResult.quoteId!,
          amount: quote ? Number(quote.finalTotal) : 0,
        },
        message: '견적이 생성되었습니다.',
      }

      // 2. 강사 자동 배정 (옵션)
      if (autoAssign) {
        const assignmentResult = await import('./instructor-scheduler/matcher').then((m) =>
          m.autoAssignInstructor(requestId)
        )

        if (assignmentResult.success) {
          const assignment = await import('@pointedu/database').then(({ prisma }) =>
            prisma.instructorAssignment.findUnique({
              where: { id: assignmentResult.assignmentId },
              include: { instructor: true },
            })
          )

          result.assignment = {
            assignmentId: assignmentResult.assignmentId!,
            instructorName: assignment?.instructor.name || '',
          }
          result.message += ` 강사가 배정되었습니다.`
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        message: `자동화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      }
    }
  }

  /**
   * 수업 완료 → 자동 정산
   */
  static async processCompletedClass(params: {
    assignmentId: string
    approvedBy: string
  }): Promise<{
    success: boolean
    paymentId?: string
    amount?: number
    message: string
  }> {
    try {
      const { assignmentId, approvedBy } = params

      // 정산 자동 생성
      const result = await import('./payment-calculator/calculator').then((m) =>
        m.autoGeneratePayment(assignmentId, approvedBy)
      )

      if (!result.success) {
        return { success: false, message: result.message }
      }

      const payment = await import('@pointedu/database').then(({ prisma }) =>
        prisma.payment.findUnique({ where: { id: result.paymentId } })
      )

      return {
        success: true,
        paymentId: result.paymentId,
        amount: payment ? Number(payment.netAmount) : 0,
        message: result.message,
      }
    } catch (error) {
      return {
        success: false,
        message: `정산 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      }
    }
  }
}

// 기본 export
export default {
  AutomationWorkflow,
}
