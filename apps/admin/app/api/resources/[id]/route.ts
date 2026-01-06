import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { unlink } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const resource = await prisma.resource.findUnique({
      where: { id },
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
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Increment download count
    await prisma.resource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Failed to fetch resource:', error)
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { title, description, category, isPublic } = body

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        title,
        description,
        category,
        isPublic,
      },
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Failed to update resource:', error)
    return NextResponse.json(
      { error: '자료 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get resource to find file path
    const resource = await prisma.resource.findUnique({
      where: { id },
    })

    if (resource) {
      // Delete file from filesystem
      try {
        const filePath = path.join(process.cwd(), 'public', resource.filePath)
        await unlink(filePath)
      } catch (e) {
        console.error('Failed to delete file:', e)
        // Continue with database deletion even if file deletion fails
      }

      // Delete resource and access records
      await prisma.resource.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete resource:', error)
    return NextResponse.json(
      { error: '자료 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
