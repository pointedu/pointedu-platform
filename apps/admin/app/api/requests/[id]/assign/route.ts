import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import { sendAssignmentNotification } from '../../../../../lib/notification'

// 안전한 숫자 변환 함수
function safeParseInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10)
  return isNaN(parsed) ? null : parsed
}

function safeParseFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(parsed) ? null : parsed
}

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

    // 필수 파라미터 검증
    if (!instructorId) {
      return NextResponse.json({ error: '강사를 선택해주세요.' }, { status: 400 })
    }

    // 요청 존재 및 상태 확인
    const existingRequest = await prisma.schoolRequest.findUnique({
      where: { id: params.id },
      include: {
        school: true,
        program: true,
        assignments: {
          where: { status: { notIn: ['CANCELLED', 'DECLINED'] } }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: '수업 요청을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 활성 배정이 있는지 확인
    if (existingRequest.assignments.length > 0) {
      return NextResponse.json(
        { error: '이미 강사가 배정된 요청입니다. 기존 배정을 취소 후 다시 시도해주세요.' },
        { status: 400 }
      )
    }

    // 취소되거나 완료된 요청에는 배정 불가
    if (['CANCELLED', 'COMPLETED'].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: `${existingRequest.status === 'CANCELLED' ? '취소된' : '완료된'} 요청에는 강사를 배정할 수 없습니다.` },
        { status: 400 }
      )
    }

    // 강사 존재 여부 및 상태 확인
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    })

    if (!instructor) {
      return NextResponse.json({ error: '선택한 강사를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (instructor.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '현재 활동 중이지 않은 강사입니다.' },
        { status: 400 }
      )
    }

    // 같은 날짜에 이미 배정된 수업이 있는지 확인 (중복 배정 방지)
    if (scheduledDate) {
      const scheduledDay = new Date(scheduledDate)
      scheduledDay.setHours(0, 0, 0, 0)
      const nextDay = new Date(scheduledDay)
      nextDay.setDate(nextDay.getDate() + 1)

      const existingAssignment = await prisma.instructorAssignment.findFirst({
        where: {
          instructorId,
          scheduledDate: {
            gte: scheduledDay,
            lt: nextDay,
          },
          status: { notIn: ['CANCELLED', 'DECLINED'] },
        },
        include: {
          request: {
            include: { school: true }
          }
        }
      })

      if (existingAssignment) {
        return NextResponse.json(
          { error: `해당 날짜에 이미 ${existingAssignment.request.school.name}에 배정되어 있습니다.` },
          { status: 400 }
        )
      }
    }

    // Create assignment
    const assignment = await prisma.instructorAssignment.create({
      data: {
        requestId: params.id,
        instructorId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTime,
        distanceKm: safeParseInt(distanceKm),
        transportFee: safeParseFloat(transportFee),
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
