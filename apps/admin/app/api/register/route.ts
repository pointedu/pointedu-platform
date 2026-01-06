import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      phoneNumber,
      homeBase,
      subjects,
      availableDays,
      rangeKm,
      experience,
      certifications,
      bankAccount,
      residentNumber,
      emergencyContact,
      message,
    } = body

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and instructor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with INSTRUCTOR role
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phoneNumber,
          role: 'INSTRUCTOR',
          active: false, // Not active until approved
        },
      })

      // Create instructor profile with PENDING status
      const instructor = await tx.instructor.create({
        data: {
          userId: user.id,
          name,
          phoneNumber,
          email,
          homeBase,
          subjects,
          availableDays,
          rangeKm,
          maxDistanceKm: rangeKm === '40-60' ? 60 : rangeKm === '70-90' ? 90 : rangeKm === '100-120' ? 120 : 150,
          experience: experience || null,
          certifications: certifications || [],
          bankAccount: bankAccount || null,
          residentNumber: residentNumber || null,
          emergencyContact: emergencyContact || null,
          status: 'PENDING',
          notes: message || null,
        },
      })

      return { user, instructor }
    })

    return NextResponse.json({
      success: true,
      message: '강사 가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
