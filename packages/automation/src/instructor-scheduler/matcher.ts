/**
 * 강사 자동 매칭 알고리즘
 * 학교 요청에 최적의 강사를 자동으로 배정
 */

import { prisma, Prisma } from '@pointedu/database'
import { canInstructorTravel } from '../utils/distance'

type Instructor = any
type School = any
type SchoolRequest = any
type Program = any

export interface MatchCriteria {
  requestId: string
  requiredSubject?: string
  desiredDate?: Date
  flexibleDate?: boolean
  maxDistance?: number
}

export interface InstructorMatch {
  instructor: Instructor
  score: number
  reasons: string[]
  distance: number
  available: boolean
}

/**
 * 학교 요청에 적합한 강사 매칭
 */
export async function matchInstructorsForRequest(
  requestId: string
): Promise<InstructorMatch[]> {
  // 요청 정보 조회
  const request = await prisma.schoolRequest.findUnique({
    where: { id: requestId },
    include: {
      school: true,
      program: true,
    },
  })

  if (!request) {
    throw new Error(`Request ${requestId} not found`)
  }

  // 활성 강사 조회
  const instructors = await prisma.instructor.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      user: true,
      schedules: {
        where: {
          date: request.desiredDate || undefined,
        },
      },
    },
  })

  // 각 강사에 대해 매칭 점수 계산
  const matches: InstructorMatch[] = instructors.map((instructor: any) => {
    const score = calculateMatchScore(instructor, request, request.school, request.program)
    const distance = request.school.distanceKm || 0
    const available = checkAvailability(instructor, request)

    return {
      instructor,
      score: score.total,
      reasons: score.reasons,
      distance,
      available,
    }
  })

  // 점수 순으로 정렬
  return matches
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * 매칭 점수 계산
 */
function calculateMatchScore(
  instructor: Instructor,
  request: SchoolRequest,
  school: School,
  program: Program | null
): { total: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 1. 거리 점수 (0-40점)
  const distanceScore = calculateDistanceScore(instructor, school)
  score += distanceScore.score
  if (distanceScore.reason) reasons.push(distanceScore.reason)

  // 2. 전문성 점수 (0-30점)
  const expertiseScore = calculateExpertiseScore(instructor, program, request)
  score += expertiseScore.score
  if (expertiseScore.reason) reasons.push(expertiseScore.reason)

  // 3. 가용성 점수 (0-20점)
  const availabilityScore = calculateAvailabilityScore(instructor, request)
  score += availabilityScore.score
  if (availabilityScore.reason) reasons.push(availabilityScore.reason)

  // 4. 평점 점수 (0-10점)
  const ratingScore = calculateRatingScore(instructor)
  score += ratingScore.score
  if (ratingScore.reason) reasons.push(ratingScore.reason)

  return { total: score, reasons }
}

/**
 * 거리 점수 계산
 */
function calculateDistanceScore(
  instructor: Instructor,
  school: School
): { score: number; reason?: string } {
  const schoolDistance = school.distanceKm || 0

  // 이동 불가능한 거리
  if (!canInstructorTravel(instructor.maxDistanceKm, schoolDistance)) {
    return { score: 0, reason: '이동 거리 초과' }
  }

  // 거주지가 같은 지역
  if (instructor.homeBase === school.region) {
    return { score: 40, reason: `같은 지역 (${school.region})` }
  }

  // 거리에 따른 점수
  if (schoolDistance <= 30) {
    return { score: 35, reason: '근거리 (30km 이내)' }
  } else if (schoolDistance <= 60) {
    return { score: 25, reason: '중거리 (60km 이내)' }
  } else if (schoolDistance <= 90) {
    return { score: 15, reason: '원거리 (90km 이내)' }
  } else {
    return { score: 5, reason: '장거리 (90km 초과)' }
  }
}

/**
 * 전문성 점수 계산
 */
function calculateExpertiseScore(
  instructor: Instructor,
  program: Program | null,
  request: SchoolRequest
): { score: number; reason?: string } {
  if (!program) {
    return { score: 10, reason: '커스텀 프로그램' }
  }

  // 프로그램이 없으면 기본 점수
  if (!program) {
    return { score: 10, reason: '프로그램 정보 없음' }
  }

  // 프로그램명으로 매칭
  const programName = program.name.toLowerCase()

  // 강사의 전문 과목 확인 (null 체크)
  const subjects = instructor.subjects || []
  for (const subject of subjects) {
    const subjectLower = subject.toLowerCase()

    // 완전 일치
    if (programName.includes(subjectLower) || subjectLower.includes(programName)) {
      return { score: 30, reason: `전문 과목 일치 (${subject})` }
    }

    // 카테고리 일치
    if (program.category === 'FOURTHIND' && subject.includes('AI')) {
      return { score: 25, reason: '4차 산업 전문가' }
    }
    if (program.category === 'CULTURE' && (subject.includes('예술') || subject.includes('Art'))) {
      return { score: 25, reason: '문화예술 전문가' }
    }
  }

  // 경력 기반 점수
  if (instructor.experience && instructor.experience >= 5) {
    return { score: 15, reason: `풍부한 경력 (${instructor.experience}년)` }
  }

  return { score: 5, reason: '일반 강사' }
}

/**
 * 가용성 점수 계산
 */
function calculateAvailabilityScore(
  instructor: Instructor,
  request: SchoolRequest
): { score: number; reason?: string } {
  // 희망 날짜가 없으면 기본 점수
  if (!request.desiredDate) {
    return { score: 10, reason: '날짜 미정' }
  }

  const dayOfWeek = getDayOfWeek(request.desiredDate)

  // 가능한 요일 확인
  if (instructor.availableDays.includes(dayOfWeek)) {
    return { score: 20, reason: `가능 요일 (${dayOfWeek})` }
  }

  // 유연한 날짜인 경우
  if (request.flexibleDate) {
    return { score: 10, reason: '날짜 조정 가능' }
  }

  return { score: 0, reason: `불가능 요일 (${dayOfWeek})` }
}

/**
 * 평점 점수 계산
 */
function calculateRatingScore(
  instructor: Instructor
): { score: number; reason?: string } {
  if (!instructor.rating) {
    return { score: 5, reason: '평점 없음' }
  }

  const rating = Number(instructor.rating)

  if (rating >= 4.5) {
    return { score: 10, reason: `우수 평점 (${rating.toFixed(1)}점)` }
  } else if (rating >= 4.0) {
    return { score: 8, reason: `좋은 평점 (${rating.toFixed(1)}점)` }
  } else if (rating >= 3.5) {
    return { score: 5, reason: `보통 평점 (${rating.toFixed(1)}점)` }
  } else {
    return { score: 2, reason: `낮은 평점 (${rating.toFixed(1)}점)` }
  }
}

/**
 * 강사 가용성 확인
 */
function checkAvailability(instructor: Instructor, request: SchoolRequest): boolean {
  if (!request.desiredDate) return true

  const dayOfWeek = getDayOfWeek(request.desiredDate)

  // 가능 요일 확인
  if (!instructor.availableDays.includes(dayOfWeek)) {
    return false
  }

  // 해당 날짜에 이미 배정이 있는지 확인 (schedules에서)
  // Note: include로 가져온 schedules 활용
  return true
}

/**
 * 요일 가져오기
 */
function getDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[date.getDay()]
}

/**
 * 자동 배정 실행
 */
export async function autoAssignInstructor(requestId: string): Promise<{
  success: boolean
  assignmentId?: string
  instructorId?: string
  message: string
}> {
  try {
    // 매칭 실행
    const matches = await matchInstructorsForRequest(requestId)

    if (matches.length === 0) {
      return {
        success: false,
        message: '적합한 강사를 찾을 수 없습니다.',
      }
    }

    // 최상위 매칭 선택
    const bestMatch = matches[0]

    if (!bestMatch.available) {
      return {
        success: false,
        message: `최적 강사(${bestMatch.instructor.name})가 해당 날짜에 불가능합니다.`,
      }
    }

    // 트랜잭션으로 배정 생성 및 요청 상태 업데이트
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 배정 생성
      const assignment = await tx.instructorAssignment.create({
        data: {
          requestId,
          instructorId: bestMatch.instructor.id,
          status: 'PROPOSED',
          notes: `자동 배정 (점수: ${bestMatch.score}점)\n사유: ${bestMatch.reasons.join(', ')}`,
        },
      })

      // 요청 상태 업데이트
      await tx.schoolRequest.update({
        where: { id: requestId },
        data: { status: 'ASSIGNED' },
      })

      return {
        success: true,
        assignmentId: assignment.id,
        instructorId: bestMatch.instructor.id,
        message: `${bestMatch.instructor.name} 강사에게 자동 배정되었습니다. (점수: ${bestMatch.score}점)`,
      }
    })

    return result
  } catch (error) {
    return {
      success: false,
      message: `배정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}
