'use client'

import Link from 'next/link'
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

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-2xl font-bold text-white">Point EDU</h1>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-4">
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
            <p className="text-xs">{session?.user?.email || 'admin@pointedu.co.kr'}</p>
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
  )
}
