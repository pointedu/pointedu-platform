/**
 * 숫자를 한글 금액으로 변환하는 유틸리티
 * 예: 13364000 → "일천삼백삼십육만사천원 정"
 */

const KOREAN_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
const KOREAN_UNITS = ['', '십', '백', '천']
const KOREAN_BIG_UNITS = ['', '만', '억', '조', '경']

/**
 * 4자리 숫자를 한글로 변환 (만 단위 내)
 */
function fourDigitsToKorean(num: number): string {
  if (num === 0) return ''

  let result = ''
  const str = num.toString().padStart(4, '0')

  for (let i = 0; i < 4; i++) {
    const digit = parseInt(str[i])
    if (digit > 0) {
      // 일의 자리가 아니면서 1인 경우 '일'을 생략 (일십 → 십, 일백 → 백)
      if (digit === 1 && i < 3) {
        result += KOREAN_UNITS[3 - i]
      } else {
        result += KOREAN_DIGITS[digit] + KOREAN_UNITS[3 - i]
      }
    }
  }

  return result
}

/**
 * 숫자를 한글 금액으로 변환
 * @param num 변환할 숫자
 * @param suffix 접미사 (기본값: "원 정")
 * @returns 한글 금액 문자열
 */
export function numberToKorean(num: number, suffix: string = '원 정'): string {
  if (num === 0) return '영' + suffix
  if (num < 0) return '마이너스 ' + numberToKorean(-num, suffix)

  // 정수만 처리
  num = Math.floor(num)

  const chunks: number[] = []

  // 4자리씩 분리 (만 단위)
  while (num > 0) {
    chunks.push(num % 10000)
    num = Math.floor(num / 10000)
  }

  let result = ''

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i]
    if (chunk > 0) {
      result += fourDigitsToKorean(chunk) + KOREAN_BIG_UNITS[i]
    }
  }

  return result + suffix
}

/**
 * 숫자를 천 단위 콤마 포맷으로 변환
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/**
 * 숫자를 원화 포맷으로 변환
 */
export function formatCurrency(num: number): string {
  return '₩ ' + formatNumber(num) + '원'
}
