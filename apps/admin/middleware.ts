import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Public paths that don't require authentication
const publicPaths = ['/login', '/register', '/api/auth', '/api/register']

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'))
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const pathname = req.nextUrl.pathname
    const isPublic = isPublicPath(pathname)
    const isLoginPage = pathname === '/login'
    const isRegisterPage = pathname === '/register'

    // Allow public paths
    if (isPublic && !isAuth) {
      return NextResponse.next()
    }

    // Redirect to appropriate dashboard if logged in and trying to access login/register page
    if ((isLoginPage || isRegisterPage) && isAuth) {
      const role = token?.role as string
      if (role === 'INSTRUCTOR') {
        return NextResponse.redirect(new URL('/instructor', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Role-based access control
    if (isAuth && token) {
      const role = token.role as string
      const isInstructorPath = pathname.startsWith('/instructor') || pathname.startsWith('/api/instructor')
      const isAdminPath = !isInstructorPath && !isPublic

      // Instructors can only access /instructor paths
      if (role === 'INSTRUCTOR' && isAdminPath) {
        return NextResponse.redirect(new URL('/instructor', req.url))
      }

      // Admins can access everything
      if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && isInstructorPath) {
        // Admins can also view instructor pages
        return NextResponse.next()
      }
    }

    // Redirect to login if not authenticated and not public path
    if (!isPublic && !isAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        const isPublic = isPublicPath(pathname)

        // Always allow public paths
        if (isPublic) {
          return true
        }

        // Require token for all other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (static files)
     * - favicon.ico, public files
     */
    '/((?!_next|favicon.ico|.*\\..*).*)' ,
  ],
}
