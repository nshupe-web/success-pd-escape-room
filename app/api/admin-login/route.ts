import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'success_admin_auth';

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || configuredPassword;

  if (!configuredPassword || !sessionSecret) {
    return NextResponse.json(
      { error: 'Admin password is not configured. Add ADMIN_PASSWORD in Vercel environment variables.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';

  if (password !== configuredPassword) {
    return NextResponse.json({ error: 'Incorrect admin password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, sessionSecret, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  return response;
}
