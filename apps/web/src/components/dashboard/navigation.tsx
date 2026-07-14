import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Home,
  Zap,
  GraduationCap,
  Trophy,
  UserCircle,
  History,
  Shield,
  BookOpen,
  BarChart3,
  Map,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@web/lib/utils";
import { useTranslation } from "@web/context/language-context";

// ─── Nav item definitions ─────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: "Home", key: "nav.home", href: "/dashboard/student", icon: Home },
  {
    label: "Classroom",
    key: "nav.classroom",
    href: "/dashboard/classroom",
    icon: GraduationCap,
  },
  { label: "Tools", key: "nav.tools", href: "/dashboard/tools", icon: Zap },
  {
    label: "Scores",
    key: "nav.scores",
    href: "/dashboard/scoreboard",
    icon: Trophy,
  },
  {
    label: "Roadmap",
    key: "nav.roadmap",
    href: "/dashboard/student/roadmap",
    icon: Map,
  },
  {
    label: "Profile",
    key: "nav.profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
];

const KIDS_STUDENT_NAV = [
  {
    label: "My Kingdom",
    key: "nav.home_kids",
    href: "/dashboard/student",
    icon: "🏰",
  },
  {
    label: "My Quests",
    key: "nav.classroom_kids",
    href: "/dashboard/classroom",
    icon: "🌲",
  },
  {
    label: "Magic Workshop",
    key: "nav.tools_kids",
    href: "/dashboard/tools",
    icon: "🤖",
  },
  {
    label: "Hall of Fame",
    key: "nav.scores_kids",
    href: "/dashboard/scoreboard",
    icon: "🏆",
  },
  {
    label: "Adventure Map",
    key: "nav.roadmap_kids",
    href: "/dashboard/student/roadmap",
    icon: "🗺️",
  },
  {
    label: "Myself",
    key: "nav.profile_kids",
    href: "/dashboard/profile",
    icon: "👤",
  },
];

const TEACHER_NAV = [
  {
    label: "Dashboard",
    key: "nav.dashboard",
    href: "/dashboard/teacher",
    icon: Home,
  },
  {
    label: "Assignments",
    key: "nav.assignments",
    href: "/dashboard/teacher/grading",
    icon: BookOpen,
  },
  {
    label: "Analytics",
    key: "nav.analytics",
    href: "/dashboard/teacher/analytics",
    icon: BarChart3,
  },
  {
    label: "Profile",
    key: "nav.profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
];

const ADMIN_NAV = [
  {
    label: "Dashboard",
    key: "nav.dashboard",
    href: "/dashboard/admin",
    icon: Home,
  },
  {
    label: "School Center",
    key: "nav.schoolOverview",
    href: "/dashboard/principal",
    icon: Shield,
  },
  {
    label: "Safety Audits",
    key: "nav.safetyAudits",
    href: "/dashboard/principal/audit-logs",
    icon: BookOpen,
  },
  {
    label: "Profile",
    key: "nav.profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function Navigation({ variant }: { variant: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [kidsMode, setKidsMode] = useState(false);

  const role = session?.user?.role;
  const isTeacher = role === "TEACHER";
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    const checkKidsMode = () => {
      const saved = localStorage.getItem("kids-mode");
      if (saved !== null) {
        setKidsMode(saved === "true");
      } else {
        setKidsMode(role === "STUDENT");
      }
    };

    checkKidsMode();
    const interval = setInterval(checkKidsMode, 1000);
    return () => clearInterval(interval);
  }, [role]);

  const activeNavItems = isAdmin
    ? ADMIN_NAV
    : isTeacher
      ? TEACHER_NAV
      : kidsMode
        ? KIDS_STUDENT_NAV
        : STUDENT_NAV;

  function isActive(href: string) {
    if (href === "/dashboard/student" || href === "/dashboard/teacher") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  function getLabel(item: {
    label: string;
    key: string;
    href: string;
    icon: any;
  }) {
    const translated = t(item.key);
    if (translated && translated !== item.key) {
      return translated;
    }
    return item.label;
  }

  function renderIcon(icon: any, active = false) {
    if (typeof icon === "string") {
      return (
        <span
          className={cn(
            "text-xl flex-shrink-0 flex items-center justify-center select-none transition-all duration-300",
            active ? "scale-125" : "group-hover:scale-110",
          )}
        >
          {icon}
        </span>
      );
    }
    const IconComp = icon;
    return <IconComp className="w-4.5 h-4.5 flex-shrink-0" />;
  }

  if (variant === "sidebar") {
    return (
      <nav className="flex flex-col gap-1 flex-1">
        {activeNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? kidsMode
                    ? "bg-violet-100/80 text-violet-600 border-2 border-violet-200 shadow-md"
                    : "bg-accent-surface text-accent-light border border-accent/15 shadow-sm"
                  : kidsMode
                    ? "text-foreground-muted hover:bg-amber-50 hover:text-[#7c3aed]"
                    : "text-foreground-muted hover:bg-surface/60 hover:text-foreground",
              )}
            >
              {renderIcon(item.icon, active)}
              <span className={cn(kidsMode ? "font-bold text-base" : "")}>
                {getLabel(item)}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Mobile bottom tab bar — show all items
  const mobileItems = activeNavItems;

  return (
    <nav className="flex items-center justify-around w-full h-full px-2">
      {mobileItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1 group",
              active
                ? kidsMode
                  ? "text-violet-600"
                  : "text-accent-light"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                active
                  ? kidsMode
                    ? "bg-violet-100 scale-110"
                    : "bg-accent-surface"
                  : "transparent",
              )}
            >
              {renderIcon(item.icon, active)}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium truncate max-w-full",
                kidsMode && active ? "font-bold" : "",
              )}
            >
              {getLabel(item)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
