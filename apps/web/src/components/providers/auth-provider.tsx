"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";
import { api } from "@web/lib/api";

function SessionSync() {
  const { data: session } = useSession();

  useEffect(() => {
    const token =
      (session as any)?.accessToken || (session as any)?.user?.token;
    api.setToken(token || null);
  }, [session]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
