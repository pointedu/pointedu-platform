import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { uploadFile, ensureBucket, STORAGE_BUCKETS } from '../../../lib/supabase'

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return NextResponse.json(notices)
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    let title: string
    let content: string
    let category: string
    let isPublished: boolean
    let isPinned: boolean
    let fileData: {
      fileName: string | null
      fileType: string | null
      fileSize: number | null
      filePath: string | null
    } = {
      fileName: null,
      fileType: null,
      fileSize: null,
      filePath: null,
    }

    if (contentType.includes('multipart/form-data')) {
      // FormData로 파일 포함 요청
      const formData = await request.formData()
      title = formData.get('title') as string
      content = formData.get('content') as string
      category = formData.get('category') as string
      isPublished = formData.get('isPublished') === 'true'
      isPinned = formData.get('isPinned') === 'true'

      const file = formData.get('file') as File | null

      if (file && file.size > 0) {
        // Supabase Storage 버킷 확인/생성
        await ensureBucket(STORAGE_BUCKETS.NOTICES, true)

        // Generate unique filename (Supabase는 한글 파일명을 지원하지 않음)
        const timestamp = Date.now()
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const randomStr = Math.random().toString(36).substring(2, 8)
        const uniqueFileName = `file_${timestamp}_${randomStr}.${ext}`

        // Upload to Supabase Storage
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadResult = await uploadFile(
          STORAGE_BUCKETS.NOTICES,
          uniqueFileName,
          buffer,
          file.type
        )

        if (uploadResult) {
          fileData = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            filePath: uploadResult.url,
          }
        }
      }
    } else {
      // JSON 요청 (파일 없음)
      const body = await request.json()
      title = body.title
      content = body.content
      category = body.category
      isPublished = body.isPublished ?? true
      isPinned = body.isPinned ?? false
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        isPublished: isPublished ?? true,
        isPinned: isPinned ?? false,
        authorId: session.user.id,
        authorName: session.user.name || '관리자',
        ...fileData,
      },
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Failed to create notice:', error)
    return NextResponse.json(
      { error: '공지사항 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
