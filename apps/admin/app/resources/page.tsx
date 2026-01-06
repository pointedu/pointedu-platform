export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import ResourceList from './ResourceList'

async function getResources() {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        accessList: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return resources
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return []
  }
}

async function getInstructors() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    return instructors
  } catch (error) {
    console.error('Failed to fetch instructors:', error)
    return []
  }
}

export default async function ResourcesPage() {
  const resources = await getResources()
  const instructors = await getInstructors()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">자료실 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            교육 자료를 업로드하고 강사별 접근 권한을 관리합니다.
          </p>
        </div>
      </div>

      <ResourceList
        initialResources={resources as any}
        instructors={instructors}
      />
    </div>
  )
}
