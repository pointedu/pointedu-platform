import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import { sendAssignmentNotification } from '../../../../lib/notification'

// GET - Get assignment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.instructorAssignment.findUnique({
      where: { id: params.id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            homeBase: true,
            subjects: true,
          }
        },
        request: {
          include: {
            school: true,
            program: true,
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: '배정을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to get assignment:', error)
    return NextResponse.json({ error: '배정 정보 조회에 실패했습니다.' }, { status: 500 })
  }
}

// PUT - Update assignment (change instructor, date, time, transport)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      instructorId,
      scheduledDate,
      scheduledTime,
      distanceKm,
      transportFee,
      sendNotification = false,
      reason,
    } = body

    // Get existing assignment
    const existingAssignment = await prisma.instructorAssignment.findUnique({
      where: { id: params.id },
      include: {
        instructor: true,
        request: {
          include: {
            school: true,
            program: true,
          }
        }
      }
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: '배정을 찾을 수 없습니다.' }, { status: 404 })
    }

    // Check if instructor is being changed
    const isInstructorChanged = instructorId && instructorId !== existingAssignment.instructorId

    // Update the assignment
    const updatedAssignment = await prisma.instructorAssignment.update({
      where: { id: params.id },
      data: {
        ...(instructorId && { instructorId }),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingAssignment.scheduledDate,
        scheduledTime: scheduledTime !== undefined ? scheduledTime : existingAssignment.scheduledTime,
        distanceKm: distanceKm !== undefined ? (distanceKm ? parseInt(distanceKm) : null) : existingAssignment.distanceKm,
        transportFee: transportFee !== undefined ? (transportFee ? parseFloat(transportFee) : null) : existingAssignment.transportFee,
        // If instructor changed, reset status to PROPOSED
        ...(isInstructorChanged && { status: 'PROPOSED', notificationSent: false }),
        updatedAt: new Date(),
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            homeBase: true,
          }
        },
        request: {
          include: {
            school: true,
            program: true,
          }
        }
      }
    })

    // Log the change (history table not yet implemented)
    console.log('Assignment updated:', {
      assignmentId: params.id,
      previousInstructorId: existingAssignment.instructorId,
      newInstructorId: isInstructorChanged ? instructorId : existingAssignment.instructorId,
      reason: reason || '배정 정보 수정',
    })

    // Send notification to new instructor if requested
    let notificationResult = null
    if (sendNotification && updatedAssignment.instructor.phoneNumber) {
      const dateStr = updatedAssignment.scheduledDate
        ? new Date(updatedAssignment.scheduledDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })
        : '미정'

      notificationResult = await sendAssignmentNotification({
        phoneNumber: updatedAssignment.instructor.phoneNumber,
        instructorName: updatedAssignment.instructor.name,
        schoolName: updatedAssignment.request.school.name,
        programName: updatedAssignment.request.program?.name || updatedAssignment.request.customProgram || '미정',
        date: dateStr,
        time: updatedAssignment.scheduledTime || undefined,
        sessions: updatedAssignment.request.sessions,
      })

      if (notificationResult.success) {
        await prisma.instructorAssignment.update({
          where: { id: params.id },
          data: { notificationSent: true }
        })
      }
    }

    return NextResponse.json({
      ...updatedAssignment,
      notification: notificationResult,
      message: isInstructorChanged
        ? '강사가 변경되었습니다. 상태가 "제안됨"으로 변경되었습니다.'
        : '배정 정보가 수정되었습니다.',
    })
  } catch (error) {
    console.error('Failed to update assignment:', error)
    return NextResponse.json({ error: '배정 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE - Cancel/delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || '관리자에 의한 삭제'

    const assignment = await prisma.instructorAssignment.findUnique({
      where: { id: params.id },
      include: { request: true }
    })

    if (!assignment) {
      return NextResponse.json({ error: '배정을 찾을 수 없습니다.' }, { status: 404 })
    }

    // Update assignment status to cancelled
    await prisma.instructorAssignment.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        notes: `취소 사유: ${reason}`,
        updatedAt: new Date(),
      }
    })

    // Check if there are other active assignments for this request
    const activeAssignments = await prisma.instructorAssignment.count({
      where: {
        requestId: assignment.requestId,
        status: { notIn: ['CANCELLED'] }
      }
    })

    // If no active assignments, update request status back to SUBMITTED
    if (activeAssignments === 0) {
      await prisma.schoolRequest.update({
        where: { id: assignment.requestId },
        data: { status: 'SUBMITTED' }
      })
    }

    return NextResponse.json({
      message: '배정이 취소되었습니다.',
      requestStatusUpdated: activeAssignments === 0
    })
  } catch (error) {
    console.error('Failed to delete assignment:', error)
    return NextResponse.json({ error: '배정 삭제에 실패했습니다.' }, { status: 500 })
  }
}
