/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pointedu/database', '@pointedu/automation'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001'],
    },
  },
}

module.exports = nextConfig
