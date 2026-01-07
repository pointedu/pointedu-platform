export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { serializeDecimal } from '../../../lib/utils'
import ScheduleList from './ScheduleList'

// Serialized types for client components (Date -> string)
type SerializedAssignment = {
  id: string
  status: string
  scheduledDate?: string | null
  scheduledTime?: string | null
  completedAt?: string | null
  request: {
    school: {
      name: string
      address?: string
    }
    program?: { name: string } | null
    customProgram?: string | null
    studentCount?: number
    sessions: number
    desiredDate?: string | null
  }
}

type SerializedInstructor = {
  id: string
  name: string
  assignments: SerializedAssignment[]
}

async function getInstructorSchedule(userId: string): Promise<SerializedInstructor | null> {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
      include: {
        assignments: {
          include: {
            request: {
              include: {
                school: true,
                program: true,
              },
            },
          },
          orderBy: {
            scheduledDate: 'desc',
          },
        },
      },
    })

    // serializeDecimal converts Decimal to number and Date to string at runtime
    return instructor ? (serializeDecimal(instructor) as unknown as SerializedInstructor) : null
  } catch (error) {
    console.error('Failed to fetch instructor schedule:', error)
    return null
  }
}

export default async function InstructorSchedulePage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const instructor = await getInstructorSchedule(userId)

  if (!instructor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">강사 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const assignments = instructor.assignments || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 수업 일정</h1>
        <p className="mt-1 text-sm text-gray-600">
          배정된 수업 일정을 확인하고, 제안된 수업에 응답해주세요.
        </p>
      </div>

      <ScheduleList assignments={assignments} />
    </div>
  )
}
