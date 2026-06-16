import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');

  // Check if the user is accessing via the Vercel domain
  if (host && host.includes('.vercel.app')) {
    url.host = 'osklisting.com'; // Replace with your domain
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}
