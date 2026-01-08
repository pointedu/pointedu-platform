export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'

// POST - 수업 공개 및 전체 강사 알림 발송
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      isPublic = true,
      minInstructorGrade = null,
      sendNotification = true
    } = body

    // 요청 조회
    const schoolRequest = await prisma.schoolRequest.findUnique({
      where: { id: params.id },
      include: {
        school: true,
        program: true,
      },
    })

    if (!schoolRequest) {
      return NextResponse.json(
        { error: '수업 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 배정된 경우 확인
    const existingAssignment = await prisma.instructorAssignment.findFirst({
      where: {
        requestId: params.id,
        status: { in: ['PROPOSED', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: '이미 강사가 배정된 수업입니다.' },
        { status: 400 }
      )
    }

    // 수업 공개 설정 업데이트
    const updatedRequest = await prisma.schoolRequest.update({
      where: { id: params.id },
      data: {
        isPublic,
        publicAt: isPublic ? new Date() : null,
        minInstructorGrade: minInstructorGrade || null,
      },
    })

    // 전체 강사에게 알림 발송
    const notificationResult = { sent: 0, failed: 0 }
    if (isPublic && sendNotification) {
      // 활성 강사 조회 (최소 등급 조건 적용)
      const gradeOrder = ['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4']
      const minGradeIndex = minInstructorGrade
        ? gradeOrder.indexOf(minInstructorGrade)
        : 0

      const eligibleGrades = gradeOrder.slice(minGradeIndex)

      const instructors = await prisma.instructor.findMany({
        where: {
          status: 'ACTIVE',
          phoneNumber: { not: '' },
          OR: [
            // 내부 강사: 등급 조건 적용
            {
              instructorType: 'INTERNAL',
              grade: { in: eligibleGrades as ('LEVEL1' | 'LEVEL2' | 'LEVEL3' | 'LEVEL4')[] },
            },
            // 외부 강사: 모두 포함 (별도 등급 체계)
            {
              instructorType: 'EXTERNAL',
            },
          ],
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          instructorType: true,
          grade: true,
        },
      })

      // 솔라피 API로 대량 알림 발송
      const apiKey = process.env.SOLAPI_API_KEY
      const senderNumber = process.env.SOLAPI_SENDER_NUMBER

      if (apiKey && senderNumber) {
        const dateStr = schoolRequest.desiredDate
          ? new Date(schoolRequest.desiredDate).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })
          : '일정 협의'

        const programName = schoolRequest.program?.name || schoolRequest.customProgram || '미정'

        for (const instructor of instructors) {
          if (!instructor.phoneNumber) continue

          try {
            // SMS 메시지 구성
            const smsText = `[포인트교육] ${instructor.name}님, 새로운 수업이 공개되었습니다.\n\n학교: ${schoolRequest.school.name}\n프로그램: ${programName}\n일정: ${dateStr}\n차시: ${schoolRequest.sessions}차시\n\n관리자 페이지에서 지원해주세요.`

            // 개별 발송 (대량 발송 API 사용 시 최적화 가능)
            const crypto = await import('crypto')
            const apiSecret = process.env.SOLAPI_API_SECRET!
            const timestamp = new Date().toISOString()
            const salt = crypto.randomBytes(16).toString('hex')
            const signature = crypto
              .createHmac('sha256', apiSecret)
              .update(`${timestamp}${salt}`)
              .digest('hex')

            const response = await fetch('https://api.solapi.com/messages/v4/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
              },
              body: JSON.stringify({
                message: {
                  to: instructor.phoneNumber.replace(/-/g, ''),
                  from: senderNumber.replace(/-/g, ''),
                  text: smsText,
                },
              }),
            })

            if (response.ok) {
              notificationResult.sent++
            } else {
              notificationResult.failed++
            }
          } catch (error) {
            console.error(`Failed to send notification to ${instructor.name}:`, error)
            notificationResult.failed++
          }
        }

        // 알림 발송 완료 시간 기록
        await prisma.schoolRequest.update({
          where: { id: params.id },
          data: { publicNotifiedAt: new Date() },
        })
      }
    }

    return NextResponse.json({
      success: true,
      isPublic: updatedRequest.isPublic,
      notification: notificationResult,
      message: isPublic
        ? `수업이 공개되었습니다. (알림 발송: ${notificationResult.sent}명)`
        : '수업 공개가 취소되었습니다.',
    })
  } catch (error) {
    console.error('Failed to publish request:', error)
    return NextResponse.json(
      { error: '수업 공개 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
