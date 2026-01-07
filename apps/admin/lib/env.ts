// 환경변수 타입 안전성 유틸리티
// Type-safe environment variables

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value || ''
}

function getEnvVarWithDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

// 필수 환경변수
export const env = {
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),

  // Auth
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: getEnvVarWithDefault('NEXTAUTH_URL', 'http://localhost:3001'),

  // App config
  NODE_ENV: getEnvVarWithDefault('NODE_ENV', 'development'),

  // Optional
  DIRECT_URL: getEnvVar('DIRECT_URL', false),
} as const

// 타입 정의
export type Env = typeof env

// 개발 환경 확인
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
