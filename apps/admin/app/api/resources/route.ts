import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { uploadFile, ensureBucket, STORAGE_BUCKETS } from '../../../lib/supabase'

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

    // Supabase Storage 버킷 확인/생성
    await ensureBucket(STORAGE_BUCKETS.RESOURCES, true)

    // Generate unique filename (Supabase는 한글 파일명을 지원하지 않음)
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const randomStr = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `file_${timestamp}_${randomStr}.${ext}`

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await uploadFile(
      STORAGE_BUCKETS.RESOURCES,
      uniqueFileName,
      buffer,
      file.type
    )

    if (!uploadResult) {
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      )
    }

    // Create resource record
    const resource = await prisma.resource.create({
      data: {
        title,
        description: description || null,
        category: category || 'GENERAL',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: uploadResult.url, // Supabase Storage URL 저장
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
