import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  maxBackups: number // 보관할 최대 백업 수
  compressionEnabled: boolean
}

interface BackupResult {
  success: boolean
  filename?: string
  filepath?: string
  size?: number
  duration?: number
  error?: string
}

// 기본 설정
const defaultConfig: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: path.join(process.cwd(), 'backups'),
  maxBackups: 30, // 30개 백업 보관
  compressionEnabled: true,
}

/**
 * PostgreSQL 데이터베이스 백업 생성
 */
export async function createBackup(config: Partial<BackupConfig> = {}): Promise<BackupResult> {
  const finalConfig = { ...defaultConfig, ...config }
  const startTime = Date.now()

  try {
    // 백업 디렉토리 생성
    if (!existsSync(finalConfig.backupDir)) {
      await mkdir(finalConfig.backupDir, { recursive: true })
    }

    // 파일명 생성 (타임스탬프 기반)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseFilename = `backup_${timestamp}`
    const sqlFilename = `${baseFilename}.sql`
    const filepath = path.join(finalConfig.backupDir, sqlFilename)

    // DATABASE_URL 파싱
    const dbUrl = new URL(finalConfig.databaseUrl)
    const host = dbUrl.hostname
    const port = dbUrl.port || '5432'
    const database = dbUrl.pathname.slice(1)
    const username = dbUrl.username
    const password = dbUrl.password

    // pg_dump 명령어 실행
    const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}"`

    await execAsync(pgDumpCmd)

    // 파일 크기 확인
    const stats = await stat(filepath)
    const duration = Date.now() - startTime

    // 오래된 백업 정리
    await cleanOldBackups(finalConfig.backupDir, finalConfig.maxBackups)

    console.log(`Backup created successfully: ${sqlFilename} (${formatBytes(stats.size)}) in ${duration}ms`)

    return {
      success: true,
      filename: sqlFilename,
      filepath,
      size: stats.size,
      duration,
    }
  } catch (error) {
    console.error('Backup failed:', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * JSON 형식으로 데이터 백업 (pg_dump 없이 사용 가능)
 */
export async function createJsonBackup(prisma: any, config: Partial<BackupConfig> = {}): Promise<BackupResult> {
  const finalConfig = { ...defaultConfig, ...config }
  const startTime = Date.now()

  try {
    // 백업 디렉토리 생성
    if (!existsSync(finalConfig.backupDir)) {
      await mkdir(finalConfig.backupDir, { recursive: true })
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
        version: '1.0',
        tables: 12,
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
    const filepath = path.join(finalConfig.backupDir, filename)

    // JSON 파일 저장
    const jsonContent = JSON.stringify(backupData, null, 2)
    await writeFile(filepath, jsonContent, 'utf-8')

    const stats = await stat(filepath)
    const duration = Date.now() - startTime

    // 오래된 백업 정리
    await cleanOldBackups(finalConfig.backupDir, finalConfig.maxBackups)

    console.log(`JSON Backup created: ${filename} (${formatBytes(stats.size)}) in ${duration}ms`)

    return {
      success: true,
      filename,
      filepath,
      size: stats.size,
      duration,
    }
  } catch (error) {
    console.error('JSON Backup failed:', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * 오래된 백업 파일 정리
 */
async function cleanOldBackups(backupDir: string, maxBackups: number): Promise<void> {
  try {
    const files = await readdir(backupDir)
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.json')))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
      }))

    // 파일 정보 가져오기
    const filesWithStats = await Promise.all(
      backupFiles.map(async f => ({
        ...f,
        mtime: (await stat(f.path)).mtime,
      }))
    )

    // 수정 시간 기준 정렬 (최신 순)
    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

    // 오래된 파일 삭제
    if (filesWithStats.length > maxBackups) {
      const filesToDelete = filesWithStats.slice(maxBackups)
      for (const file of filesToDelete) {
        await unlink(file.path)
        console.log(`Deleted old backup: ${file.name}`)
      }
    }
  } catch (error) {
    console.error('Failed to clean old backups:', error)
  }
}

/**
 * 백업 목록 조회
 */
export async function listBackups(backupDir: string = defaultConfig.backupDir): Promise<{
  backups: { name: string; size: number; createdAt: Date }[]
  totalSize: number
}> {
  try {
    if (!existsSync(backupDir)) {
      return { backups: [], totalSize: 0 }
    }

    const files = await readdir(backupDir)
    const backupFiles = files.filter(f => f.startsWith('backup_'))

    const backups = await Promise.all(
      backupFiles.map(async name => {
        const filepath = path.join(backupDir, name)
        const stats = await stat(filepath)
        return {
          name,
          size: stats.size,
          createdAt: stats.mtime,
        }
      })
    )

    // 최신순 정렬
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0)

    return { backups, totalSize }
  } catch (error) {
    console.error('Failed to list backups:', error)
    return { backups: [], totalSize: 0 }
  }
}

/**
 * 바이트 포맷팅
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 자동 백업 스케줄러 (Node.js 환경에서 실행)
 */
export function startAutoBackup(
  prisma: any,
  intervalMinutes: number = 60,
  config: Partial<BackupConfig> = {}
): NodeJS.Timer {
  console.log(`Auto backup started: every ${intervalMinutes} minutes`)

  // 즉시 첫 백업 실행
  createJsonBackup(prisma, config)

  // 주기적 백업 실행
  return setInterval(() => {
    createJsonBackup(prisma, config)
  }, intervalMinutes * 60 * 1000)
}
