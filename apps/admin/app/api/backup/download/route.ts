export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// GET - 백업 파일 다운로드
export async function GET(request: NextRequest) {
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

    const filepath = path.join(BACKUP_DIR, filename)

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    const fileContent = await readFile(filepath)

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to download backup:', error)
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 })
  }
}
