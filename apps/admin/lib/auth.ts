import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@pointedu/database'
import bcrypt from 'bcryptjs'
import { logger } from './logger'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            throw new Error('등록되지 않은 이메일입니다.')
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            throw new Error('비밀번호가 일치하지 않습니다.')
          }

          // Check if user account is active
          if (!user.active) {
            throw new Error('계정이 아직 승인되지 않았습니다. 관리자 승인을 기다려주세요.')
          }

          // Allow ADMIN, SUPER_ADMIN, and INSTRUCTOR roles
          if (!['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(user.role)) {
            throw new Error('로그인 권한이 없습니다.')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          logger.error('Login error:', error)
          if (error instanceof Error) {
            throw error
          }
          throw new Error('로그인 중 오류가 발생했습니다.')
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string
        (session.user as { id?: string; role?: string }).role = token.role as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Validate NEXTAUTH_SECRET at module load time
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️ NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다. 보안을 위해 반드시 설정해주세요.')
}
