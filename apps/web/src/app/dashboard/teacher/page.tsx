"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTeacherDashboard, useCreateClass } from "@web/hooks/use-teacher";
import { GradientMesh } from "@web/components/ui/background";
import {
  GraduationCap,
  Clock,
  Users,
  Activity,
  AlertTriangle,
  PlusCircle,
  CheckSquare,
  Megaphone,
  FileText,
  ArrowUpRight,
  TrendingUp,
  BrainCircuit,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// ─── Sophisticated Motion Variants ──────────────────────────────────────

const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: smoothEase },
  },
};

// ─── Premium UI Sub-components ────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] ${className}`}>
      {children}
    </div>
  );
}

function MiniStat({ title, value, icon, colorClass = "text-accent-light", bgClass = "bg-accent/10" }: { title: string; value: string | number; icon: React.ReactNode; colorClass?: string; bgClass?: string }) {
  return (
    <GlassCard className="!p-5 flex items-center gap-4 h-full">
      <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center flex-shrink-0 shadow-inner`}>
        <div className={colorClass}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-semibold leading-none">{value}</p>
      </div>
    </GlassCard>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function TeacherDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "STUDENT") {
      router.replace("/dashboard/student");
    }
  }, [session, status, router]);

  const userName = session?.user?.name?.split(" ")[0] || "Teacher";
  const { data, isLoading } = useTeacherDashboard();

  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState("");
  const [createClassSuccess, setCreateClassSuccess] = useState<string>();
  const [createClassError, setCreateClassError] = useState<string>();
  const createClassMutation = useCreateClass();

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;
    setCreateClassError(undefined);

    createClassMutation.mutate(
      { name: classNameInput.trim() },
      {
        onSuccess: (resData) => {
          setCreateClassSuccess(`Class successfully created with code: ${resData.class.joinCode}`);
          setClassNameInput("");
          setTimeout(() => {
            setIsCreateClassOpen(false);
            setCreateClassSuccess(undefined);
          }, 2500);
        },
        onError: (err: any) => {
          setCreateClassError(err?.message ?? "Failed to create class. Please try again.");
        },
      }
    );
  };

  if (status === "loading" || session?.user?.role === "STUDENT") {
    return null;
  }

  return (
    <div className="min-h-screen relative selection:bg-accent/30">
      <GradientMesh className="opacity-40" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-foreground">
                {getGreeting()}, <span className="text-foreground-muted">{userName}.</span>
              </h1>
              <p className="text-sm md:text-base text-foreground-subtle mt-3 font-medium tracking-wide">
                Welcome to your dashboard. Here is your classes and students safety overview.
              </p>
              {data?.schoolName && (
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs md:text-sm text-foreground-subtle font-medium">
                  <span>{data.schoolName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 bg-surface/30 backdrop-blur-xl border border-white/5 px-5 py-3 rounded-2xl shadow-xl">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
                <GraduationCap className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <p className="text-xs text-foreground-subtle font-medium uppercase tracking-wider mb-0.5">Role</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold leading-none text-accent-light">Educator</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Overview Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <MiniStat
              title="Total Students"
              value={isLoading ? "—" : (data?.totalStudents ?? 0)}
              icon={<Users className="w-5 h-5" />}
              colorClass="text-accent-light"
              bgClass="bg-accent/15"
            />
            <MiniStat
              title="Active Today"
              value={isLoading ? "—" : (data?.activeStudentsToday ?? 0)}
              icon={<Activity className="w-5 h-5" />}
              colorClass="text-success"
              bgClass="bg-success/15"
            />
            <MiniStat
              title="Pending Review"
              value={isLoading ? "—" : (data?.pendingSubmissions ?? 0)}
              icon={<Clock className="w-5 h-5" />}
              colorClass="text-warning"
              bgClass="bg-warning/15"
            />
            <MiniStat
              title="Safety Alerts"
              value={isLoading ? "—" : (data?.safetyAlertsCount ?? 0)}
              icon={<AlertTriangle className="w-5 h-5" />}
              colorClass="text-error"
              bgClass="bg-error/15"
            />
          </motion.div>

          {/* Row 2: Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chronological Activity Feed */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <GlassCard className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-foreground-muted" />
                      <h2 className="text-base font-medium text-foreground tracking-wide">Recent Student Activity</h2>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
                    <div className="text-center py-12 text-foreground-muted">
                      No student activity logged recently.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.recentActivity.map((act) => {
                        let badgeColor = "bg-white/5 text-foreground-muted border-white/5";
                        let icon = <FileText className="w-3.5 h-3.5" />;
                        if (act.type === "SAFETY_ALERT") {
                          badgeColor = "bg-error/10 text-error border-error/20";
                          icon = <AlertTriangle className="w-3.5 h-3.5" />;
                        } else if (act.type === "SUBMISSION") {
                          badgeColor = "bg-warning/10 text-warning border-warning/20";
                          icon = <Clock className="w-3.5 h-3.5" />;
                        } else if (act.type === "COMPLETION") {
                          badgeColor = "bg-success/10 text-success border-success/20";
                          icon = <CheckSquare className="w-3.5 h-3.5" />;
                        } else if (act.type === "AI_USE") {
                          badgeColor = "bg-accent/10 text-accent-light border-accent/20";
                          icon = <BrainCircuit className="w-3.5 h-3.5" />;
                        }

                        return (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-300 gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${badgeColor}`}>
                                {icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  <span className="font-semibold text-foreground-muted">{act.studentName}</span> {act.detail}
                                </p>
                                <p className="text-[10px] text-foreground-subtle mt-0.5">{timeAgo(act.timestamp)}</p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground-subtle hidden sm:inline-block">
                              {act.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full flex flex-col">
                <h3 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-6">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-3.5 flex-1">
                  <a
                    href="/dashboard/teacher/create-assignment"
                    className="flex items-center justify-between p-4 rounded-2xl border border-accent/20 bg-accent-surface hover:bg-accent-surface-hover hover:border-accent/30 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <PlusCircle className="w-5 h-5 text-accent-light" />
                      <span className="text-sm font-medium text-foreground">Create Assignment</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground transition-colors" />
                  </a>

                  <a
                    href="/dashboard/teacher/grading"
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-5 h-5 text-warning" />
                      <span className="text-sm font-medium text-foreground">Review Submissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {data?.pendingSubmissions != null && data.pendingSubmissions > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-warning/20 border border-warning/30 text-[10px] font-bold text-warning">
                          {data.pendingSubmissions}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground transition-colors" />
                    </div>
                  </a>

                  <a
                    href="/dashboard/teacher/announcements"
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-5 h-5 text-info" />
                      <span className="text-sm font-medium text-foreground">Send Announcement</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground transition-colors" />
                  </a>

                  <a
                    href="/dashboard/teacher/analytics"
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium text-foreground">View Reports</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground transition-colors" />
                  </a>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Row 3: AI Usage Summary, Frequently Asked Doubts & Classes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* AI Usage Summary */}
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-accent-light" />
                    AI Usage Summary
                  </h3>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded bg-white/5 animate-pulse" />)}
                    </div>
                  ) : !data?.aiUsage || data.aiUsage.mostUsedTools.length === 0 ? (
                    <div className="text-center py-8 text-foreground-subtle text-xs">No AI usage logged.</div>
                  ) : (
                    <div className="space-y-4">
                      {data.aiUsage.mostUsedTools.map((tool) => {
                        const maxCount = Math.max(...data.aiUsage.mostUsedTools.map(t => t.count));
                        const percent = maxCount > 0 ? (tool.count / maxCount) * 100 : 0;
                        return (
                          <div key={tool.name} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-foreground-muted">{tool.name}</span>
                              <span className="text-foreground font-semibold">{tool.count} uses</span>
                            </div>
                            <div className="h-2 bg-surface rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1, ease: smoothEase }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: tool.brandColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!isLoading && data?.aiUsage && (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/5 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest mb-1">Daily Count</p>
                      <p className="text-xl font-semibold text-foreground">{data.aiUsage.dailyUsage}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest mb-1">Weekly Count</p>
                      <p className="text-xl font-semibold text-foreground">{data.aiUsage.weeklyUsage}</p>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Frequently Asked Doubts */}
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full flex flex-col">
                <h3 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-6 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-warning" />
                  Frequently Asked Doubts
                </h3>

                {isLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-8 w-16 rounded-full bg-white/5 animate-pulse" />)}
                  </div>
                ) : !data?.frequentDoubts || data.frequentDoubts.length === 0 ? (
                  <div className="text-center py-8 text-foreground-subtle text-xs flex-1 flex items-center justify-center">
                    No doubts analyzed yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 flex-1 items-start">
                    {data.frequentDoubts.map((doubt) => (
                      <span
                        key={doubt.word}
                        className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs font-medium text-foreground-muted flex items-center gap-1.5 transition-all cursor-default"
                      >
                        <span>{doubt.word}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-[10px] text-accent-light font-bold">
                          {doubt.count}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Teacher Classes */}
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-info" />
                    Your Classes
                  </h3>
                  <button
                    onClick={() => setIsCreateClassOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent text-white font-semibold text-xs shadow-md shadow-accent/20 hover:bg-accent-light transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
                  </div>
                ) : !data?.classInfo || data.classInfo.length === 0 ? (
                  <div className="text-center py-8 text-foreground-subtle text-xs flex-1 flex items-center justify-center">
                    No classes assigned yet.
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {data.classInfo.map((cls) => (
                      <a
                        key={cls.id}
                        href={`/dashboard/teacher/classes/${cls.id}`}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 transition-all group"
                      >
                        <span className="text-xs font-medium text-foreground-muted group-hover:text-accent-light transition-colors truncate">
                          {cls.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-foreground-subtle bg-surface px-2 py-1 rounded-md border border-white/5">
                            {cls._count?.members ?? 0} students
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>

          {/* Safety Alerts Preview */}
          <motion.div variants={itemVariants}>
            <GlassCard>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-error" />
                  <h2 className="text-base font-medium text-foreground tracking-wide">Safety Alerts Preview</h2>
                </div>
                <a
                  href="/dashboard/teacher/analytics"
                  className="text-xs font-medium text-foreground-subtle hover:text-foreground transition-colors flex items-center gap-1"
                >
                  View full history <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
                </div>
              ) : !data?.safetyAlertsPreview || data.safetyAlertsPreview.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted text-xs">
                  No safety flags triggered recently. All students are following academic integrity rules.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-bold text-foreground-subtle uppercase tracking-wider">
                        <th className="pb-3 pr-4">Student</th>
                        <th className="pb-3 pr-4">Grade</th>
                        <th className="pb-3 pr-4">Flagged Query</th>
                        <th className="pb-3 pr-4">AI Tool</th>
                        <th className="pb-3 pr-4">Category</th>
                        <th className="pb-3 pr-4">Severity</th>
                        <th className="pb-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-foreground-muted font-medium">
                      {data.safetyAlertsPreview.map((alert) => (
                        <tr key={alert.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-3.5 pr-4 text-foreground font-semibold">{alert.studentName}</td>
                          <td className="py-3.5 pr-4">Grade {alert.gradeLevel || "—"}</td>
                          <td className="py-3.5 pr-4 italic max-w-xs truncate" title={alert.promptText}>
                            "{alert.promptText}"
                          </td>
                          <td className="py-3.5 pr-4">{alert.toolUsed}</td>
                          <td className="py-3.5 pr-4">
                            <span className="px-2 py-0.5 rounded bg-error/10 text-error border border-error/15 text-[10px] font-bold">
                              {alert.category}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className="px-2 py-0.5 rounded bg-error/15 text-error text-[10px] font-bold">
                              {alert.severity}
                            </span>
                          </td>
                          <td className="py-3.5 text-foreground-subtle">{timeAgo(alert.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreateClassOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: smoothEase }}
              className="w-full max-w-md p-6 md:p-8 rounded-3xl border border-white/10 bg-surface-hover backdrop-blur-2xl shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => {
                  setIsCreateClassOpen(false);
                  setClassNameInput("");
                  setCreateClassSuccess(undefined);
                  setCreateClassError(undefined);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-6 h-6 text-accent-light" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Create a New Class</h3>
                <p className="text-sm text-foreground-subtle">
                  A unique 6-character code will be generated instantly
                </p>
              </div>

              {(createClassMutation.isError || createClassError) && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-error/15 border border-error/25 text-error text-xs">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{createClassError || (createClassMutation.error as any)?.message || "Failed to create class."}</span>
                </div>
              )}

              {createClassSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{createClassSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleCreateClassSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modalClassName" className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                      Class / Course Name
                    </label>
                    <input
                      id="modalClassName"
                      type="text"
                      placeholder="e.g. Science 102, AI Lab"
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      disabled={createClassMutation.isPending}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all text-sm text-foreground placeholder:text-white/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createClassMutation.isPending || !classNameInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent/90 hover:to-accent-light/90 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                  >
                    {createClassMutation.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Generate Class Code
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}