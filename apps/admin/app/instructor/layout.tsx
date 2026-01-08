'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  FolderIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: '홈', href: '/instructor', icon: HomeIcon },
  { name: '내 일정', href: '/instructor/schedule', icon: CalendarIcon },
  { name: '수업 지원', href: '/instructor/available', icon: ClipboardDocumentListIcon },
  { name: '정산내역', href: '/instructor/payments', icon: CurrencyDollarIcon },
  { name: '공지사항', href: '/instructor/notices', icon: MegaphoneIcon },
  { name: '자료실', href: '/instructor/resources', icon: FolderIcon },
]

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/instructor" className="flex-shrink-0 flex items-center gap-2">
                <Image
                  src="/images/pointedu-logo-full.png"
                  alt="포인트교육(주)"
                  width={140}
                  height={36}
                  className="h-9 w-auto"
                  priority
                />
                <span className="text-sm text-gray-500 border-l border-gray-300 pl-2">강사 포털</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-1.5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCircleIcon className="h-6 w-6" />
                <span>{session?.user?.name || '강사'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-b bg-white">
        <div className="flex overflow-x-auto px-4 py-2 gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex-shrink-0 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-1" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
