import { signOut } from "@web/lib/auth";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();

  for (const c of allCookies) {
    if (
      c.name.includes("auth") ||
      c.name.includes("session") ||
      c.name.includes("csrf") ||
      c.name.includes("callback")
    ) {
      cookieStore.delete(c.name);
    }
  }

  try {
    await signOut({ redirect: false });
  } catch {
    // Ignore any internal signout errors
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();

  for (const c of allCookies) {
    if (
      c.name.includes("auth") ||
      c.name.includes("session") ||
      c.name.includes("csrf") ||
      c.name.includes("callback")
    ) {
      cookieStore.delete(c.name);
    }
  }

  try {
    await signOut({ redirect: false });
  } catch {
    // Ignore
  }

  const loginUrl = new URL("/login?logout=true", req.url);
  return NextResponse.redirect(loginUrl);
}
