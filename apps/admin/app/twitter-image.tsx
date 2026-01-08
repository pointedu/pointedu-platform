import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '포인트교육 관리자 대시보드'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            style={{ marginRight: 20 }}
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 64, fontWeight: 'bold' }}>Point Education</span>
        </div>
        <div style={{ fontSize: 36, opacity: 0.9 }}>관리자 대시보드</div>
        <div
          style={{
            fontSize: 24,
            opacity: 0.7,
            marginTop: 20,
          }}
        >
          강사 관리 · 수업 배정 · 정산 관리
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
