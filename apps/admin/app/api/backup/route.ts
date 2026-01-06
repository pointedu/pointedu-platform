import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '@pointedu/database'
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')
const MAX_BACKUPS = 30

// GET - 백업 목록 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SUPER_ADMIN only' }, { status: 401 })
    }

    if (!existsSync(BACKUP_DIR)) {
      return NextResponse.json({ backups: [], totalSize: 0, totalCount: 0 })
    }

    const files = await readdir(BACKUP_DIR)
    const backupFiles = files.filter(f => f.startsWith('backup_'))

    const backups = await Promise.all(
      backupFiles.map(async name => {
        const filepath = path.join(BACKUP_DIR, name)
        const stats = await stat(filepath)
        return {
          name,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.mtime.toISOString(),
        }
      })
    )

    // 최신순 정렬
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0)

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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()

    // 백업 디렉토리 생성
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true })
    }

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
    const filepath = path.join(BACKUP_DIR, filename)

    // JSON 파일 저장
    const jsonContent = JSON.stringify(backupData, null, 2)
    await writeFile(filepath, jsonContent, 'utf-8')

    const stats = await stat(filepath)
    const duration = Date.now() - startTime

    // 오래된 백업 정리
    await cleanOldBackups()

    return NextResponse.json({
      success: true,
      filename,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      duration,
      recordCounts: backupData.metadata.tables,
      message: `백업이 성공적으로 생성되었습니다. (${formatBytes(stats.size)}, ${duration}ms)`,
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

    const filepath = path.join(BACKUP_DIR, filename)

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    await unlink(filepath)

    return NextResponse.json({ success: true, message: '백업이 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete backup:', error)
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
  }
}

// 오래된 백업 정리
async function cleanOldBackups(): Promise<void> {
  try {
    if (!existsSync(BACKUP_DIR)) return

    const files = await readdir(BACKUP_DIR)
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
      }))

    const filesWithStats = await Promise.all(
      backupFiles.map(async f => ({
        ...f,
        mtime: (await stat(f.path)).mtime,
      }))
    )

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

    if (filesWithStats.length > MAX_BACKUPS) {
      const filesToDelete = filesWithStats.slice(MAX_BACKUPS)
      for (const file of filesToDelete) {
        await unlink(file.path)
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
