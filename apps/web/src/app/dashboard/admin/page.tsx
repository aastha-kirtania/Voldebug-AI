"use client";

import { motion } from "framer-motion";
import { GradientMesh } from "@web/components/ui/background";
import { useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import {
  Shield,
  Users,
  GraduationCap,
  School,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface SchoolInfo {
  id: string;
  name: string;
  _count: { members: number; classes: number };
}

interface SchoolOverview {
  school: { id: string; name: string };
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  totalSubmissions: number;
  recentSubmissions: number;
  averageScore: number | null;
  gradedCount: number;
  auditLogs: {
    total: number;
    flagged: number;
  };
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ["admin-school"],
    queryFn: () => api.get<SchoolInfo>("/v1/admin/school"),
    retry: false,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get<SchoolOverview>("/v1/admin/overview"),
    retry: false,
  });

  const isLoading = schoolLoading || overviewLoading;

  return (
    <div className="min-h-screen relative">
      <GradientMesh />
      <div className="max-w-6xl mx-auto space-y-6 pb-24 lg:pb-8 px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 pt-4"
        >
          <Shield className="w-6 h-6 text-accent-light" />
          <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
        </motion.div>

        {/* System Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={isLoading ? "..." : (overview?.totalStudents ?? 0) + (overview?.totalTeachers ?? 0)}
            label="Total Users"
            iconBg="bg-accent/10"
            iconColor="text-accent-light"
          />
          <StatCard
            icon={<School className="w-5 h-5" />}
            value={isLoading ? "..." : overview?.totalClasses ?? 0}
            label="Classes"
            iconBg="bg-info/10"
            iconColor="text-info"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5" />}
            value={isLoading ? "..." : overview?.totalAssignments ?? 0}
            label="Assignments"
            iconBg="bg-success/10"
            iconColor="text-success"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            value={isLoading ? "..." : overview?.recentSubmissions ?? 0}
            label="Active Submissions (7d)"
            iconBg="bg-warning/10"
            iconColor="text-warning"
          />
        </div>

        {/* School Details */}
        {school && (
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold mb-4">{school.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs text-foreground-subtle">Total Members</p>
                  <p className="stat-number text-xl">{school._count.members}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-info" />
                <div>
                  <p className="text-xs text-foreground-subtle">Total Classes</p>
                  <p className="stat-number text-xl">{school._count.classes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Management & Safety Controls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AdminLink href="/dashboard/principal" label="Principal Command Center" description="Access school-wide KPIs, teacher count, and class metrics" />
            <AdminLink href="/dashboard/principal/audit-logs" label="CBSE Compliance Audits" description="Audit AI interactions, filter prompts, check safety logs" />
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] opacity-70">
              <p className="text-sm font-medium text-foreground-muted flex items-center gap-1.5">
                <span>System Configurations</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-light border border-accent/20">DB Seeded</span>
              </p>
              <p className="text-xs text-foreground-subtle mt-1">Class sizes and parameters are managed via migration presets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="card p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${iconBg} ${iconColor} mb-3`}>
        {icon}
      </div>
      <p className="stat-number text-2xl leading-none">{value}</p>
      <p className="text-xs text-foreground-subtle mt-1.5">{label}</p>
    </div>
  );
}

function AdminLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="p-4 rounded-xl border bg-surface/20 border-card-border hover:border-card-border-hover hover:bg-surface/40 transition-all"
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-foreground-subtle mt-1">{description}</p>
    </a>
  );
}
