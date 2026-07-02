"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, Zap, GraduationCap, Trophy, UserCircle,
  History, Shield, BookOpen, BarChart3, Map
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@web/lib/utils";
import { useTranslation } from "@web/context/language-context";

// ─── Nav item definitions ─────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: "Home", key: "nav.home", href: "/dashboard/student", icon: Home },
  { label: "Classroom", key: "nav.classroom", href: "/dashboard/classroom", icon: GraduationCap },
  { label: "Tools", key: "nav.tools", href: "/dashboard/tools", icon: Zap },
  { label: "Scores", key: "nav.scores", href: "/dashboard/scoreboard", icon: Trophy },
  { label: "Profile", key: "nav.profile", href: "/dashboard/profile", icon: UserCircle },
];

const TEACHER_NAV = [
  { label: "Dashboard", key: "nav.dashboard", href: "/dashboard/teacher", icon: Home },
  { label: "Assignments", key: "nav.assignments", href: "/dashboard/teacher/grading", icon: BookOpen },
  { label: "Analytics", key: "nav.analytics", href: "/dashboard/teacher/analytics", icon: BarChart3 },
  { label: "Profile", key: "nav.profile", href: "/dashboard/profile", icon: UserCircle },
];

const ADMIN_NAV = [
  { label: "Dashboard", key: "nav.dashboard", href: "/dashboard/admin", icon: Home },
  { label: "School Center", key: "nav.schoolOverview", href: "/dashboard/principal", icon: Shield },
  { label: "Safety Audits", key: "nav.safetyAudits", href: "/dashboard/principal/audit-logs", icon: BookOpen },
  { label: "Profile", key: "nav.profile", href: "/dashboard/profile", icon: UserCircle },
];

const SIDEBAR_EXTRA_STUDENT = [
  { label: "Tools", key: "nav.tools", href: "/dashboard/tools", icon: Zap },
  { label: "Roadmap", key: "nav.roadmap", href: "/dashboard/student/roadmap", icon: Map },
];

// ─── Component ────────────────────────────────────────────────────────────

export function Navigation({ variant }: { variant: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const role = session?.user?.role;
  const isTeacher = role === "TEACHER";
  const isAdmin = role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : (isTeacher ? TEACHER_NAV : STUDENT_NAV);

  function isActive(href: string) {
    if (href === "/dashboard/student" || href === "/dashboard/teacher") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  if (variant === "sidebar") {
    return (
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item.href)
                ? "bg-accent-surface text-accent-light border border-accent/15 shadow-sm"
                : "text-foreground-muted hover:bg-surface/60 hover:text-foreground"
            )}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{t(item.key)}</span>
          </Link>
        ))}

        {/* Student-only extras in sidebar */}
        {role === "STUDENT" && (
          <>
            <div className="mt-2 mb-1 px-3">
              <p className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-widest">More</p>
            </div>
            {SIDEBAR_EXTRA_STUDENT.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-accent-surface text-accent-light border border-accent/15"
                    : "text-foreground-muted hover:bg-surface/60 hover:text-foreground"
                )}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{t(item.key)}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    );
  }

  // Mobile bottom tab bar — show 5 items max
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="flex items-center justify-around w-full h-full px-2">
      {mobileItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1",
              active ? "text-accent-light" : "text-foreground-muted hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              active ? "bg-accent-surface" : "transparent"
            )}>
              <item.icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-medium truncate max-w-full">{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
