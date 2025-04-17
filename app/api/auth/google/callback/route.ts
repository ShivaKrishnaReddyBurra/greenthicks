import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (token) {
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.cookies.set('token', token, { httpOnly: true, secure: true, maxAge: 3600 });
    return response;
  }

  return NextResponse.json({ message: 'Authentication failed' }, { status: 400 });
}