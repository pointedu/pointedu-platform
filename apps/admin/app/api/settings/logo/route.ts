import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { uploadFile, deleteFile, listFiles, getPublicUrl, ensureBucket, STORAGE_BUCKETS } from '../../../../lib/supabase'

const LOGO_FILENAME = 'company-logo'

// GET - 현재 로고 정보 조회
export async function GET() {
  try {
    // Supabase Storage에서 로고 파일 목록 조회
    const files = await listFiles(STORAGE_BUCKETS.LOGOS)

    // company-logo로 시작하는 파일 찾기
    const logoFile = files.find((f: any) => f.name && f.name.startsWith(LOGO_FILENAME))

    if (logoFile) {
      const publicUrl = getPublicUrl(STORAGE_BUCKETS.LOGOS, logoFile.name)
      return NextResponse.json({
        exists: true,
        url: `${publicUrl}?t=${Date.now()}`,
        filename: logoFile.name,
      })
    }

    return NextResponse.json({
      exists: false,
      url: null,
      filename: null,
    })
  } catch (error) {
    console.error('Failed to get logo:', error)
    return NextResponse.json({ error: 'Failed to get logo' }, { status: 500 })
  }
}

// POST - 로고 업로드
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 파일 타입 검증
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPG, SVG, WebP' }, { status: 400 })
    }

    // 파일 크기 검증 (최대 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 })
    }

    // Supabase Storage 버킷 확인/생성
    await ensureBucket(STORAGE_BUCKETS.LOGOS, true)

    // 기존 로고 파일 삭제
    const existingFiles = await listFiles(STORAGE_BUCKETS.LOGOS)
    for (const existingFile of existingFiles) {
      if (existingFile.name && existingFile.name.startsWith(LOGO_FILENAME)) {
        await deleteFile(STORAGE_BUCKETS.LOGOS, existingFile.name)
      }
    }

    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${LOGO_FILENAME}.${fileExt}`

    // Supabase Storage에 업로드
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await uploadFile(
      STORAGE_BUCKETS.LOGOS,
      filename,
      buffer,
      file.type
    )

    if (!uploadResult) {
      return NextResponse.json({ error: '로고 업로드에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: `${uploadResult.url}?t=${Date.now()}`,
      filename,
      message: '로고가 성공적으로 업로드되었습니다.',
    })
  } catch (error) {
    console.error('Failed to upload logo:', error)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}

// DELETE - 로고 삭제
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Supabase Storage에서 로고 파일 목록 조회
    const files = await listFiles(STORAGE_BUCKETS.LOGOS)

    let deleted = false
    for (const file of files) {
      if (file.name && file.name.startsWith(LOGO_FILENAME)) {
        const success = await deleteFile(STORAGE_BUCKETS.LOGOS, file.name)
        if (success) {
          deleted = true
        }
      }
    }

    if (deleted) {
      return NextResponse.json({ success: true, message: '로고가 삭제되었습니다.' })
    } else {
      return NextResponse.json({ success: true, message: '삭제할 로고가 없습니다.' })
    }
  } catch (error) {
    console.error('Failed to delete logo:', error)
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 })
  }
}
