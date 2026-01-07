export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import InstructorList from './InstructorList'
import { serializeDecimalArray } from '../../lib/utils'

async function getInstructors() {
  try {
    const data = await prisma.instructor.findMany({
      include: {
        user: true,
        _count: {
          select: {
            assignments: true,
            payments: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    // Serialize Decimal values for client component
    return serializeDecimalArray(data)
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return []
  }
}

interface Instructor {
  id: string
  name: string
  homeBase: string
  phoneNumber: string
  email?: string | null
  subjects: string[]
  rangeKm: string
  availableDays: string[]
  status: string
  rating: number | null
  totalClasses: number
  bankName?: string | null
  accountNumber?: string | null
  accountHolder?: string | null
  bankAccount?: string | null
  residentNumber?: string | null
  emergencyContact?: string | null
  experience?: number | null
  certifications?: string[]
  notes?: string | null
  createdAt?: string
  _count: {
    assignments: number
    payments: number
  }
}

export default async function InstructorsPage() {
  const rawInstructors = await getInstructors()
  const instructors = rawInstructors as unknown as Instructor[]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">강사 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            등록된 강사 {instructors.length}명의 정보를 확인하고 관리합니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          + 강사 등록
        </button>
      </div>

      <InstructorList initialInstructors={instructors} />
    </div>
  )
}
