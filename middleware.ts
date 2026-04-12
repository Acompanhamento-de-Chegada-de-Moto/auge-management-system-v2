import { type NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for login pages and public assets
  if (
    pathname.includes("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for the session cookie directly to avoid importing Prisma in the Edge Runtime
  const sessionToken = request.cookies.get("better-auth.session_token") || 
                       request.cookies.get("__secure-better-auth.session_token");

  if (!sessionToken) {
    if (pathname.startsWith("/bdc")) {
      return NextResponse.redirect(new URL("/bdc/login", request.url));
    }
    if (pathname.startsWith("/logistics")) {
      return NextResponse.redirect(new URL("/logistics/login", request.url));
    }
  }

  // NOTE: Detailed role validation (BDC vs LOGISTICS) is handled 
  // in the Server Components (requireBdc, requireLogistics) 
  // because it requires database access which isn't available in the Edge Runtime here.

  return NextResponse.next();
}

export const config = {
  matcher: ["/bdc/:path*", "/logistics/:path*"],
};
