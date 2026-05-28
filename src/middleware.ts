import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'dommus_session';

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValid(token);

  // Rotas protegidas: /dashboard/* e /api/data/*
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/api/data');

  if (isProtected && !valid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se já está logado e tenta abrir /login → redireciona pro dashboard
  if (pathname === '/login' && valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard/vendas';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/data/:path*', '/login'],
};
