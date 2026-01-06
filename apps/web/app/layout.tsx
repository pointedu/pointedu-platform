import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '포인트교육 | 맞춤형 진로체험 교육 전문기업',
  description: '포인트교육은 초중고 학생들을 위한 맞춤형 진로체험 교육 전문기업입니다. AI, VR, 로봇, 드론 등 최신 기술을 활용한 체험형 교육 프로그램을 제공합니다.',
  keywords: '진로체험, 진로교육, AI교육, VR체험, 로봇교육, 드론교육, 포인트교육',
  openGraph: {
    title: '포인트교육 | 맞춤형 진로체험 교육 전문기업',
    description: '초중고 학생들을 위한 맞춤형 진로체험 교육',
    url: 'https://www.pointedu.co.kr',
    siteName: '포인트교육',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
