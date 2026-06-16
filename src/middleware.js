import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host');

  // Check if the user is accessing via the Vercel domain
  if (host && host.includes('.vercel.app')) {
    return new NextResponse('Access Denied', { 
      status: 403, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  }

  return NextResponse.next();
}

// Ensure the middleware runs on all paths, including static assets
export const config = {
  matcher: '/:path*',
};
