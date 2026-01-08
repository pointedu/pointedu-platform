// 강사 등급 관련 유틸리티

// 등급 정보 타입
export interface GradeInfo {
  grade: string
  name: string
  nameKr: string
  minClasses: number
  minRating: number
  feeMultiplier: number
  benefits: string[]
  color: string
  bgColor: string
}

// 내부 강사 등급 정보
export const INTERNAL_GRADES: Record<string, GradeInfo> = {
  LEVEL1: {
    grade: 'LEVEL1',
    name: 'Level 1',
    nameKr: '신입강사',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.00,
    benefits: ['기본 강사비'],
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  LEVEL2: {
    grade: 'LEVEL2',
    name: 'Level 2',
    nameKr: '일반강사',
    minClasses: 10,
    minRating: 4.0,
    feeMultiplier: 1.05,
    benefits: ['강사비 +5%'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  LEVEL3: {
    grade: 'LEVEL3',
    name: 'Level 3',
    nameKr: '우수강사',
    minClasses: 50,
    minRating: 4.5,
    feeMultiplier: 1.10,
    benefits: ['강사비 +10%', '우선 배정'],
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  LEVEL4: {
    grade: 'LEVEL4',
    name: 'Level 4',
    nameKr: '수석강사',
    minClasses: 100,
    minRating: 4.8,
    feeMultiplier: 1.15,
    benefits: ['강사비 +15%', '최우선 배정', '신규 강사 멘토링'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
}

// 외부 강사 등급 정보
export const EXTERNAL_GRADES: Record<string, GradeInfo> = {
  EXTERNAL_BASIC: {
    grade: 'EXTERNAL_BASIC',
    name: 'External Basic',
    nameKr: '외부 기본',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.00,
    benefits: ['기본 외부 강사비'],
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  EXTERNAL_PREMIUM: {
    grade: 'EXTERNAL_PREMIUM',
    name: 'External Premium',
    nameKr: '외부 프리미엄',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.20,
    benefits: ['강사비 +20%', '전문가 대우'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  EXTERNAL_VIP: {
    grade: 'EXTERNAL_VIP',
    name: 'External VIP',
    nameKr: '외부 VIP',
    minClasses: 0,
    minRating: 0,
    feeMultiplier: 1.50,
    benefits: ['강사비 +50%', '특별 계약', 'VIP 대우'],
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
}

// 등급 아이콘
export const GRADE_ICONS: Record<string, string> = {
  LEVEL1: '🥉',
  LEVEL2: '🥈',
  LEVEL3: '🥇',
  LEVEL4: '💎',
  EXTERNAL_BASIC: '🌐',
  EXTERNAL_PREMIUM: '⭐',
  EXTERNAL_VIP: '👑',
}

// 강사 등급 계산 (자동 승급 체크)
export function calculateInstructorGrade(
  totalClasses: number,
  rating: number | null
): string {
  const ratingValue = rating ?? 0

  // 역순으로 체크 (높은 등급부터)
  if (totalClasses >= 100 && ratingValue >= 4.8) {
    return 'LEVEL4'
  }
  if (totalClasses >= 50 && ratingValue >= 4.5) {
    return 'LEVEL3'
  }
  if (totalClasses >= 10 && ratingValue >= 4.0) {
    return 'LEVEL2'
  }
  return 'LEVEL1'
}

// 다음 등급 정보 조회
export function getNextGradeInfo(currentGrade: string): {
  nextGrade: GradeInfo | null
  classesNeeded: number
  ratingNeeded: number
} | null {
  const gradeOrder = ['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4']
  const currentIndex = gradeOrder.indexOf(currentGrade)

  if (currentIndex === -1 || currentIndex >= gradeOrder.length - 1) {
    return null // 외부 강사이거나 최고 등급
  }

  const nextGradeKey = gradeOrder[currentIndex + 1]
  const nextGrade = INTERNAL_GRADES[nextGradeKey]
  const currentInfo = INTERNAL_GRADES[currentGrade]

  return {
    nextGrade,
    classesNeeded: nextGrade.minClasses - currentInfo.minClasses,
    ratingNeeded: nextGrade.minRating,
  }
}

// 강사비 계산 (등급 반영)
export function calculateInstructorFee(
  baseFee: number,
  instructorType: 'INTERNAL' | 'EXTERNAL',
  grade: string | null,
  externalGrade: string | null
): number {
  let multiplier = 1.00

  if (instructorType === 'INTERNAL' && grade) {
    multiplier = INTERNAL_GRADES[grade]?.feeMultiplier || 1.00
  } else if (instructorType === 'EXTERNAL' && externalGrade) {
    multiplier = EXTERNAL_GRADES[externalGrade]?.feeMultiplier || 1.00
  }

  return Math.round(baseFee * multiplier)
}

// 등급 배지 컴포넌트용 데이터
export function getGradeBadgeData(
  instructorType: 'INTERNAL' | 'EXTERNAL',
  grade: string | null,
  externalGrade: string | null
): {
  label: string
  icon: string
  color: string
  bgColor: string
} {
  if (instructorType === 'INTERNAL' && grade) {
    const info = INTERNAL_GRADES[grade]
    return {
      label: info?.nameKr || '미정',
      icon: GRADE_ICONS[grade] || '',
      color: info?.color || 'text-gray-600',
      bgColor: info?.bgColor || 'bg-gray-100',
    }
  }

  if (instructorType === 'EXTERNAL' && externalGrade) {
    const info = EXTERNAL_GRADES[externalGrade]
    return {
      label: info?.nameKr || '외부 강사',
      icon: GRADE_ICONS[externalGrade] || '🌐',
      color: info?.color || 'text-teal-600',
      bgColor: info?.bgColor || 'bg-teal-100',
    }
  }

  return {
    label: '미정',
    icon: '',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  }
}
