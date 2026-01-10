import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'
import bcrypt from 'bcryptjs'
import { checkLoginRateLimit, recordLoginAttempt } from '../../../../lib/rate-limiter'
import { logger } from '../../../../lib/logger'

/**
 * 로그인 전 rate limit 확인 API
 * 클라이언트에서 실제 로그인 전에 이 API를 먼저 호출하여 차단 여부 확인
 */
export async function POST(request: NextRequest) {
  try {
    // IP 주소 추출
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

    const body = await request.json()
    const { email, password, checkOnly } = body

    // Rate limit 확인
    const rateLimit = checkLoginRateLimit(ip)

    if (!rateLimit.allowed) {
      const blockedMinutes = rateLimit.blockedUntil
        ? Math.ceil((rateLimit.blockedUntil - Date.now()) / (60 * 1000))
        : 30

      return NextResponse.json({
        success: false,
        error: `너무 많은 로그인 시도가 있었습니다. ${blockedMinutes}분 후에 다시 시도해주세요.`,
        blocked: true,
        blockedUntil: rateLimit.blockedUntil,
      }, { status: 429 })
    }

    // checkOnly 모드: rate limit만 확인하고 반환
    if (checkOnly) {
      return NextResponse.json({
        success: true,
        remainingAttempts: rateLimit.remainingAttempts,
      })
    }

    // 실제 로그인 검증
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.',
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      recordLoginAttempt(ip, false)
      return NextResponse.json({
        success: false,
        error: '등록되지 않은 이메일입니다.',
        remainingAttempts: rateLimit.remainingAttempts - 1,
      }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      recordLoginAttempt(ip, false)
      return NextResponse.json({
        success: false,
        error: '비밀번호가 일치하지 않습니다.',
        remainingAttempts: rateLimit.remainingAttempts - 1,
      }, { status: 401 })
    }

    // 계정 활성화 확인
    if (!user.active) {
      recordLoginAttempt(ip, false)
      return NextResponse.json({
        success: false,
        error: '계정이 아직 승인되지 않았습니다. 관리자 승인을 기다려주세요.',
      }, { status: 403 })
    }

    // 권한 확인
    if (!['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      recordLoginAttempt(ip, false)
      return NextResponse.json({
        success: false,
        error: '로그인 권한이 없습니다.',
      }, { status: 403 })
    }

    // 로그인 성공 - rate limit 카운트 리셋
    recordLoginAttempt(ip, true)

    // 성공 응답 (실제 세션은 NextAuth가 처리)
    return NextResponse.json({
      success: true,
      message: '인증 성공',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

  } catch (error) {
    logger.error('Login validation error:', error)
    return NextResponse.json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.',
    }, { status: 500 })
  }
}
