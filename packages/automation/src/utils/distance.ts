/**
 * 거리 계산 및 교통비 산정 유틸리티
 * Point Education 본사 기준
 */

// 포인트교육 본사 위치
export const POINTEDU_HQ = {
  name: '포인트교육 본사',
  address: '경북 영주시 구성로150번길 19',
  latitude: 36.8056,
  longitude: 128.6239,
} as const

/**
 * 교통비 범위 테이블
 * 0-40km: 무료
 * 40-70km: 15,000원
 * 70-100km: 30,000원
 * 100km+: 45,000원
 */
export const TRANSPORT_FEE_RANGES = [
  { minKm: 0, maxKm: 40, fee: 0 },
  { minKm: 40, maxKm: 70, fee: 15000 },
  { minKm: 70, maxKm: 100, fee: 30000 },
  { minKm: 100, maxKm: Infinity, fee: 45000 },
] as const

/**
 * 두 지점 간 직선 거리 계산 (Haversine 공식)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance)
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * 거리에 따른 교통비 계산
 */
export function calculateTransportFee(distanceKm: number): number {
  for (const range of TRANSPORT_FEE_RANGES) {
    if (distanceKm >= range.minKm && distanceKm < range.maxKm) {
      return range.fee
    }
  }
  return TRANSPORT_FEE_RANGES[TRANSPORT_FEE_RANGES.length - 1].fee
}

/**
 * 학교 위치로부터 교통비 계산
 */
export function getTransportFeeForSchool(
  schoolLatitude?: number | null,
  schoolLongitude?: number | null,
  presetDistance?: number | null
): { distance: number; fee: number } {
  // 사전 설정된 거리가 있으면 사용
  if (presetDistance !== null && presetDistance !== undefined) {
    return {
      distance: presetDistance,
      fee: calculateTransportFee(presetDistance),
    }
  }

  // GPS 좌표가 있으면 계산
  if (
    schoolLatitude !== null &&
    schoolLatitude !== undefined &&
    schoolLongitude !== null &&
    schoolLongitude !== undefined
  ) {
    const distance = calculateDistance(
      POINTEDU_HQ.latitude,
      POINTEDU_HQ.longitude,
      schoolLatitude,
      schoolLongitude
    )
    return {
      distance,
      fee: calculateTransportFee(distance),
    }
  }

  // 기본값
  return { distance: 0, fee: 0 }
}

/**
 * 강사 거주지별 이동 거리 구간 파싱
 */
export function parseRangeKm(rangeKm: string): { min: number; max: number } {
  const match = rangeKm.match(/(\d+)-(\d+)/)
  if (match) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10),
    }
  }
  return { min: 0, max: 60 } // 기본값
}

/**
 * 강사가 해당 거리를 이동 가능한지 확인
 */
export function canInstructorTravel(
  instructorMaxDistanceKm: number,
  schoolDistanceKm: number
): boolean {
  return schoolDistanceKm <= instructorMaxDistanceKm
}
