export const revalidate = 60 // Revalidate every 60 seconds

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import AvailableClassList from './AvailableClassList'
import { serializeDecimalArray } from '../../../lib/utils'

async function getAvailableClasses(userId: string) {
  try {
    // Get instructor info
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
      include: {
        applications: {
          select: {
            requestId: true,
            status: true,
          },
        },
      },
    })

    if (!instructor) {
      return { instructor: null, classes: [] }
    }

    // Get available classes (no assignments yet)
    const classes = await prisma.schoolRequest.findMany({
      where: {
        status: {
          in: ['APPROVED', 'SUBMITTED', 'REVIEWING'],
        },
        assignments: {
          none: {},
        },
      },
      include: {
        school: true,
        program: true,
        applications: {
          select: {
            instructorId: true,
            status: true,
          },
        },
      },
      orderBy: {
        desiredDate: 'asc',
      },
    })

    // Serialize Decimal values for client component
    const serializedClasses = serializeDecimalArray(classes)
    return { instructor, classes: serializedClasses }
  } catch (error) {
    console.error('Failed to fetch available classes:', error)
    return { instructor: null, classes: [] }
  }
}

interface ClassItem {
  id: string
  requestNumber: string
  school: {
    id: string
    name: string
    address: string
    region: string
  }
  program: {
    id: string
    name: string
  } | null
  customProgram: string | null
  sessions: number
  studentCount: number
  targetGrade: string
  desiredDate: string | null
  alternateDate: string | null
  requirements: string | null
  applications: {
    instructorId: string
    status: string
  }[]
}

export default async function AvailableClassesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const { instructor, classes } = await getAvailableClasses(userId) as {
    instructor: { id: string; applications: { requestId: string }[] } | null
    classes: ClassItem[]
  }

  if (!instructor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">강사 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">수업 지원</h1>
        <p className="mt-1 text-sm text-gray-600">
          강사 배정이 필요한 수업에 지원할 수 있습니다.
        </p>
      </div>

      <AvailableClassList
        classes={classes}
        instructorId={instructor.id}
        appliedRequestIds={instructor.applications.map((a) => a.requestId)}
      />
    </div>
  )
}
