import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { sendReminderNotification } from '../../../../lib/notification'

// 5일 후 수업 예정인 강사들에게 리마인더 알림 발송
// 이 API는 매일 오전 9시에 호출되도록 설정 (Vercel Cron, n8n, 또는 외부 스케줄러 사용)
// GET /api/cron/reminder?secret=YOUR_CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // CRON 보안 토큰 확인
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 5일 후 날짜 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const reminderDate = new Date(today)
    reminderDate.setDate(reminderDate.getDate() + 5)

    const nextDay = new Date(reminderDate)
    nextDay.setDate(nextDay.getDate() + 1)

    console.log(`Looking for assignments scheduled between ${reminderDate.toISOString()} and ${nextDay.toISOString()}`)

    // 5일 후에 수업이 예정된 배정 조회
    const assignments = await prisma.instructorAssignment.findMany({
      where: {
        scheduledDate: {
          gte: reminderDate,
          lt: nextDay,
        },
        status: {
          in: ['PROPOSED', 'CONFIRMED'],
        },
        reminderSent: false, // 이미 발송된 경우 제외
      },
      include: {
        instructor: true,
        request: {
          include: {
            school: true,
            program: true,
          },
        },
      },
    })

    console.log(`Found ${assignments.length} assignments for reminder`)

    const results = {
      total: assignments.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    }

    // 각 배정에 대해 리마인더 발송
    for (const assignment of assignments) {
      const instructor = assignment.instructor
      const request = assignment.request

      // 전화번호가 없으면 스킵
      if (!instructor.phoneNumber) {
        results.skipped++
        results.details.push({
          assignmentId: assignment.id,
          instructorName: instructor.name,
          status: 'skipped',
          reason: 'No phone number',
        })
        continue
      }

      const dateStr = assignment.scheduledDate
        ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })
        : '미정'

      // 알림 발송
      const notificationResult = await sendReminderNotification({
        phoneNumber: instructor.phoneNumber,
        instructorName: instructor.name,
        schoolName: request.school.name,
        programName: request.program?.name || request.customProgram || '미정',
        date: dateStr,
        time: assignment.scheduledTime || undefined,
        sessions: request.sessions,
      })

      if (notificationResult.success) {
        results.sent++

        // 발송 완료 표시
        await prisma.instructorAssignment.update({
          where: { id: assignment.id },
          data: { reminderSent: true },
        })

        results.details.push({
          assignmentId: assignment.id,
          instructorName: instructor.name,
          status: 'sent',
          messageId: notificationResult.messageId,
        })
      } else {
        results.failed++
        results.details.push({
          assignmentId: assignment.id,
          instructorName: instructor.name,
          status: 'failed',
          error: notificationResult.error,
        })
      }
    }

    console.log('Reminder results:', results)

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} reminders, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    })
  } catch (error) {
    console.error('Reminder cron error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// POST - 수동으로 특정 날짜의 리마인더 발송 (관리자용)
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { daysAhead = 5 } = body

    // 지정된 일수 후 날짜 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysAhead)

    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // 해당 날짜에 수업이 예정된 배정 조회
    const assignments = await prisma.instructorAssignment.findMany({
      where: {
        scheduledDate: {
          gte: targetDate,
          lt: nextDay,
        },
        status: {
          in: ['PROPOSED', 'CONFIRMED'],
        },
      },
      include: {
        instructor: true,
        request: {
          include: {
            school: true,
            program: true,
          },
        },
      },
    })

    const results = {
      total: assignments.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    }

    for (const assignment of assignments) {
      const instructor = assignment.instructor
      const request = assignment.request

      if (!instructor.phoneNumber) {
        results.skipped++
        results.details.push({
          assignmentId: assignment.id,
          instructorName: instructor.name,
          status: 'skipped',
          reason: 'No phone number',
        })
        continue
      }

      const dateStr = assignment.scheduledDate
        ? new Date(assignment.scheduledDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })
        : '미정'

      const notificationResult = await sendReminderNotification({
        phoneNumber: instructor.phoneNumber,
        instructorName: instructor.name,
        schoolName: request.school.name,
        programName: request.program?.name || request.customProgram || '미정',
        date: dateStr,
        time: assignment.scheduledTime || undefined,
        sessions: request.sessions,
      })

      if (notificationResult.success) {
        results.sent++

        await prisma.instructorAssignment.update({
          where: { id: assignment.id },
          data: { reminderSent: true },
        })

        results.details.push({
          assignmentId: assignment.id,
          instructorName: instructor.name,
          status: 'sent',
          messageId: notificationResult.messageId,
        })
      } else {
        results.failed++
        results.details.push({
          assignmentId: assignment.id,
          instructorName: instructor.name,
          status: 'failed',
          error: notificationResult.error,
        })
      }
    }

    return NextResponse.json({
      success: true,
      targetDate: targetDate.toISOString(),
      message: `Sent ${results.sent} reminders, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    })
  } catch (error) {
    console.error('Manual reminder error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}
