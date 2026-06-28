"use client";

import { type ReactNode } from "react";
import { Navigation } from "@web/components/dashboard/navigation";
import { NotificationBell } from "@web/components/dashboard/notification-bell";
import { ThemeToggle } from "@web/components/dashboard/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isTeacher = session?.user?.role === "TEACHER";
  const brandHref = isTeacher ? "/dashboard/teacher" : "/dashboard/student";
  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("voldebug_token");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ redirect: false });
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      window.location.href = "/login?logout=true";
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 p-4">
        <div className="px-2 py-4 mb-6">
          <a href={brandHref} className="font-display text-lg font-bold tracking-tight">
            <span className="text-gradient">VOLDEBUG</span>
            <span className="text-foreground-muted text-xs ml-1.5 font-sans font-normal">
              AI PORTAL
            </span>
          </a>
        </div>

        <Navigation variant="sidebar" />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar: theme toggle + notification bell + logout + user */}
        <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-sm border-b border-white/5 h-14 flex items-center justify-end px-4 md:px-6 lg:px-8 gap-2">
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover border border-white/5 transition-all text-foreground-muted hover:text-foreground"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent-light border border-accent/20">
            {session?.user?.name ? session.user.name[0].toUpperCase() : "V"}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden h-16 bg-card border-t border-white/5 z-40">
        <Navigation variant="mobile" />
      </nav>
    </div>
  );
}