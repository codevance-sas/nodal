import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUser } from './services/auth/auth.service';

const protectedRoutes = ['/dashboard'];

function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(route => path.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const user = await getUser();
  const currentPath = request.nextUrl.pathname;

  if (isProtectedRoute(currentPath) && user.success === false) {
    return NextResponse.redirect(new URL('/log-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
