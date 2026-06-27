import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/terms", "/privacy", "/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = ["/api", "/_next", "/favicon"];

// Auth-only setup routes (require session but no role yet)
const SETUP_PREFIXES = ["/role-select", "/onboarding"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const isSetupRoute = SETUP_PREFIXES.some((p) => pathname.startsWith(p));

  // If not logged in, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth.user?.role;
  const onboardingStatus = (req.auth.user as any)?.onboardingStatus;

  // Authenticated user on setup routes
  if (isSetupRoute) {
    // If they already have a completed onboarding, send to their dashboard
    if (role && onboardingStatus === "COMPLETED") {
      const dest = role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
      return NextResponse.redirect(new URL(dest, req.nextUrl));
    }
    // If they have a role but onboarding is in progress, only allow /onboarding routes
    if (role && pathname === "/role-select") {
      const dest = role === "TEACHER" ? "/onboarding/teacher" : "/onboarding/student";
      return NextResponse.redirect(new URL(dest, req.nextUrl));
    }
    // If they have no role and try to access /onboarding directly, send to role-select
    if (!role && pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/role-select", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Ensure role-based routing for dashboard
  const isTeacherRoute = pathname.startsWith("/dashboard/teacher");
  const isStudentRoute = pathname.startsWith("/dashboard/student") || pathname.startsWith("/dashboard/classroom");

  if (role === "STUDENT" && isTeacherRoute) {
    return NextResponse.redirect(new URL("/dashboard/student", req.nextUrl));
  }

  if (role === "TEACHER" && isStudentRoute) {
    return NextResponse.redirect(new URL("/dashboard/teacher", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};