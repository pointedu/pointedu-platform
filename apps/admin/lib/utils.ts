/**
 * Prisma Decimal을 일반 숫자로 변환
 * Next.js Server Component에서 Client Component로 전달 시 필요
 */
export function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  // Prisma Decimal has toNumber method
  if (typeof value?.toNumber === 'function') return value.toNumber()
  return Number(value)
}

/**
 * 값이 Prisma Decimal인지 확인
 */
function isDecimal(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'toNumber' in value &&
    'toString' in value &&
    typeof (value as any).toNumber === 'function' &&
    typeof (value as any).toString === 'function'
  )
}

/**
 * 객체 내의 모든 Decimal 값을 숫자로, Date를 ISO 문자열로 변환
 * null 값도 적절히 처리하여 Client Component에서 사용 가능하게 함
 */
export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (isDecimal(obj)) {
    return (obj as any).toNumber() as T
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => serializeDecimal(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key]
        result[key] = serializeDecimal(value)
      }
    }
    return result as T
  }

  return obj
}

/**
 * 배열 내의 모든 객체에서 Decimal 값을 숫자로 변환
 */
export function serializeDecimalArray<T>(arr: T[]): T[] {
  return arr.map(item => serializeDecimal(item))
}

/**
 * 날짜를 ISO 문자열로 변환
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * 통화 포맷
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '₩0'
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(value)
}
