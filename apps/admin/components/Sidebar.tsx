'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  MegaphoneIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: HomeIcon },
  { name: '학교 요청', href: '/requests', icon: DocumentTextIcon },
  { name: '수업 지원', href: '/applications', icon: ClipboardDocumentListIcon },
  { name: '일정 관리', href: '/schedule', icon: CalendarIcon },
  { name: '강사 관리', href: '/instructors', icon: UserGroupIcon },
  { name: '학교 관리', href: '/schools', icon: BuildingOffice2Icon },
  { name: '프로그램', href: '/programs', icon: AcademicCapIcon },
  { name: '견적 관리', href: '/quotes', icon: DocumentDuplicateIcon },
  { name: '정산 관리', href: '/payments', icon: CurrencyDollarIcon },
  { name: '공지사항', href: '/notices', icon: MegaphoneIcon },
  { name: '자료실', href: '/resources', icon: FolderIcon },
  { name: '설정', href: '/settings', icon: Cog6ToothIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // 로고 정보 로드
    const loadLogo = async () => {
      try {
        const res = await fetch('/api/settings/logo')
        const data = await res.json()
        if (data.exists && data.url) {
          setLogoUrl(data.url)
        }
      } catch (error) {
        console.error('Failed to load logo:', error)
      }
    }

    loadLogo()
  }, [])

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <>
      {/* 모바일 상단 헤더 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain rounded"
              unoptimized
            />
          ) : null}
          <span className="text-lg font-bold text-white">Point EDU</span>
        </Link>
        <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
      </div>

      {/* 모바일 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 모바일 닫기 버튼 */}
        <div className="lg:hidden absolute top-3 right-3">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center px-6">
            {logoUrl ? (
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image
                  src={logoUrl}
                  alt="Company Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain rounded"
                  unoptimized
                />
                <span className="text-xl font-bold text-white">Point EDU</span>
              </Link>
            ) : (
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-white">Point EDU</h1>
              </Link>
            )}
          </div>
          <nav className="flex flex-1 flex-col px-4 py-4 overflow-y-auto">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-400">
              <div>
                <p className="font-semibold text-white">{session?.user?.name || '관리자'}</p>
                <p className="text-xs truncate max-w-[140px]">{session?.user?.email || 'admin@pointedu.co.kr'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                title="로그아웃"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
