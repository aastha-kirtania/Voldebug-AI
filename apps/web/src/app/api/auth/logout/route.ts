import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const CSRF_COOKIE_NAMES = [
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
];

const CALLBACK_COOKIE_NAMES = [
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

function clearAuthCookies(res: NextResponse) {
  const allNames = [...SESSION_COOKIE_NAMES, ...CSRF_COOKIE_NAMES, ...CALLBACK_COOKIE_NAMES];
  for (const name of allNames) {
    // Expire the cookie by setting max-age=0 across common paths and domains
    res.cookies.set(name, "", { maxAge: 0, path: "/" });
    res.cookies.set(name, "", { maxAge: 0, path: "/", secure: true, httpOnly: true, sameSite: "lax" });
  }
  // Set a short-lived flag so middleware knows the user explicitly logged out
  res.cookies.set("voldebug_logged_out", "1", { maxAge: 10, path: "/" });
  return res;
}

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  return clearAuthCookies(res);
}

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  const res = NextResponse.redirect(loginUrl);
  return clearAuthCookies(res);
}
