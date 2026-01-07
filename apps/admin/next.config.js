/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pointedu/database', '@pointedu/automation'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001', '172.30.1.50:3001', '172.30.1.50'],
    },
  },
}

module.exports = nextConfig
