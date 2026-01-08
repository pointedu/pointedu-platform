export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { Prisma } from '@pointedu/database'
import { calculateInstructorGrade, INTERNAL_GRADES, EXTERNAL_GRADES } from '../../../../../lib/instructor-grade'

// GET - 강사 등급 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        instructorType: true,
        grade: true,
        externalGrade: true,
        feeMultiplier: true,
        gradeUpdatedAt: true,
        totalClasses: true,
        rating: true,
      },
    })

    if (!instructor) {
      return NextResponse.json(
        { error: '강사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 등급 정보
    const currentGradeInfo = instructor.instructorType === 'INTERNAL'
      ? INTERNAL_GRADES[instructor.grade || 'LEVEL1']
      : EXTERNAL_GRADES[instructor.externalGrade || 'EXTERNAL_BASIC']

    // 자동 계산된 등급 (내부 강사만)
    let recommendedGrade = null
    let canUpgrade = false

    if (instructor.instructorType === 'INTERNAL') {
      recommendedGrade = calculateInstructorGrade(
        instructor.totalClasses,
        instructor.rating ? Number(instructor.rating) : null
      )
      canUpgrade = recommendedGrade !== instructor.grade
    }

    return NextResponse.json({
      ...instructor,
      rating: instructor.rating ? Number(instructor.rating) : null,
      feeMultiplier: Number(instructor.feeMultiplier),
      currentGradeInfo,
      recommendedGrade,
      canUpgrade,
    })
  } catch (error) {
    console.error('Failed to fetch instructor grade:', error)
    return NextResponse.json(
      { error: '등급 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT - 강사 등급 수정 (관리자 전용)
export async function PUT(
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
      instructorType,
      grade,
      externalGrade,
      feeMultiplier,
    } = body

    // 기존 강사 조회
    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id },
    })

    if (!instructor) {
      return NextResponse.json(
        { error: '강사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업데이트할 데이터 구성
    const updateData: Prisma.InstructorUpdateInput = {
      gradeUpdatedAt: new Date(),
    }

    if (instructorType !== undefined) {
      updateData.instructorType = instructorType
    }

    if (instructorType === 'INTERNAL' || instructor.instructorType === 'INTERNAL') {
      if (grade) {
        updateData.grade = grade
        updateData.feeMultiplier = INTERNAL_GRADES[grade]?.feeMultiplier || 1.00
      }
    }

    if (instructorType === 'EXTERNAL' || instructor.instructorType === 'EXTERNAL') {
      if (externalGrade) {
        updateData.externalGrade = externalGrade
        updateData.feeMultiplier = EXTERNAL_GRADES[externalGrade]?.feeMultiplier || 1.00
      }
    }

    // 수동으로 feeMultiplier 지정한 경우 (특수 케이스)
    if (feeMultiplier !== undefined) {
      updateData.feeMultiplier = feeMultiplier
    }

    const updatedInstructor = await prisma.instructor.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        instructorType: true,
        grade: true,
        externalGrade: true,
        feeMultiplier: true,
        gradeUpdatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      instructor: {
        ...updatedInstructor,
        feeMultiplier: Number(updatedInstructor.feeMultiplier),
      },
    })
  } catch (error) {
    console.error('Failed to update instructor grade:', error)
    return NextResponse.json(
      { error: '등급 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST - 등급 자동 업그레이드 (조건 충족 시)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id },
    })

    if (!instructor) {
      return NextResponse.json(
        { error: '강사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (instructor.instructorType !== 'INTERNAL') {
      return NextResponse.json(
        { error: '외부 강사는 자동 등급 업그레이드가 적용되지 않습니다.' },
        { status: 400 }
      )
    }

    // 자동 등급 계산
    const newGrade = calculateInstructorGrade(
      instructor.totalClasses,
      instructor.rating ? Number(instructor.rating) : null
    )

    if (newGrade === instructor.grade) {
      return NextResponse.json({
        success: false,
        message: '현재 등급이 이미 적합합니다.',
        currentGrade: instructor.grade,
      })
    }

    // 등급 업그레이드
    const gradeInfo = INTERNAL_GRADES[newGrade]
    const updatedInstructor = await prisma.instructor.update({
      where: { id: params.id },
      data: {
        grade: newGrade as any,
        feeMultiplier: gradeInfo.feeMultiplier,
        gradeUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `등급이 ${gradeInfo.nameKr}(으)로 업그레이드되었습니다.`,
      previousGrade: instructor.grade,
      newGrade: updatedInstructor.grade,
      feeMultiplier: Number(updatedInstructor.feeMultiplier),
    })
  } catch (error) {
    console.error('Failed to auto-upgrade instructor grade:', error)
    return NextResponse.json(
      { error: '등급 자동 업그레이드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
