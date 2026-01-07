export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import { withAuth, withAdminAuth, successResponse, errorResponse } from '../../../lib/api-auth'
import { uploadFile, ensureBucket, STORAGE_BUCKETS } from '../../../lib/supabase'

// GET - 공지사항 목록 조회 (인증 필요)
export const GET = withAuth(async () => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return successResponse(notices)
  } catch (error) {
    console.error('Failed to fetch notices:', error)
    return errorResponse('공지사항 목록을 불러오는데 실패했습니다.', 500)
  }
})

// POST - 공지사항 생성 (관리자 전용)
export const POST = withAdminAuth(async (request, { user }) => {
  try {
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

      // 입력 검증
      if (!title || title.trim() === '') {
        return errorResponse('제목은 필수입니다.', 400)
      }
      if (!content || content.trim() === '') {
        return errorResponse('내용은 필수입니다.', 400)
      }

      const file = formData.get('file') as File | null

      if (file && file.size > 0) {
        // Supabase Storage 버킷 확인/생성
        await ensureBucket(STORAGE_BUCKETS.NOTICES, true)

        // Generate unique filename
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

      // 입력 검증
      if (!title || title.trim() === '') {
        return errorResponse('제목은 필수입니다.', 400)
      }
      if (!content || content.trim() === '') {
        return errorResponse('내용은 필수입니다.', 400)
      }
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        isPublished: isPublished ?? true,
        isPinned: isPinned ?? false,
        authorId: user.id,
        authorName: user.name || '관리자',
        ...fileData,
      },
    })

    return successResponse(notice, 201)
  } catch (error) {
    console.error('Failed to create notice:', error)
    return errorResponse('공지사항 등록 중 오류가 발생했습니다.', 500)
  }
})
