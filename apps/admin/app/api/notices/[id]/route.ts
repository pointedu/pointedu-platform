export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '@pointedu/database'
import { uploadFile, deleteFile, ensureBucket, STORAGE_BUCKETS } from '../../../../lib/supabase'
import { withAuth, successResponse, errorResponse } from '../../../../lib/api-auth'

// filePath에서 파일명 추출
function getFileNameFromPath(filePath: string | null): string | null {
  if (!filePath) return null
  const parts = filePath.split('/')
  return parts[parts.length - 1].split('?')[0] // URL 파라미터 제거
}

// GET - 공지사항 상세 조회 (인증 필요)
export const GET = withAuth(async (request, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('ID가 필요합니다.', 400)

    const notice = await prisma.notice.findUnique({
      where: { id },
    })

    if (!notice) {
      return errorResponse('공지사항을 찾을 수 없습니다.', 404)
    }

    // Increment view count
    await prisma.notice.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return successResponse(notice)
  } catch (error) {
    console.error('Failed to fetch notice:', error)
    return errorResponse('공지사항을 불러오는데 실패했습니다.', 500)
  }
})

// PUT - 공지사항 수정 (관리자 전용 - FormData 처리로 수동 인증 유지)
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
    const contentType = request.headers.get('content-type') || ''

    // 기존 공지사항 조회
    const existingNotice = await prisma.notice.findUnique({
      where: { id },
    })

    if (!existingNotice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    let title: string
    let content: string
    let category: string
    let isPublished: boolean
    let isPinned: boolean
    let removeFile: boolean = false
    let fileData: {
      fileName?: string | null
      fileType?: string | null
      fileSize?: number | null
      filePath?: string | null
    } = {}

    if (contentType.includes('multipart/form-data')) {
      // FormData로 파일 포함 요청
      const formData = await request.formData()
      title = formData.get('title') as string
      content = formData.get('content') as string
      category = formData.get('category') as string
      isPublished = formData.get('isPublished') === 'true'
      isPinned = formData.get('isPinned') === 'true'
      removeFile = formData.get('removeFile') === 'true'

      const file = formData.get('file') as File | null

      if (removeFile) {
        // 기존 파일 삭제 요청
        if (existingNotice.filePath) {
          const existingFileName = getFileNameFromPath(existingNotice.filePath)
          if (existingFileName) {
            await deleteFile(STORAGE_BUCKETS.NOTICES, existingFileName)
          }
        }
        fileData = {
          fileName: null,
          fileType: null,
          fileSize: null,
          filePath: null,
        }
      } else if (file && file.size > 0) {
        // 새 파일 업로드
        // 기존 파일 삭제
        if (existingNotice.filePath) {
          const existingFileName = getFileNameFromPath(existingNotice.filePath)
          if (existingFileName) {
            await deleteFile(STORAGE_BUCKETS.NOTICES, existingFileName)
          }
        }

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
      isPublished = body.isPublished
      isPinned = body.isPinned
    }

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        category,
        isPublished,
        isPinned,
        ...fileData,
      },
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Failed to update notice:', error)
    return NextResponse.json(
      { error: '공지사항 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE - 공지사항 삭제 (관리자 전용 - 수동 인증 유지)
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

    // 기존 공지사항 조회 (파일 삭제를 위해)
    const existingNotice = await prisma.notice.findUnique({
      where: { id },
    })

    if (existingNotice?.filePath) {
      // 첨부파일 삭제
      const existingFileName = getFileNameFromPath(existingNotice.filePath)
      if (existingFileName) {
        await deleteFile(STORAGE_BUCKETS.NOTICES, existingFileName)
      }
    }

    await prisma.notice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notice:', error)
    return NextResponse.json(
      { error: '공지사항 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
