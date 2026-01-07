export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@pointedu/database'

// POST - 다운로드 카운트 증가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // 자료 존재 확인
    const resource = await prisma.resource.findUnique({
      where: { id },
    })

    if (!resource) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 다운로드 카운트 증가
    await prisma.resource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      downloadUrl: resource.filePath,
      fileName: resource.fileName
    })
  } catch (error) {
    console.error('Download count update failed:', error)
    return NextResponse.json(
      { error: '다운로드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// GET - 파일 다운로드 (리다이렉트)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const resource = await prisma.resource.findUnique({
      where: { id },
    })

    if (!resource) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 다운로드 카운트 증가
    await prisma.resource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    })

    // Supabase Storage URL로 리다이렉트
    return NextResponse.redirect(resource.filePath)
  } catch (error) {
    console.error('Download failed:', error)
    return NextResponse.json(
      { error: '다운로드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
