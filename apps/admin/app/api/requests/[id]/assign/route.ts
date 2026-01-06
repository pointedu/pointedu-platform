import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import { sendAssignmentNotification } from '../../../../../lib/notification'

// POST - Assign instructor to request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      instructorId,
      scheduledDate,
      scheduledTime,
      distanceKm,       // 강사-학교 거리
      transportFee,     // 계산된 교통비
      sendNotification = true
    } = body

    // Create assignment
    const assignment = await prisma.instructorAssignment.create({
      data: {
        requestId: params.id,
        instructorId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTime,
        distanceKm: distanceKm ? parseInt(distanceKm) : null,
        transportFee: transportFee ? parseFloat(transportFee) : null,
        status: 'PROPOSED',
      },
      include: {
        instructor: true,
        request: {
          include: {
            school: true,
            program: true,
          }
        },
      },
    })

    // Update request status
    await prisma.schoolRequest.update({
      where: { id: params.id },
      data: { status: 'ASSIGNED' },
    })

    // 알림 발송 (옵션)
    let notificationResult = null
    if (sendNotification && assignment.instructor.phoneNumber) {
      const dateStr = scheduledDate
        ? new Date(scheduledDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })
        : '미정'

      notificationResult = await sendAssignmentNotification({
        phoneNumber: assignment.instructor.phoneNumber,
        instructorName: assignment.instructor.name,
        schoolName: assignment.request.school.name,
        programName: assignment.request.program?.name || assignment.request.customProgram || '미정',
        date: dateStr,
        time: scheduledTime || undefined,
        sessions: assignment.request.sessions,
      })

      // 알림 발송 성공 시 상태 업데이트
      if (notificationResult.success) {
        await prisma.instructorAssignment.update({
          where: { id: assignment.id },
          data: { notificationSent: true },
        })
      }
    }

    return NextResponse.json({
      ...assignment,
      notification: notificationResult,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to assign instructor:', error)
    return NextResponse.json({ error: 'Failed to assign instructor' }, { status: 500 })
  }
}
