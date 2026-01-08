export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'

interface BulkRequestItem {
  programId: string | null
  customProgram: string | null
  instructorId: string | null
  sessions: number
  studentCount: number
  targetGrade: string
  scheduledTime: string
  note: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { schoolId, scheduledDate, items } = await request.json() as {
      schoolId: string
      scheduledDate: string
      items: BulkRequestItem[]
    }

    if (!schoolId || !scheduledDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 학교 확인
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    })

    if (!school) {
      return NextResponse.json(
        { error: '학교를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 번호 생성 함수
    const generateRequestNumber = async () => {
      const today = new Date()
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '')
      const count = await prisma.schoolRequest.count({
        where: {
          requestNumber: { startsWith: `REQ-${dateStr}` },
        },
      })
      return `REQ-${dateStr}-${String(count + 1).padStart(3, '0')}`
    }

    // 트랜잭션으로 대량 생성
    const createdRequests = await prisma.$transaction(async (tx) => {
      const results = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // 각 요청에 대해 고유 번호 생성
        const today = new Date()
        const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '')
        const existingCount = await tx.schoolRequest.count({
          where: {
            requestNumber: { startsWith: `REQ-${dateStr}` },
          },
        })
        const requestNumber = `REQ-${dateStr}-${String(existingCount + i + 1).padStart(3, '0')}`

        // 요청 생성
        const newRequest = await tx.schoolRequest.create({
          data: {
            requestNumber,
            schoolId,
            programId: item.programId || null,
            customProgram: item.customProgram || null,
            sessions: item.sessions || 2,
            studentCount: item.studentCount || 25,
            targetGrade: item.targetGrade || null,
            desiredDate: new Date(scheduledDate),
            preferredDates: [scheduledDate],
            requirements: item.note || null,
            status: item.instructorId ? 'ASSIGNED' : 'SUBMITTED',
          },
        })

        // 강사가 지정된 경우 배정 생성
        if (item.instructorId) {
          await tx.instructorAssignment.create({
            data: {
              requestId: newRequest.id,
              instructorId: item.instructorId,
              status: 'CONFIRMED',
              scheduledDate: new Date(scheduledDate),
              scheduledTime: item.scheduledTime || null,
              distanceKm: school.distanceKm || 0,
              transportFee: 0, // 나중에 정산 시 계산
            },
          })
        }

        results.push(newRequest)
      }

      return results
    })

    return NextResponse.json({
      success: true,
      count: createdRequests.length,
      requests: createdRequests,
    })
  } catch (error) {
    console.error('Failed to create bulk requests:', error)
    return NextResponse.json(
      { error: '대량 요청 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
