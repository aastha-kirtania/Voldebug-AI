"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRoadmap } from "@web/hooks/use-dashboard";
import { GradientMesh } from "@web/components/ui/background";
import {
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Milestone,
  Play,
  Zap,
  BookOpen,
  Info,
  ChevronRight,
  TrendingUp
} from "lucide-react";

// ─── Animation Presets ──────────────────────────────────────────────────

const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smoothEase },
  },
};

export default function StudentRoadmapPage() {
  const { data: session } = useSession();
  const { data: roadmapData, isLoading, error } = useRoadmap();

  const userName = session?.user?.name?.split(" ")[0] || "Student";

  // Identify the recommended tool details
  const recommendedTool = useMemo(() => {
    if (!roadmapData) return null;
    return roadmapData.tools.find((t) => t.id === roadmapData.recommendedToolId) || null;
  }, [roadmapData]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative p-4 md:p-8">
        <GradientMesh className="opacity-40" />
        <div className="max-w-4xl mx-auto space-y-8 pt-8">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-white/5 animate-pulse rounded-2xl" />
            <div className="h-5 w-96 bg-white/5 animate-pulse rounded-xl" />
          </div>
          <div className="h-48 bg-white/5 animate-pulse rounded-[2rem]" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !roadmapData) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <GradientMesh className="opacity-40" />
        <div className="text-center space-y-4 max-w-md bg-surface/40 backdrop-blur-2xl border border-white/5 p-8 rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-error/10 border border-error/25 flex items-center justify-center mx-auto text-error">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Failed to Load Roadmap</h2>
          <p className="text-sm text-foreground-subtle">
            There was a problem retrieving your visual learning roadmap. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  const { tools, studentProgress } = roadmapData;
  const gradeLevel = studentProgress.gradeLevel;

  let gradeClass = "grade-high";
  if (gradeLevel >= 1 && gradeLevel <= 5) {
    gradeClass = "grade-elementary";
  } else if (gradeLevel >= 6 && gradeLevel <= 8) {
    gradeClass = "grade-middle";
  }

  return (
    <div className={`min-h-screen relative selection:bg-accent/30 ${gradeClass}`}>
      <GradientMesh className="opacity-40" />

      <div className="max-w-4xl mx-auto space-y-8 pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: smoothEase }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <h1 className="font-display text-4xl font-medium tracking-tight text-foreground flex items-center gap-3">
              <Milestone className="w-8 h-8 text-accent-light" />
              <span>Learning Roadmap</span>
            </h1>
            <p className="text-sm md:text-base text-foreground-subtle mt-2 font-medium tracking-wide">
              Level up to unlock new tools and complete your learning goals, {userName}.
            </p>
          </div>
        </motion.div>

        {/* Top Progress Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Level Tracker */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <GlassCard className="flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1">
                    Your Current Level
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold leading-none">{studentProgress.currentLevel}</span>
                    <span className="text-xs text-foreground-muted font-medium">({studentProgress.totalXP} total XP)</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-accent-surface flex items-center justify-center text-accent-light border border-accent/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-foreground-muted mb-2">
                  <span>Level {studentProgress.currentLevel} Progress</span>
                  <span>{studentProgress.xpNeededForNextLevel} XP to Level {studentProgress.currentLevel + 1}</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${studentProgress.percentToNextLevel}%` }}
                    transition={{ duration: 1.5, ease: smoothEase }}
                    className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full relative"
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/20 to-transparent" />
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Unlock Info Summary */}
          <motion.div variants={itemVariants} className="md:col-span-1">
            <GlassCard className="flex flex-col justify-center items-center text-center h-full space-y-3">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center text-warning border border-warning/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">Path Progression</h4>
                <p className="text-xs text-foreground-subtle mt-1.5 leading-relaxed">
                  Earn XP by completing assignments. Higher levels unlock specialized writing, design, and research AI.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Recommended Next Step Callout */}
        {recommendedTool && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: smoothEase, delay: 0.2 }}
          >
            <div className="relative overflow-hidden group rounded-[2rem] border border-accent/20 bg-gradient-to-r from-accent-surface via-transparent to-transparent p-6 md:p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-50" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-[10px] font-bold text-accent-light uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 animate-bounce" /> Recommended Next Step
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      Use {recommendedTool.name}
                    </h3>
                    <p className="text-sm text-foreground-subtle mt-1.5 max-w-xl">
                      {recommendedTool.isLocked 
                        ? `This tool is locked. Reach Level ${recommendedTool.requiredLevel} to unlock and start experimenting!`
                        : `You haven't completed this step yet. Try running an unflagged query inside ${recommendedTool.name} to earn roadmap progress.`
                      }
                    </p>
                  </div>
                </div>

                {!recommendedTool.isLocked && (
                  <a
                    href={`/dashboard/tools/${recommendedTool.id}`}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-accent text-white font-semibold text-sm shadow-lg shadow-accent/20 hover:bg-accent-light hover:shadow-accent/30 transition-all active:scale-[0.98] w-full md:w-auto h-12"
                  >
                    <span>Launch Tool</span>
                    <Play className="w-4 h-4 fill-white" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Roadmap Timeline path */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8 relative"
        >
          {/* Vertical linking timeline bar */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-success via-accent to-surface-hover transform md:-translate-x-1/2 z-0" />

          {tools.map((tool, index) => {
            const isCompleted = tool.isCompleted;
            const isLocked = tool.isLocked;
            const isRecommended = tool.id === roadmapData.recommendedToolId;
            
            // Alternates layout side for timeline on md+ screens
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={tool.id}
                variants={itemVariants}
                className={`relative flex flex-col md:flex-row items-start ${
                  isLeft ? "md:justify-start" : "md:justify-end"
                } w-full`}
              >
                {/* Timeline center node indicator */}
                <div
                  className={`absolute left-6 md:left-1/2 top-10 w-8 h-8 rounded-full border-4 ${
                    isCompleted
                      ? "bg-success border-success-glow shadow-[0_0_12px_var(--color-success)] text-white"
                      : isRecommended
                      ? "bg-accent border-accent-glow shadow-[0_0_12px_var(--color-accent)] text-white"
                      : "bg-surface border-white/10 text-foreground-muted"
                  } transform -translate-x-1/2 z-10 flex items-center justify-center`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-foreground-subtle" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-accent-light" />
                  )}
                </div>

                {/* Timeline node details card */}
                <div
                  className={`w-full md:w-[calc(50%-2rem)] pl-16 md:pl-0 ${
                    isLeft ? "md:pr-8" : "md:pl-8"
                  }`}
                >
                  <div
                    className={`relative overflow-hidden rounded-[2rem] border transition-all duration-300 ${
                      isCompleted
                        ? "bg-success/5 border-success/20 shadow-lg"
                        : isRecommended
                        ? "bg-accent-surface border-accent/30 shadow-2xl ring-2 ring-accent/30 ring-offset-2 ring-offset-bg"
                        : isLocked
                        ? "bg-surface/10 border-white/5 opacity-60 grayscale"
                        : "bg-surface/30 border-white/5 hover:border-white/10 shadow-xl"
                    } p-6 group`}
                  >
                    {/* Tool Category Banner & Lock state indicator */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                        {tool.category.replace("_", " ")}
                      </span>
                      {isLocked ? (
                        <span className="text-[10px] font-semibold text-error/90 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Unlocks at Lvl {tool.requiredLevel}
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-bold text-success flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : isRecommended ? (
                        <span className="text-[10px] font-bold text-accent-light animate-pulse flex items-center gap-1">
                          ● Next Up
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-foreground-muted flex items-center gap-1">
                          Unused
                        </span>
                      )}
                    </div>

                    {/* Tool branding color highlight */}
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg flex-shrink-0"
                        style={{ backgroundColor: tool.brandColor || "var(--color-accent)" }}
                      >
                        {tool.name[0]}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-semibold text-foreground text-base group-hover:text-accent-light transition-colors flex items-center gap-1.5">
                          {tool.name}
                        </h4>
                        <p className="text-xs text-foreground-subtle leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    {/* Subjects tags */}
                    {tool.subjects && tool.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/5">
                        {tool.subjects.map((subj) => (
                          <span key={subj} className="text-[10px] font-medium text-foreground-subtle bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-md">
                            {subj}
                          </span>
                        ))}
                        {tool.useCases && tool.useCases.slice(0, 2).map((use) => (
                          <span key={use} className="text-[10px] font-medium text-accent-light/80 bg-accent/5 border border-accent/5 px-2.5 py-0.5 rounded-md">
                            {use}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Launch link for unlocked steps */}
                    {!isLocked && (
                      <div className="mt-4 pt-3 flex justify-end">
                        <a
                          href={`/dashboard/tools/${tool.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent-light hover:text-accent transition-colors"
                        >
                          <span>{isCompleted ? "Explore again" : "Start path"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] ${className}`}
    >
      {children}
    </div>
  );
}
