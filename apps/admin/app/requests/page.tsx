export const revalidate = 60 // Revalidate every 60 seconds

import { prisma } from '@pointedu/database'
import RequestList from './RequestList'
import { serializeDecimalArray } from '../../lib/utils'

async function getRequests() {
  try {
    const requests = await prisma.schoolRequest.findMany({
      include: {
        school: true,
        program: true,
        quote: true,
        assignments: {
          include: {
            instructor: true,
          },
        },
      },
      orderBy: {
        requestDate: 'desc',
      },
      take: 50,
    })

    // desiredDate, alternateDate를 preferredDates 배열로 변환
    const requestsWithPreferredDates = requests.map(request => ({
      ...request,
      preferredDates: [
        request.desiredDate?.toISOString(),
        request.alternateDate?.toISOString(),
      ].filter(Boolean) as string[]
    }))

    return serializeDecimalArray(requestsWithPreferredDates)
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return []
  }
}

async function getAvailableInstructors() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        name: 'asc',
      },
    })
    return serializeDecimalArray(instructors)
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return []
  }
}

async function getSchools() {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' },
    })
    return serializeDecimalArray(schools)
  } catch (error) {
    console.error('Failed to fetch schools:', error)
    return []
  }
}

async function getPrograms() {
  try {
    const programs = await prisma.program.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return serializeDecimalArray(programs)
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return []
  }
}

async function getTransportSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['transport_0_20', 'transport_20_40', 'transport_40_60', 'transport_60_80', 'transport_80_plus'],
        },
      },
    })
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => {
      settingsMap[s.key] = s.value
    })
    return {
      transport_0_20: settingsMap['transport_0_20'] || '0',
      transport_20_40: settingsMap['transport_20_40'] || '15000',
      transport_40_60: settingsMap['transport_40_60'] || '25000',
      transport_60_80: settingsMap['transport_60_80'] || '35000',
      transport_80_plus: settingsMap['transport_80_plus'] || '45000',
    }
  } catch (error) {
    console.error('Failed to fetch transport settings:', error)
    return {
      transport_0_20: '0',
      transport_20_40: '15000',
      transport_40_60: '25000',
      transport_60_80: '35000',
      transport_80_plus: '45000',
    }
  }
}

interface Request {
  id: string
  requestNumber: string
  status: string
  sessions: number
  studentCount: number
  schoolBudget?: number | null
  preferredDates?: string[] | null
  isPublic?: boolean
  publicAt?: string | null
  school: {
    id: string
    name: string
    region: string
    distanceKm?: number | null
  }
  program?: {
    name: string
    category: string
  } | null
  customProgram?: string | null
  assignments: Array<{
    id: string
    status: string
    instructor: {
      id: string
      name: string
    }
  }>
}

interface Instructor {
  id: string
  name: string
  homeBase: string
  subjects: string[]
  rangeKm: string
  availableDays: string[]
  status: string
}

interface SchoolOption {
  id: string
  name: string
  region: string
}

interface ProgramOption {
  id: string
  name: string
  category: string
}

export default async function RequestsPage() {
  const [requests, instructors, schools, programs, transportSettings] = await Promise.all([
    getRequests() as Promise<Request[]>,
    getAvailableInstructors() as Promise<Instructor[]>,
    getSchools() as Promise<SchoolOption[]>,
    getPrograms() as Promise<ProgramOption[]>,
    getTransportSettings(),
  ])

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학교 요청 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            학교에서 요청한 프로그램 {requests.length}건을 확인하고 처리합니다.
          </p>
        </div>
      </div>

      <RequestList
        initialRequests={requests}
        availableInstructors={instructors}
        schools={schools}
        programs={programs}
        transportSettings={transportSettings}
      />
    </div>
  )
}
