import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '../components/AuthProvider'
import { ToastProvider } from '../components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Point Education Admin',
  description: '포인트교육 관리자 대시보드 - 강사 관리, 수업 배정, 정산 관리',
  metadataBase: new URL('https://admin.pointedu.co.kr'),
  openGraph: {
    title: 'Point Education Admin',
    description: '포인트교육 관리자 대시보드 - 강사 관리, 수업 배정, 정산 관리',
    url: 'https://admin.pointedu.co.kr',
    siteName: '포인트교육 관리자',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Point Education Admin',
    description: '포인트교육 관리자 대시보드 - 강사 관리, 수업 배정, 정산 관리',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
