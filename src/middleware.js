import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';

  // 1. Force block the exact Vercel project domain
  if (host === 'osk-client.vercel.app') {
    return new NextResponse('Access Denied', { 
      status: 403, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  }

  return NextResponse.next();
}

// Target all application paths
export const config = {
  matcher: '/:path*',
};
