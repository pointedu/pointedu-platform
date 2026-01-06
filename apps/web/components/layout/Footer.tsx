import Link from 'next/link'

const footerLinks = {
  services: [
    { name: '진로체험 프로그램', href: '/programs' },
    { name: 'AI/로봇 교육', href: '/programs?category=ai' },
    { name: 'VR/AR 체험', href: '/programs?category=vr' },
    { name: '드론 교육', href: '/programs?category=drone' },
  ],
  company: [
    { name: '회사소개', href: '/about' },
    { name: '갤러리', href: '/gallery' },
    { name: '공지사항', href: '/notice' },
    { name: '문의하기', href: '/contact' },
  ],
  support: [
    { name: '자주 묻는 질문', href: '/faq' },
    { name: '이용약관', href: '/terms' },
    { name: '개인정보처리방침', href: '/privacy' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold">포인트교육</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              맞춤형 진로체험 교육 전문기업<br />
              초중고 학생들의 미래를 함께 설계합니다.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>📍 경북 영주시 영주로 123</p>
              <p>📞 054-123-4567</p>
              <p>✉️ info@pointedu.co.kr</p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">프로그램</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">회사</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">고객지원</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} 포인트교육 주식회사. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              사업자등록번호: 123-45-67890 | 대표: 홍길동
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
