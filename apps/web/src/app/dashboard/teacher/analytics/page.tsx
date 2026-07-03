"use client";

import { motion } from "framer-motion";
import { GradientMesh } from "@web/components/ui/background";
import { useTeacherDashboard, useTeacherAnalytics } from "@web/hooks/use-teacher";
import { useTranslation } from "@web/context/language-context";
import {
  BarChart3, TrendingUp, Users, BookOpen, Award,
  AlertTriangle, CheckCircle2, Zap, ExternalLink
} from "lucide-react";

// ─── Mini bar chart ───────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 xp-bar-track h-2 bg-surface">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-foreground-muted w-8 text-right">{value}</span>
    </div>
  );
}

// ─── Placeholder data for analytics (replace with real API) ─────────────

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SUBMISSION_DATA = [3, 8, 5, 12, 7, 2, 1];
const GRADE_DIST = [
  { label: "A (90-100%)", count: 8, color: "#22c55e" },
  { label: "B (80-89%)", count: 12, color: "#6366f1" },
  { label: "C (70-79%)", count: 6, color: "#f59e0b" },
  { label: "D (60-69%)", count: 3, color: "#ef4444" },
  { label: "F (<60%)", count: 1, color: "#7f1d1d" },
];
const MAX_GRADE = Math.max(...GRADE_DIST.map((g) => g.count));

const TOP_TOOLS = [
  { name: "ChatGPT", uses: 42, color: "#10a37f" },
  { name: "Grammarly", uses: 31, color: "#15c39a" },
  { name: "Perplexity", uses: 18, color: "#20b2aa" },
  { name: "GitHub Copilot", uses: 14, color: "#1b1f24" },
  { name: "Canva AI", uses: 11, color: "#00c4cc" },
];
const MAX_TOOL = TOP_TOOLS[0].uses;

// ─── Page ─────────────────────────────────────────────────────────────────

export default function TeacherAnalyticsPage() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useTeacherDashboard();
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useTeacherAnalytics();

  const isLoading = isDashboardLoading || isAnalyticsLoading;
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

  const weeklySubmissions = analyticsData?.weeklySubmissions ?? [];
  const maxSubmission = Math.max(...weeklySubmissions.map((s: any) => s.count), 0);

  const gradeDistribution = analyticsData?.gradeDistribution ?? [];
  const maxGrade = Math.max(...gradeDistribution.map((g: any) => g.count), 0);

  const topTools = analyticsData?.toolStats ?? [];
  const maxTool = Math.max(...topTools.map((t: any) => t.usageCount), 0);

  const atRiskStudents = analyticsData?.atRiskStudents ?? [];

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen relative">
      <GradientMesh />

      <div className="max-w-6xl mx-auto pb-24 lg:pb-8 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-6 pb-4"
        >
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-accent-light" />
            {isHindi ? "कक्षा विश्लेषण" : "Class Analytics"}
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {isHindi ? "प्रदर्शन स्तर, पूर्णता दर, और छात्र गतिविधि" : "Performance insights, completion rates, and student activity"}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Overview stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isHindi ? "कुल छात्र" : "Total Students", value: dashboardData?.totalStudents ?? 0, icon: Users, color: "#6366f1" },
              { label: isHindi ? "पूर्णता दर" : "Completion Rate", value: dashboardData ? `${Math.round(dashboardData.completionRate)}%` : "—", icon: CheckCircle2, color: "#22c55e" },
              { label: isHindi ? "औसत ग्रेड" : "Average Grade", value: dashboardData?.averageGrade != null ? `${Math.round(dashboardData.averageGrade)}%` : "—", icon: TrendingUp, color: "#f59e0b" },
              { label: isHindi ? "सक्रिय असाइनमेंट" : "Active Assignments", value: dashboardData?.activeAssignments ?? 0, icon: BookOpen, color: "#06b6d4" },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}18` }}>
                  <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                </div>
                <p className="stat-number text-2xl leading-none">{isLoading ? "—" : s.value}</p>
                <p className="text-xs text-foreground-subtle mt-1.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly submission activity */}
            <motion.div variants={itemVariants} className="card p-5">
              <h2 className="font-display text-base font-semibold mb-5 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-accent-light" />
                {isHindi ? "साप्ताहिक सबमिशन" : "Weekly Submissions"}
              </h2>
              <div className="flex items-end justify-between gap-2 h-32 pt-4">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-foreground-muted">Loading chart...</div>
                ) : weeklySubmissions.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-foreground-muted">{isHindi ? "साप्ताहिक डेटा उपलब्ध नहीं" : "No weekly data available"}</div>
                ) : (
                  weeklySubmissions.map((s: any, i: number) => {
                    const pct = maxSubmission > 0 ? (s.count / maxSubmission) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                          className="w-full rounded-t-md min-h-[4px] relative group cursor-default"
                          style={{ backgroundColor: "#6366f1", maxHeight: "100px" }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-accent-light opacity-0 group-hover:opacity-100 transition-opacity">
                            {s.count}
                          </span>
                        </motion.div>
                        <span className="text-[10px] text-foreground-subtle">{s.dayLabel}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Grade distribution */}
            <motion.div variants={itemVariants} className="card p-5">
              <h2 className="font-display text-base font-semibold mb-5 flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-yellow-400" />
                {isHindi ? "ग्रेड वितरण" : "Grade Distribution"}
              </h2>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-foreground-muted">Loading distribution...</div>
                ) : gradeDistribution.length === 0 ? (
                  <div className="py-8 text-center text-xs text-foreground-muted">{isHindi ? "अभी तक कोई ग्रेडेड सबमिशन नहीं" : "No graded submissions yet"}</div>
                ) : (
                  gradeDistribution.map((g: any) => (
                    <div key={g.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground-muted">{g.label}</span>
                        <span className="font-semibold" style={{ color: g.color }}>{g.count} {isHindi ? "छात्र" : "students"}</span>
                      </div>
                      <MiniBar value={g.count} max={maxGrade} color={g.color} />
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Top tools */}
            <motion.div variants={itemVariants} className="card p-5">
              <h2 className="font-display text-base font-semibold mb-5 flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-accent-light" />
                {isHindi ? "शीर्ष टूल" : "Top Tools Used"}
              </h2>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-foreground-muted">Loading tools stats...</div>
                ) : topTools.length === 0 ? (
                  <div className="py-8 text-center text-xs text-foreground-muted">{isHindi ? "कोई टूल गतिविधि दर्ज नहीं" : "No tool activity logged"}</div>
                ) : (
                  topTools.map((tool: any, i: number) => (
                    <div key={tool.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
                            style={{ backgroundColor: tool.brandColor }}>
                            {i + 1}
                          </span>
                          <span className="text-foreground-muted">{tool.name}</span>
                        </span>
                        <span className="font-semibold text-foreground">{tool.usageCount} {isHindi ? "बार" : "uses"}</span>
                      </div>
                      <MiniBar value={tool.usageCount} max={maxTool} color={tool.brandColor} />
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* At-risk students */}
            <motion.div variants={itemVariants} className="card p-5">
              <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-warning" />
                {isHindi ? "गतिविधि चिह्न" : "Activity Flags"}
              </h2>
              <p className="text-xs text-foreground-muted mb-4">{isHindi ? "कम गतिविधि या छूटी असाइनमेंट वाले छात्र" : "Students with low activity or missed assignments"}</p>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-foreground-muted">Loading alerts...</div>
              ) : atRiskStudents.length > 0 ? (
                <div className="space-y-2">
                  {atRiskStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-card-border bg-surface/20 hover:bg-surface/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-foreground-subtle overflow-hidden">
                          {student.image ? (
                            <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student.name[0]
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-foreground-subtle">{student.reason}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        student.level === "CRITICAL"
                          ? "text-red-400 border-red-400/25 bg-red-400/10"
                          : "text-amber-400 border-amber-400/25 bg-amber-400/10"
                      }`}>
                        {student.level}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-success opacity-40 mb-2" />
                  <p className="text-sm text-foreground-muted">{isHindi ? "अभी कोई गतिविधि समस्या नहीं" : "No activity concerns right now"}</p>
                  <p className="text-xs text-foreground-subtle">{isHindi ? "सभी छात्र सही रास्ते पर हैं" : "All students are on track"}</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
