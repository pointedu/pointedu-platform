// Supabase Storage REST API 클라이언트
// SDK 대신 직접 REST API를 사용하여 의존성 최소화

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 타입 정의
interface SupabaseFile {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
}

interface SupabaseBucket {
  id: string
  name: string
  public: boolean
  created_at?: string
  updated_at?: string
}

// Storage 버킷 이름
export const STORAGE_BUCKETS = {
  RESOURCES: 'resources',
  LOGOS: 'logos',
  NOTICES: 'notices',
} as const

/**
 * 파일 업로드 to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<{ url: string; path: string } | null> {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: file as unknown as BodyInit,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Upload error:', error)
      return null
    }

    // Public URL 생성
    const publicUrl = getPublicUrl(bucket, filePath)

    return {
      url: publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return null
  }
}

/**
 * 파일 삭제 from Supabase Storage
 */
export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete failed:', error)
    return false
  }
}

/**
 * 파일 목록 조회
 */
export async function listFiles(bucket: string, folder?: string): Promise<SupabaseFile[]> {
  try {
    const prefix = folder ? `${folder}/` : ''
    const url = `${SUPABASE_URL}/storage/v1/object/list/${bucket}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prefix,
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('List error:', error)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('List failed:', error)
    return []
  }
}

/**
 * Public URL 가져오기
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
}

/**
 * Storage 버킷 생성 (없으면 생성)
 */
export async function ensureBucket(bucket: string, isPublic: boolean = true): Promise<boolean> {
  try {
    // 먼저 버킷이 있는지 확인
    const listUrl = `${SUPABASE_URL}/storage/v1/bucket`
    const listResponse = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    if (listResponse.ok) {
      const buckets: SupabaseBucket[] = await listResponse.json()
      if (buckets.some((b) => b.name === bucket)) {
        return true // 이미 존재
      }
    }

    // 버킷 생성
    const createUrl = `${SUPABASE_URL}/storage/v1/bucket`
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: bucket,
        public: isPublic,
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      console.error('Create bucket error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ensure bucket failed:', error)
    return false
  }
}
