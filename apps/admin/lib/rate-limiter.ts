/**
 * 메모리 기반 Rate Limiter
 * 로그인 무차별 대입 공격 방지
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  blockedUntil?: number
}

// 메모리 저장소 (프로덕션에서는 Redis 권장)
const rateLimitStore = new Map<string, RateLimitEntry>()

// 설정
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,           // 최대 시도 횟수
  windowMs: 15 * 60 * 1000, // 15분 윈도우
  blockDurationMs: 30 * 60 * 1000, // 30분 블록
}

/**
 * IP 주소에서 rate limit 확인
 */
export function checkLoginRateLimit(ip: string): {
  allowed: boolean
  remainingAttempts: number
  resetTime?: number
  blockedUntil?: number
} {
  const now = Date.now()
  const key = `login:${ip}`

  // 기존 엔트리 확인
  let entry = rateLimitStore.get(key)

  // 블록 상태 확인
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: entry.blockedUntil,
    }
  }

  // 윈도우가 만료되었으면 리셋
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + LOGIN_RATE_LIMIT.windowMs,
    }
  }

  // 제한 초과 확인
  if (entry.count >= LOGIN_RATE_LIMIT.maxAttempts) {
    entry.blockedUntil = now + LOGIN_RATE_LIMIT.blockDurationMs
    rateLimitStore.set(key, entry)
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: entry.blockedUntil,
    }
  }

  return {
    allowed: true,
    remainingAttempts: LOGIN_RATE_LIMIT.maxAttempts - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * 로그인 시도 기록
 */
export function recordLoginAttempt(ip: string, success: boolean): void {
  const now = Date.now()
  const key = `login:${ip}`

  if (success) {
    // 성공하면 카운트 리셋
    rateLimitStore.delete(key)
    return
  }

  // 실패 시 카운트 증가
  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + LOGIN_RATE_LIMIT.windowMs,
    }
  } else {
    entry.count++
  }

  rateLimitStore.set(key, entry)
}

/**
 * 주기적으로 만료된 엔트리 정리 (메모리 누수 방지)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }
}

// 1시간마다 정리 실행
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000)
}
