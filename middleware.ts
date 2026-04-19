import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const { pathname } = request.nextUrl;

  // Auth pages: always let through. We don't bounce already-logged-in users
  // away because the cookie may be stale (pointing at a deleted session) —
  // checking that properly requires a DB round-trip, which the page
  // components already do. Bouncing on cookie presence risks redirect loops.
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // Protected pages: redirect to login if the cookie is missing.
  // If the cookie is present but invalid, requireSession() in the page
  // component will catch it and redirect cleanly.
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (handled by their own auth)
     * - _next (Next.js internals)
     * - static files (images in /public)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
