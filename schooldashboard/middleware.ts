import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple pass-through middleware since we use localStorage-based auth
export default function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
