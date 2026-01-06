import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Types
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export interface AuthResult {
  success: boolean
  user?: User
  accessToken?: string
  refreshToken?: string
  error?: string
}

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})

export const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phoneNumber: z.string().optional(),
})

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'pointedu-secret-key-2025'
const JWT_EXPIRES_IN = '24h'
const REFRESH_TOKEN_EXPIRES_IN = '7d'
const SALT_ROUNDS = 12

// Auth Service Functions
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

// Utility functions
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function isAuthorized(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

// Role hierarchy
export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  STAFF: 60,
  INSTRUCTOR: 40,
  SCHOOL: 30,
  USER: 10,
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}

console.log('Auth service module loaded')
