'use client'

import { useState, useEffect } from 'react'

interface ResponsiveListProps {
  children: React.ReactNode
  mobileView: React.ReactNode
  breakpoint?: number
}

export default function ResponsiveList({
  children,
  mobileView,
  breakpoint = 768
}: ResponsiveListProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  // SSR에서는 데스크톱 뷰를 기본으로 렌더링
  if (!mounted) {
    return <>{children}</>
  }

  return isMobile ? <>{mobileView}</> : <>{children}</>
}
