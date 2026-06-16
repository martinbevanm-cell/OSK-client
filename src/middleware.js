import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host');

  // Check if accessing via the specific Vercel production URL
  if (host && host.endsWith('osklisting.vercel.app')) {
    // Returning a structured JSON response is safer for Vercel's Edge Runtime
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

export const config = {
  // Exclude static Next.js assets to prevent edge build failures
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
