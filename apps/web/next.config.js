/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pointedu/ui', '@pointedu/database'],
  images: {
    domains: ['localhost', 'pointedu.co.kr', 'images.unsplash.com'],
  },
}

module.exports = nextConfig
