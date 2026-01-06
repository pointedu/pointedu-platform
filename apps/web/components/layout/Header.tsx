'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: '홈', href: '/' },
  { name: '회사소개', href: '/about' },
  { name: '프로그램', href: '/programs' },
  { name: '갤러리', href: '/gallery' },
  { name: '공지사항', href: '/notice' },
  { name: '문의하기', href: '/contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed w-full z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-minimal'
        : 'bg-transparent'
    }`}>
      <nav className="container-custom">
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
              scrolled ? 'text-gray-900' : 'text-white'
            }`}>
              포인트교육
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-12">
            <div className="flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative text-sm font-medium transition-all duration-300 ${
                    pathname === item.href
                      ? scrolled ? 'text-blue-600' : 'text-white'
                      : scrolled
                        ? 'text-gray-600 hover:text-gray-900'
                        : 'text-white/80 hover:text-white'
                  } hover-line`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <Link
              href="/contact"
              className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                scrolled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              상담신청
            </Link>
          </div>

          <button
            type="button"
            className={`lg:hidden p-2 transition-colors duration-300 ${
              scrolled ? 'text-gray-900' : 'text-white'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">메뉴</span>
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-lg font-bold">포인트교육</span>
            </Link>
            <button type="button" className="p-2" onClick={() => setMobileMenuOpen(false)}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-6">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t">
              <Link
                href="/contact"
                className="block w-full px-4 py-3 text-center text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                상담신청
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
