import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host');

  // ONLY block if the visitor is explicitly typing the raw production Vercel address.
  // This safely leaves your custom domain (osklisting.com) completely untouched.
  if (host === 'osklisting.vercel.app') {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Access Denied' }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  return NextResponse.next();
}

// Optimized matcher stops Next.js from processing internal system files
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
