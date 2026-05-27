import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'success_admin_auth';

export function middleware(request: NextRequest) {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;

  if (!sessionSecret) {
    return NextResponse.redirect(new URL('/admin-login?error=missing-config', request.url));
  }

  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value;

  if (cookieValue === sessionSecret) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/admin-login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
