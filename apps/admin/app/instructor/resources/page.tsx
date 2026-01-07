export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import ResourceView from './ResourceView'
import { serializeDecimalArray } from '../../../lib/utils'

async function getResources(userId: string) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
    })

    if (!instructor) {
      return []
    }

    // Get public resources OR resources specifically shared with this instructor
    const resources = await prisma.resource.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            accessList: {
              some: {
                instructorId: instructor.id,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return serializeDecimalArray(resources)
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return []
  }
}

interface Resource {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  downloadCount: number
  authorName: string
  createdAt: string
}

export default async function InstructorResourcesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string

  const rawResources = await getResources(userId)
  const resources = rawResources as unknown as Resource[]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">자료실</h1>
        <p className="mt-1 text-sm text-gray-600">
          교육 자료 및 서식을 다운로드할 수 있습니다.
        </p>
      </div>

      <ResourceView resources={resources} />
    </div>
  )
}
