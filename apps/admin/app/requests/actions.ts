'use server'

import { AutomationWorkflow } from '@pointedu/automation'
import { revalidatePath } from 'next/cache'

export async function automateRequest(requestId: string) {
  try {
    // Admin user ID (in production, get from session)
    const adminUserId = 'admin-123'

    // Run automation workflow
    const result = await AutomationWorkflow.processSchoolRequest({
      requestId,
      adminUserId,
      autoAssign: true,
      adjustToBudget: true,
    })

    // Revalidate the requests page
    revalidatePath('/requests')

    return {
      success: result.success,
      message: result.message,
      quote: result.quote,
      assignment: result.assignment,
    }
  } catch (error) {
    console.error('Automation error:', error)
    return {
      success: false,
      message: `자동화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}
