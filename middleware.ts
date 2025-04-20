import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/signup"];

  // Check if the path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // Check if the path is an API auth route
  const isApiAuthPath = pathname.startsWith("/api/auth");

  // If it's an API auth endpoint, let it pass through
  if (isApiAuthPath) {
    return NextResponse.next();
  }

  // For other paths, verify authentication
  const isAuthenticated = await verifyAuth(request);

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access login/signup pages
  if (isAuthenticated && isPublicPath) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher for paths that will trigger this middleware
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
