import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chat"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const hasClerkSession = req.cookies.get("__session")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Allow through if we have either our backend token OR at least a Clerk session
  // This prevents bouncing between /chat and /login while the sync is happening
  if (isProtected && !token && !hasClerkSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    url.pathname = "/chat";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/register"]
};

