"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDashboardStats, useAssignments, useTools, useDailyChallenge } from "@web/hooks/use-dashboard";
import { Progress } from "@web/components/ui/progress";
import { GradientMesh } from "@web/components/ui/background";
import ReactConfetti from "react-confetti";
import { sound } from "@web/lib/audio";
import {
  Flame,
  Trophy,
  Award,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  LayoutGrid,
  Activity,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";

// ─── Sophisticated Motion Variants ──────────────────────────────────────

const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smoothEase },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDaysUntilDue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "TEACHER") {
      router.replace("/dashboard/teacher");
    }
  }, [session, status, router]);

  const userName = session?.user?.name?.split(' ')[0] || "Student";

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string>();
  const [joinSuccess, setJoinSuccess] = useState<string>();
  const [showXpTooltip, setShowXpTooltip] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [lastKnownLevel, setLastKnownLevel] = useState<number | null>(null);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinLoading(true);
    setJoinError(undefined);
    setJoinSuccess(undefined);

    try {
      const token = (session?.user as any)?.token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/classes/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code: joinCodeInput.trim() }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to join class.");
      }

      setJoinSuccess(json.data?.message || "Successfully joined class!");
      setJoinCodeInput("");

      setTimeout(() => {
        setIsJoinOpen(false);
        setJoinSuccess(undefined);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setJoinError(err.message || "Something went wrong.");
    } finally {
      setJoinLoading(false);
    }
  };

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: assignments, isLoading: assignLoading } = useAssignments();
  const { data: tools } = useTools();
  const { data: challenge, isLoading: challengeLoading } = useDailyChallenge();

  useEffect(() => {
    if (stats?.xp.level !== undefined) {
      if (lastKnownLevel !== null && stats.xp.level > lastKnownLevel) {
        setShowLevelUp(stats.xp.level);
        sound.playLevelUp();
      }
      setLastKnownLevel(stats.xp.level);
    }
  }, [stats?.xp.level, lastKnownLevel]);

  const avatarId = session?.user?.image?.startsWith("avatar:") 
    ? session.user.image.split(":")[1] 
    : "robot";

  const AVATAR_MAP: Record<string, { emoji: string; name: string }> = {
    robot: { emoji: "🤖", name: "Volt Robot" },
    lion: { emoji: "🦁", name: "Leo Lion" },
    panda: { emoji: "🐼", name: "Pip Panda" },
    fox: { emoji: "🦊", name: "Foxy Fox" },
    unicorn: { emoji: "🦄", name: "Spark Unicorn" },
    owl: { emoji: "🦉", name: "Ollie Owl" },
  };

  const userAvatar = AVATAR_MAP[avatarId] || AVATAR_MAP.robot;

  const activeAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments
      .filter((a) => !a.submissions || a.submissions.length === 0)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [assignments]);

  const recentActivity = useMemo(() => {
    if (!stats?.recentActivity) return [];
    return stats.recentActivity.map((t: any) => {
      let label = `Earned ${t.amount} XP`;
      if (t.source === "DAILY_CHALLENGE") {
        label = `Completed daily challenge (+${t.amount} XP)`;
      } else if (t.source === "QUIZ_COMPLETED") {
        label = `Passed tool-specific quiz (+${t.amount} XP)`;
      } else if (t.source === "SUBMISSION") {
        label = `Submitted assignment (+${t.amount} XP)`;
      } else if (t.source === "DAILY_LOGIN") {
        label = `Logged in today (+${t.amount} XP)`;
      } else if (t.source === "STREAK_BONUS") {
        label = `Earned streak bonus (+${t.amount} XP)`;
      }
      
      const diffMs = new Date().getTime() - new Date(t.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let time = "Just now";
      if (diffDays > 0) {
        time = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        time = `${diffHours}h ago`;
      } else if (diffMins > 0) {
        time = `${diffMins}m ago`;
      }

      return {
        id: t.id,
        label,
        time,
        xp: t.amount
      };
    });
  }, [stats]);

  const quickTools = useMemo(() => {
    if (!tools) return [];
    return tools.slice(0, 4);
  }, [tools]);

  const levelProgress = useMemo(() => {
    if (!stats) return 0;
    return Math.min(100, stats.xp.total % 100);
  }, [stats]);

  const gradeLevel = stats?.user?.gradeLevel ?? 9;
  let gradeClass = "grade-high";
  if (gradeLevel >= 1 && gradeLevel <= 5) {
    gradeClass = "grade-elementary";
  } else if (gradeLevel >= 6 && gradeLevel <= 8) {
    gradeClass = "grade-middle";
  }

  if (status === "loading" || session?.user?.role === "TEACHER") {
    return null;
  }

  return (
    <div className={`min-h-screen relative selection:bg-accent/30 ${gradeClass}`}>
      {/* Subtle, moody background mesh */}
      <GradientMesh className="opacity-40" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">

        {/* Header Mascot Banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: smoothEase }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-accent/5 border border-accent/10 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="text-5xl md:text-6xl select-none mascot-emoji cursor-pointer"
              title={`${userAvatar.name} — click to wiggle!`}
            >
              {userAvatar.emoji}
            </motion.div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-sm text-foreground-subtle mt-1 flex items-center gap-1.5 flex-wrap">
                <span>{userAvatar.name} says:</span>
                <span className="text-accent-light font-bold">"Hey! Let's learn AI!"</span>
                {stats?.user?.schoolName && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="text-foreground-muted">{stats.user.schoolName}</span>
                  </>
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="text-foreground-muted">Grade {stats?.user?.gradeLevel ?? gradeLevel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap relative z-20">
            <button
              onClick={() => {
                setIsJoinOpen(true);
                sound.playClick();
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent text-white font-semibold text-sm shadow-md shadow-accent/20 hover:bg-accent-light transition-all active:scale-[0.98] border border-white/5 h-14"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Join Class</span>
            </button>

            <div className="flex items-center gap-4 bg-surface/30 backdrop-blur-xl border border-white/5 px-5 py-3 rounded-2xl shadow-xl h-14">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
                <Sparkles className="w-4 h-4 text-accent-light" />
              </div>
              <div>
                <p className="text-[10px] text-foreground-subtle font-medium uppercase tracking-wider mb-0.5">Current Level</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold leading-none">{stats?.xp.level ?? 1}</span>
                  <span className="text-[10px] text-accent-light font-medium">({stats?.xp.total ?? 0} XP)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* Level Progress - Span 8 */}
          <motion.div variants={itemVariants} className="md:col-span-8">
            <GlassCard className="h-full flex flex-col justify-between">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
                    Next Milestone
                  </h3>
                  <p className="text-2xl font-medium text-foreground">
                    Level {stats?.xp.level ? stats.xp.level + 1 : 2}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-surface-hover border border-white/5 text-xs font-medium text-foreground-muted">
                  +{stats?.xp.thisWeek ?? 0} XP this week
                </div>
              </div>

              <div 
                onClick={() => {
                  setShowXpTooltip(!showXpTooltip);
                  sound.playClick();
                }}
                className="cursor-pointer group relative pt-4 pb-2"
              >
                <div className="flex justify-between text-xs font-medium text-foreground-muted mb-3 select-none">
                  <span>Progress</span>
                  <span className="group-hover:text-accent-light transition-colors">
                    {stats?.xp.toNextLevel ?? 100} XP remaining (Click to view!)
                  </span>
                </div>
                {statsLoading ? (
                  <div className="h-3 rounded-full bg-white/5 animate-pulse" />
                ) : (
                  <div className="h-3 bg-surface-hover rounded-full overflow-hidden border border-white/5 relative group-hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1.5, ease: smoothEase }}
                      className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/30 to-transparent" />
                    </motion.div>
                  </div>
                )}

                <AnimatePresence>
                  {showXpTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-accent px-4 py-2 rounded-xl shadow-xl border border-accent-light text-white text-xs font-bold whitespace-nowrap z-30"
                    >
                      🏆 You're {stats?.xp.toNextLevel ?? 100} XP away from Level {stats?.xp.level ? stats.xp.level + 1 : 2}!
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-accent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>

          {/* Daily Mission Card - Span 4 */}
          <motion.div variants={itemVariants} className="md:col-span-4">
            <GlassCard className="h-full relative overflow-hidden group">
              {/* Animated background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="text-2xl select-none"
                  >
                    🎯
                  </motion.div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-subtle">Today's Mission</p>
                    {challenge?.completed ? (
                      <span className="text-[10px] font-bold text-success">✓ Mission Complete!</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-warning flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Resets at midnight
                      </span>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={challenge?.completed ? {} : { scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    challenge?.completed
                      ? "text-success border-success/25 bg-success/8"
                      : "text-amber-400 border-amber-400/30 bg-amber-400/10"
                  }`}
                >
                  {challenge?.completed ? "🌟 Done!" : "🔥 Active"}
                </motion.div>
              </div>

              {challengeLoading ? (
                <div className="space-y-2 relative z-10">
                  <div className="h-5 w-32 bg-white/5 animate-pulse rounded-lg" />
                  <div className="h-4 w-48 bg-white/5 animate-pulse rounded-lg" />
                </div>
              ) : (
                <div className="relative z-10">
                  <h3 className={`text-base font-bold mb-1.5 leading-tight ${challenge?.completed ? "text-foreground-muted line-through" : "text-foreground"}`}>
                    {challenge?.action ?? "Complete a Daily Challenge"}
                  </h3>
                  <p className="text-xs text-foreground-subtle leading-relaxed mb-4">
                    {challenge?.completed
                      ? "🎉 Volt Robot says: \"Amazing work today! You're unstoppable!\""
                      : "🤖 Volt Robot says: \"Complete this mission to earn your daily XP bonus!\""}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto relative z-10 pt-3 border-t border-white/5">
                <motion.span
                  animate={challenge?.completed ? {} : { scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className={`text-lg font-extrabold ${challenge?.completed ? "text-success" : "text-warning"}`}
                >
                  +{challenge?.xpAwarded ?? 50} XP ✨
                </motion.span>
                <a
                  href="/dashboard/tools"
                  className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    challenge?.completed
                      ? "text-foreground-subtle"
                      : "text-accent-light hover:text-white hover:bg-accent/20"
                  }`}
                >
                  {challenge?.completed ? "See more missions" : "Start Mission →"}
                </a>
              </div>
            </GlassCard>
          </motion.div>

          {/* Mini Stats Row */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-4 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              sound.playStreak();
            }}
          >
            <GlassCard className="flex items-center gap-4 relative overflow-hidden group h-full">
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-300 select-none">🔥</div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <Flame className="w-5 h-5 text-warning fill-warning" />
                </motion.div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Day Streak</p>
                <p className="text-xl font-bold text-foreground mt-0.5 flex items-baseline gap-1.5">
                  <span>{stats?.streak.current ?? 0}</span>
                  <span className="text-xs font-semibold text-warning">days 🔥</span>
                </p>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="md:col-span-4 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              sound.playClick();
            }}
          >
            <GlassCard className="flex items-center gap-4 relative overflow-hidden group h-full">
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-300 select-none">🏆</div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Class Rank</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  #{stats?.classRank ?? "—"}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="md:col-span-4 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              sound.playClick();
              router.push("/dashboard/profile");
            }}
          >
            <GlassCard className="flex items-center gap-4 relative overflow-hidden group h-full">
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-300 select-none">🎖️</div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-accent-light" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Badges Earned</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {stats?.badges.earned ?? 0}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Active Quests - Span 8 */}
          <motion.div variants={itemVariants} className="md:col-span-8">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-foreground-muted" />
                  <h2 className="text-base font-medium text-foreground tracking-wide">Active Assignments</h2>
                </div>
                <a href="/dashboard/classroom" className="text-xs font-medium text-foreground-subtle hover:text-foreground transition-colors flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              {assignLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
                </div>
              ) : activeAssignments.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="w-6 h-6 text-foreground-subtle" />} message="All caught up. No pending assignments." />
              ) : (
                <div className="space-y-2">
                  {activeAssignments.map((a) => (
                    <AssignmentRow key={a.id} assignment={a} daysUntilDue={getDaysUntilDue(a.dueDate)} />
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Tools & Activity Stack - Span 4 */}
          <div className="md:col-span-4 flex flex-col gap-6">

            {/* My Classes */}
            <motion.div variants={itemVariants} className="flex-1">
              <GlassCard className="h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-foreground-muted" />
                    <h2 className="text-base font-medium text-foreground tracking-wide">My Classes</h2>
                  </div>
                </div>

                {!stats?.classes || stats.classes.length === 0 ? (
                  <EmptyState icon={<BookOpen className="w-5 h-5 text-foreground-subtle" />} message="You haven't joined any classes yet." />
                ) : (
                  <div className="space-y-2">
                    {stats.classes.map((cls) => (
                      <a
                        key={cls.id}
                        href={`/dashboard/classroom?classId=${cls.id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 transition-all group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground group-hover:text-accent-light transition-colors truncate">
                            {cls.name}
                          </p>
                          <p className="text-[10px] text-foreground-subtle mt-0.5 font-mono">Code: {cls.joinCode || "N/A"}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all" />
                      </a>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Quick Tools */}
            <motion.div variants={itemVariants} className="flex-1">
              <GlassCard className="h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-foreground-muted" />
                    <h2 className="text-base font-medium text-foreground tracking-wide">Quick Tools</h2>
                  </div>
                </div>

                {!tools || tools.length === 0 ? (
                  <EmptyState icon={<LayoutGrid className="w-5 h-5 text-foreground-subtle" />} message="No tools accessed yet." />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {quickTools.map((tool) => (
                      <ToolSquare key={tool.id} tool={tool} />
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants} className="flex-1">
              <GlassCard className="h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-foreground-muted" />
                    <h2 className="text-base font-medium text-foreground tracking-wide">Activity</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Activity className="w-8 h-8 text-foreground-subtle mb-2 opacity-50" />
                      <p className="text-xs font-medium text-foreground-subtle">No recent activity logged.</p>
                    </div>
                  ) : (
                    recentActivity.map((item, i) => (
                      <div key={item.id || i} className="flex items-start justify-between group cursor-default">
                        <div>
                          <p className="text-sm text-foreground-muted group-hover:text-foreground transition-colors duration-300">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-foreground-subtle mt-0.5">{item.time}</p>
                        </div>
                        {item.xp && (
                          <span className="text-xs font-medium text-success/80">+{item.xp}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* Join Class Modal */}
      <AnimatePresence>
        {isJoinOpen && (
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
                  setIsJoinOpen(false);
                  setJoinError(undefined);
                  setJoinSuccess(undefined);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-6 h-6 text-accent-light" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Join a Class</h3>
                <p className="text-sm text-foreground-subtle">
                  Enter the 6-character code provided by your teacher
                </p>
              </div>

              {joinError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-error/15 border border-error/25 text-error text-xs">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              {joinSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{joinSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="XXXXXX"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      maxLength={6}
                      disabled={joinLoading}
                      required
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-center font-mono text-2xl font-bold tracking-[0.4em] uppercase focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all placeholder:text-white/20 text-foreground"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joinLoading || joinCodeInput.trim().length !== 6}
                    className="w-full py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent/90 hover:to-accent-light/90 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                  >
                    {joinLoading && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Join Class
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level-Up Celebration Modal */}
      <AnimatePresence>
        {showLevelUp !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6"
          >
            <ReactConfetti
              width={typeof window !== "undefined" ? window.innerWidth : 500}
              height={typeof window !== "undefined" ? window.innerHeight : 600}
              recycle={true}
              numberOfPieces={200}
            />
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="space-y-6 max-w-sm"
            >
              <div className="text-8xl animate-bounce select-none">🏆</div>
              <div className="space-y-2">
                <h2 className="text-gradient font-display text-4xl font-extrabold tracking-tight">LEVEL UP!</h2>
                <p className="text-lg text-white font-semibold">You reached Level {showLevelUp}!</p>
                <p className="text-sm text-foreground-subtle leading-relaxed">
                  Outstanding job! Keep using AI tools and finishing assignments to rise to the top.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLevelUp(null);
                  sound.playClick();
                }}
                className="px-6 py-3 rounded-2xl bg-accent text-white font-bold hover:bg-accent-light shadow-lg shadow-accent/25 transition-all text-sm w-full"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Refined Sub-components ──────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] ${className}`}>
      {children}
    </div>
  );
}

function MiniStat({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <GlassCard className="!p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-foreground-subtle uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-semibold leading-none">{value}</p>
      </div>
    </GlassCard>
  );
}

function AssignmentRow({ assignment, daysUntilDue }: { assignment: any; daysUntilDue: number }) {
  const isUrgent = daysUntilDue <= 1;

  return (
    <a href={`/dashboard/classroom/${assignment.id}`} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 -mx-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 gap-4">
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium text-foreground group-hover:text-accent-light transition-colors duration-300 truncate mb-1.5">
          {assignment.title}
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-foreground-muted">{assignment.className}</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className={`text-[11px] font-medium ${isUrgent ? 'text-error/90' : 'text-foreground-subtle'}`}>
            {daysUntilDue === 0 ? "Due today" : `${daysUntilDue} days left`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        <span className="text-xs font-medium text-success/80 bg-success/10 px-2.5 py-1 rounded-md">
          +{assignment.xpReward} XP
        </span>
        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/10 transition-all duration-300">
          <ArrowUpRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </a>
  );
}

function ToolSquare({ tool }: { tool: any }) {
  return (
    <a href={`/dashboard/tools/${tool.id}`} className="group aspect-square rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white relative z-10 shadow-lg"
        style={{ backgroundColor: tool.brandColor || "var(--color-accent)" }}
      >
        {tool.name[0]}
      </div>
      <span className="text-xs font-medium text-foreground-subtle group-hover:text-foreground transition-colors relative z-10 w-full text-center px-2 truncate">
        {tool.name}
      </span>
    </a>
  );
}

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground-subtle">{message}</p>
    </div>
  );
}