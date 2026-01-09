export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { uploadFile, listFiles, deleteFile, ensureBucket, STORAGE_BUCKETS } from '../../../lib/supabase'

const MAX_BACKUPS = 30

// GET - 백업 목록 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SUPER_ADMIN only' }, { status: 401 })
    }

    // Supabase Storage에서 백업 파일 목록 조회
    const files = await listFiles(STORAGE_BUCKETS.BACKUPS)

    const backups = files
      .filter(f => f.name.startsWith('backup_') && f.name.endsWith('.json'))
      .map(f => ({
        name: f.name,
        size: f.metadata?.size || 0,
        sizeFormatted: formatBytes(Number(f.metadata?.size) || 0),
        createdAt: f.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const totalSize = backups.reduce((sum, b) => sum + Number(b.size), 0)

    return NextResponse.json({
      backups,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      totalCount: backups.length,
      maxBackups: MAX_BACKUPS,
    })
  } catch (error) {
    console.error('Failed to list backups:', error)
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 })
  }
}

// POST - 새 백업 생성
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()

    // backups 버킷 확인/생성 (비공개)
    await ensureBucket(STORAGE_BUCKETS.BACKUPS, false)

    // 모든 테이블 데이터 조회
    const [
      users,
      instructors,
      schools,
      programs,
      schoolRequests,
      instructorAssignments,
      classApplications,
      quotes,
      payments,
      notices,
      resources,
      settings,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.instructor.findMany(),
      prisma.school.findMany(),
      prisma.program.findMany(),
      prisma.schoolRequest.findMany(),
      prisma.instructorAssignment.findMany(),
      prisma.classApplication.findMany(),
      prisma.quote.findMany(),
      prisma.payment.findMany(),
      prisma.notice.findMany(),
      prisma.resource.findMany(),
      prisma.setting.findMany(),
    ])

    const backupData = {
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: session.user?.email,
        version: '1.0',
        tables: {
          users: users.length,
          instructors: instructors.length,
          schools: schools.length,
          programs: programs.length,
          schoolRequests: schoolRequests.length,
          instructorAssignments: instructorAssignments.length,
          classApplications: classApplications.length,
          quotes: quotes.length,
          payments: payments.length,
          notices: notices.length,
          resources: resources.length,
          settings: settings.length,
        },
      },
      data: {
        users,
        instructors,
        schools,
        programs,
        schoolRequests,
        instructorAssignments,
        classApplications,
        quotes,
        payments,
        notices,
        resources,
        settings,
      },
    }

    // 파일명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${timestamp}.json`

    // JSON 파일을 Supabase Storage에 업로드
    const jsonContent = JSON.stringify(backupData, null, 2)
    const buffer = Buffer.from(jsonContent, 'utf-8')

    const uploadResult = await uploadFile(
      STORAGE_BUCKETS.BACKUPS,
      filename,
      buffer,
      'application/json'
    )

    if (!uploadResult) {
      return NextResponse.json({ error: 'Failed to upload backup to storage' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    const size = buffer.length

    // 오래된 백업 정리
    await cleanOldBackups()

    return NextResponse.json({
      success: true,
      filename,
      size,
      sizeFormatted: formatBytes(size),
      duration,
      recordCounts: backupData.metadata.tables,
      message: `백업이 성공적으로 생성되었습니다. (${formatBytes(size)}, ${duration}ms)`,
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}

// DELETE - 백업 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SUPER_ADMIN only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
    }

    // 보안: 파일명 검증
    if (!filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // 경로 순회 공격 방지
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const deleted = await deleteFile(STORAGE_BUCKETS.BACKUPS, filename)

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '백업이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete backup:', error)
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
  }
}

// 오래된 백업 정리
async function cleanOldBackups(): Promise<void> {
  try {
    const files = await listFiles(STORAGE_BUCKETS.BACKUPS)

    const backupFiles = files
      .filter(f => f.name.startsWith('backup_') && f.name.endsWith('.json'))
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })

    if (backupFiles.length > MAX_BACKUPS) {
      const filesToDelete = backupFiles.slice(MAX_BACKUPS)
      for (const file of filesToDelete) {
        await deleteFile(STORAGE_BUCKETS.BACKUPS, file.name)
        console.log(`Deleted old backup: ${file.name}`)
      }
    }
  } catch (error) {
    console.error('Failed to clean old backups:', error)
  }
}

// 바이트 포맷팅
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
