import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import bcrypt from 'bcryptjs'

// GET - List all instructors
export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        user: true,
        _count: {
          select: {
            assignments: true,
            payments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // 프론트엔드 호환을 위해 bankAccount를 분리해서 응답
    const formattedInstructors = instructors.map((instructor) => {
      const bankParts = (instructor.bankAccount || '').split(' ')
      return {
        ...instructor,
        bankName: bankParts[0] || null,
        accountNumber: bankParts[1] || null,
        accountHolder: bankParts[2] || null,
      }
    })

    return NextResponse.json(formattedInstructors)
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 })
  }
}

// POST - Create new instructor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phoneNumber,
      homeBase,
      subjects,
      rangeKm,
      maxDistanceKm,
      availableDays,
      bankAccount,
      // 프론트엔드 호환 필드
      bankName,
      accountNumber,
      accountHolder,
      defaultSessionFee,
    } = body

    // bankAccount 생성: 프론트엔드에서 분리된 필드로 오면 합침
    let finalBankAccount = bankAccount
    if (!bankAccount && (bankName || accountNumber || accountHolder)) {
      const parts = [bankName, accountNumber, accountHolder].filter(Boolean)
      finalBankAccount = parts.join(' ')
    }

    // Create user first
    const hashedPassword = await bcrypt.hash('instructor2025', 10)
    const user = await prisma.user.create({
      data: {
        email: email || `instructor_${Date.now()}@pointedu.co.kr`,
        password: hashedPassword,
        name,
        role: 'INSTRUCTOR',
        phoneNumber,
        active: true,
      },
    })

    // Create instructor
    const instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        name,
        email,
        phoneNumber,
        homeBase,
        subjects: subjects || [],
        rangeKm: rangeKm || '40-60',
        maxDistanceKm: maxDistanceKm || 60,
        availableDays: availableDays || [],
        bankAccount: finalBankAccount || null,
        defaultSessionFee: defaultSessionFee ? parseFloat(defaultSessionFee) : null,
        status: 'ACTIVE',
      },
      include: { user: true },
    })

    // 프론트엔드 호환을 위해 bankAccount를 분리해서 응답
    const bankParts = (instructor.bankAccount || '').split(' ')
    return NextResponse.json({
      ...instructor,
      bankName: bankParts[0] || '',
      accountNumber: bankParts[1] || '',
      accountHolder: bankParts[2] || '',
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create instructor:', error)
    return NextResponse.json({ error: 'Failed to create instructor' }, { status: 500 })
  }
}
