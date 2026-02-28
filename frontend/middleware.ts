import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chat"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const hasClerkSession = req.cookies.get("__session")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // 1. If trying to access /chat and NOT signed in at all, go to /login
  if (isProtected && !token && !hasClerkSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. If already signed in (either Clerk or Backend) and trying to access /login, go to /chat
  if (isAuthPage && (token || hasClerkSession)) {
    const url = req.nextUrl.clone();
    url.pathname = "/chat";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/register"]
};

