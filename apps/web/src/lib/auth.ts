import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";

// ── Type augmentation ────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      onboardingStatus: string;
      hasPassword: boolean;
      token?: string;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: string;
    onboardingStatus: string;
    hasPassword?: boolean;
    token?: string;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  providers: [
    // ── Google OAuth ────────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          // Always show account picker so users can switch accounts
          prompt: "select_account",
        },
      },
    }),

    // ── Email / Password ────────────────────────────────────────────────
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_URL}/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.data) return null;
          // json.data = { id, email, name, role, onboardingStatus, token }
          return json.data;
        } catch {
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    // ── Called after successful OAuth sign-in ──────────────────────────
    // Note: We only return true/false here. The actual backend user fetch
    // happens in the jwt callback where we have reliable access to `account`.
    async signIn() {
      return true;
    },

    // ── Encode extra fields into the JWT ─────────────────────────────────
    async jwt({ token, user, account, trigger, session: updateData }) {
      // ── First sign-in (user object present) ──────────────────────────
      if (user && account) {
        if (account.provider === "credentials") {
          // Credentials: user object has all fields from the authorize() return
          token.id = user.id;
          token.name = user.name;
          token.role = user.role ?? "STUDENT";
          token.onboardingStatus = user.onboardingStatus ?? "NOT_STARTED";
          token.hasPassword = true; // credentials users always have a password
          token.backendToken = (user as any).token;
        } else {
          // OAuth (Google etc.): fetch backend user/token here so nothing gets lost
          // between the signIn and jwt callbacks.
          try {
            console.log("[AUTH JWT] OAuth login for:", user.email);
            const res = await fetch(`${API_URL}/v1/auth/provider`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email ?? "",
                name: user.name ?? "",
                image: user.image ?? "",
              }),
            });
            const json = await res.json();
            if (res.ok && json.data) {
              token.id = json.data.id ?? user.id;
              token.name = user.name;
              token.role = json.data.role ?? "STUDENT";
              token.onboardingStatus = json.data.onboardingStatus ?? "NOT_STARTED";
              token.hasPassword = json.data.hasPassword ?? false;
              token.backendToken = json.data.token; // backend JWT for API calls
              console.log("[AUTH JWT] OAuth success, backendToken present:", !!token.backendToken);
            } else {
              console.error("[AUTH JWT] OAuth API returned error:", json);
            }
          } catch (err) {
            console.error("[AUTH JWT] OAuth fetch failed:", err);
            // Fallback — user gets role-select
            token.id = user.id;
            token.name = user.name;
            token.role = "STUDENT";
            token.onboardingStatus = "NOT_STARTED";
            token.hasPassword = false;
          }
        }
      }

      // ── Session update (update() called from client) ──────────────────
      if (trigger === "update" && updateData) {
        console.log("[AUTH JWT] update trigger, data:", updateData);
        if (updateData.role != null) token.role = updateData.role;
        if (updateData.onboardingStatus != null) token.onboardingStatus = updateData.onboardingStatus;
        if (updateData.hasPassword != null) token.hasPassword = updateData.hasPassword;
      }
      return token;
    },

    // ── Expose fields to the client session ──────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | undefined;
        session.user.role = token.role as string;
        session.user.onboardingStatus = token.onboardingStatus as string;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.token = token.backendToken as string | undefined;
        console.log("[AUTH SESSION] returning session, token present in user:", !!session.user.token);
      }
      return session;
    },
  },

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
});