import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
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
    return NextResponse.json(resources)
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const isPublic = formData.get('isPublic') === 'true'

    if (!file) {
      return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resources')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9가-힣]/g, '_')
    const uniqueFileName = `${baseName}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, uniqueFileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create resource record
    const resource = await prisma.resource.create({
      data: {
        title,
        description: description || null,
        category: category || 'GENERAL',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: `/uploads/resources/${uniqueFileName}`,
        isPublic,
        authorId: session.user.id,
        authorName: session.user.name || '관리자',
      },
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Failed to create resource:', error)
    return NextResponse.json(
      { error: '자료 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
