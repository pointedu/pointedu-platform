// API 인증 미들웨어
// API Authentication Middleware

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from './auth'

export type ApiHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>

export type AuthenticatedApiHandler = (
  request: NextRequest,
  context: {
    params?: Record<string, string>
    user: { id: string; email: string; name: string; role: string }
  }
) => Promise<NextResponse>

// 인증이 필요한 API 핸들러 래퍼
export function withAuth(handler: AuthenticatedApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }

      const user = session.user as { id: string; email: string; name: string; role: string }

      return handler(request, { ...context, user })
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}

// 관리자 전용 API 핸들러 래퍼
export function withAdminAuth(handler: AuthenticatedApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }

      const user = session.user as { id: string; email: string; name: string; role: string }

      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return NextResponse.json(
          { error: '관리자 권한이 필요합니다.' },
          { status: 403 }
        )
      }

      return handler(request, { ...context, user })
    } catch (error) {
      console.error('Admin auth middleware error:', error)
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}

// 응답 헬퍼 함수
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}
