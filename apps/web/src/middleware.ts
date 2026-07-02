import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/terms", "/privacy", "/forgot-password", "/reset-password", "/tools"];
const PUBLIC_PREFIXES = ["/api", "/_next", "/favicon", "/tools"];

// Auth-only setup routes (require session but no role yet)
const SETUP_PREFIXES = ["/role-select", "/onboarding"];

// Pages where an authenticated user should be redirected away to their dashboard
// UNLESS they just explicitly logged out (voldebug_logged_out cookie present)
const AUTH_GUEST_PATHS = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isPublic) {
    // ── Private route: require session ────────────────────────────────
    const isSetupRoute = SETUP_PREFIXES.some((p) => pathname.startsWith(p));

    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = req.auth.user?.role;
    const onboardingStatus = (req.auth.user as any)?.onboardingStatus;

    // Authenticated user on setup routes
    if (isSetupRoute) {
      if (role && onboardingStatus === "COMPLETED") {
        const dest = role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
        return NextResponse.redirect(new URL(dest, req.nextUrl));
      }
      if (onboardingStatus && onboardingStatus !== "NOT_STARTED" && pathname === "/role-select") {
        const dest = role === "TEACHER" ? "/onboarding/teacher" : "/onboarding/student";
        return NextResponse.redirect(new URL(dest, req.nextUrl));
      }
      if ((!onboardingStatus || onboardingStatus === "NOT_STARTED") && pathname.startsWith("/onboarding")) {
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
  }

  // ── Public route ─────────────────────────────────────────────────────
  // If the user is already authenticated and visiting /login or /register,
  // send them straight to their dashboard — UNLESS they just explicitly
  // logged out (indicated by the short-lived voldebug_logged_out cookie).
  const justLoggedOut = req.cookies.get("voldebug_logged_out")?.value === "1";

  if (req.auth && AUTH_GUEST_PATHS.includes(pathname) && !justLoggedOut) {
    const role = req.auth.user?.role;
    const onboardingStatus = (req.auth.user as any)?.onboardingStatus;

    if (!onboardingStatus || onboardingStatus === "NOT_STARTED") {
      return NextResponse.redirect(new URL("/role-select", req.nextUrl));
    }
    if (onboardingStatus === "IN_PROGRESS") {
      const dest = role === "TEACHER" ? "/onboarding/teacher" : "/onboarding/student";
      return NextResponse.redirect(new URL(dest, req.nextUrl));
    }
    const dest = role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};