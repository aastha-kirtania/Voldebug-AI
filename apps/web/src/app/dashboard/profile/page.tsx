"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useDashboardStats, useSaveParentSettings, useTriggerParentReport, useUpdateProfile } from "@web/hooks/use-dashboard";
import { useTranslation } from "@web/context/language-context";
import { useTeacherDashboard } from "@web/hooks/use-teacher";
import { useSubmissionHistory } from "@web/hooks/use-classroom";
import { GradientMesh } from "@web/components/ui/background";
import {
  Zap, Trophy, Award, Flame, Star,
  BookOpen, TrendingUp, Edit3, Users, FileText,
  Lock, Loader2, Mail, ChevronDown, X, CheckCircle2, AlertCircle,
  SmilePlus
} from "lucide-react";

// ─── Motion Variants ──────────────────────────────────────────────────────
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

// ─── XP Level calculation ────────────────────────────────────────────────
function getLevel(totalXP: number) {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

function xpForLevel(level: number) {
  return (level - 1) ** 2 * 100;
}

// ─── Avatar options ───────────────────────────────────────────────────────
const AVATAR_OPTIONS = [
  { id: "robot",   emoji: "🤖", label: "Volt Robot" },
  { id: "lion",    emoji: "🦁", label: "Leo Lion" },
  { id: "panda",   emoji: "🐼", label: "Pip Panda" },
  { id: "fox",     emoji: "🦊", label: "Foxy Fox" },
  { id: "unicorn", emoji: "🦄", label: "Spark Unicorn" },
  { id: "owl",     emoji: "🦉", label: "Ollie Owl" },
];

function getAvatarDisplay(image: string | null | undefined, name: string) {
  if (image?.startsWith("avatar:")) {
    const id = image.slice(7);
    const found = AVATAR_OPTIONS.find(a => a.id === id);
    if (found) return { type: "emoji" as const, value: found.emoji };
  }
  return { type: "initial" as const, value: name[0]?.toUpperCase() ?? "U" };
}

// ─── Premium UI Sub-components ────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] ${className}`}>
      {children}
    </div>
  );
}

function MiniStat({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <GlassCard className="!p-5 flex items-center gap-4 h-full">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-medium leading-none">{value}</p>
      </div>
    </GlassCard>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────
function EditProfileModal({
  currentName,
  currentImage,
  onClose,
  onSaved,
}: {
  currentName: string;
  currentImage: string | null | undefined;
  onClose: () => void;
  onSaved: (name: string, avatar?: string) => void;
}) {
  const [tab, setTab] = useState<"name" | "avatar">("name");
  const [nameInput, setNameInput] = useState(currentName);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    if (currentImage?.startsWith("avatar:")) return currentImage.slice(7);
    return "";
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const updateProfile = useUpdateProfile();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      showToast("error", "Name must be at least 2 characters.");
      return;
    }
    try {
      await updateProfile.mutateAsync({ name: nameInput.trim() });
      onSaved(nameInput.trim());
      showToast("success", "Name updated successfully!");
      setTimeout(onClose, 1200);
    } catch (e: any) {
      showToast("error", e?.message ?? "Failed to update name.");
    }
  };

  const handleSaveAvatar = async () => {
    try {
      await updateProfile.mutateAsync({ avatar: selectedAvatar });
      onSaved(currentName, selectedAvatar);
      showToast("success", "Avatar updated!");
      setTimeout(onClose, 1000);
    } catch (e: any) {
      showToast("error", e?.message ?? "Failed to update avatar.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: smoothEase }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <h3 className="font-display text-lg font-bold text-foreground">Edit Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          <button
            onClick={() => setTab("name")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "name"
                ? "bg-accent/15 text-accent-light border border-accent/25"
                : "text-foreground-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Change Name
          </button>
          <button
            onClick={() => setTab("avatar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "avatar"
                ? "bg-accent/15 text-accent-light border border-accent/25"
                : "text-foreground-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <SmilePlus className="w-3.5 h-3.5" /> Choose Avatar
          </button>
        </div>

        <div className="p-6 pt-4 space-y-4">
          <AnimatePresence mode="wait">
            {tab === "name" ? (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSaveName()}
                    maxLength={60}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/30 transition-all"
                    placeholder="Your display name"
                    autoFocus
                  />
                  <p className="text-[11px] text-foreground-subtle text-right">{nameInput.length}/60</p>
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={updateProfile.isPending || !nameInput.trim()}
                  className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-light transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Name
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-foreground-muted">Choose your learning buddy avatar:</p>
                <div className="grid grid-cols-3 gap-3">
                  {AVATAR_OPTIONS.map(av => (
                    <motion.button
                      key={av.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        selectedAvatar === av.id
                          ? "border-accent bg-accent/15 shadow-lg shadow-accent/20"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="text-3xl">{av.emoji}</span>
                      <span className="text-[11px] font-semibold text-foreground-muted">{av.label}</span>
                      {selectedAvatar === av.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-light absolute top-2 right-2" />
                      )}
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={handleSaveAvatar}
                  disabled={updateProfile.isPending || !selectedAvatar}
                  className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-light transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Avatar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                  toast.type === "success"
                    ? "bg-success/10 border-success/20 text-success"
                    : "bg-error/10 border-error/20 text-error"
                }`}
              >
                {toast.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Avatar Display component ─────────────────────────────────────────────
function AvatarDisplay({ image, name, size = "large" }: { image?: string | null; name: string; size?: "large" | "small" }) {
  const display = getAvatarDisplay(image, name);
  const sizeClass = size === "large" ? "w-24 h-24 text-4xl rounded-[2rem]" : "w-10 h-10 text-lg rounded-xl";
  return (
    <div className={`${sizeClass} bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-medium shadow-2xl border border-white/10`}>
      {display.type === "emoji" ? display.value : (
        <span className="text-white">{display.value}</span>
      )}
    </div>
  );
}

// ─── Teacher Profile ──────────────────────────────────────────────────────
function TeacherProfile({ name: initialName, email, image: initialImage }: { name: string; email: string; image?: string | null }) {
  const { data: stats } = useTeacherDashboard();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialName);
  const [displayImage, setDisplayImage] = useState(initialImage);

  const handleSaved = (name: string, avatar?: string) => {
    setDisplayName(name);
    if (avatar !== undefined) setDisplayImage(`avatar:${avatar}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Profile Hero */}
        <motion.div variants={itemVariants}>
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 left-8 w-48 h-48 bg-accent/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative flex-shrink-0 cursor-pointer group" onClick={() => setIsEditOpen(true)}>
                <AvatarDisplay image={displayImage} name={displayName} size="large" />
                <div className="absolute inset-0 rounded-[2rem] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <SmilePlus className="w-7 h-7 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">{displayName}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-light border border-accent/20 bg-accent/10 px-2.5 py-1 rounded-full">
                    Faculty
                  </span>
                </div>
                {email && <p className="text-sm font-medium text-foreground-subtle">{email}</p>}
              </div>

              <button
                onClick={() => setIsEditOpen(true)}
                className="w-full md:w-auto mt-4 md:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-foreground text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Academic Overview */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-4 ml-2">Academic Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <MiniStat title="Active Classes" value={stats?.classInfo?.length ?? 0} icon={<BookOpen className="w-5 h-5 text-indigo-400" />} />
            <MiniStat title="Total Students" value={stats?.totalStudents ?? 0} icon={<Users className="w-5 h-5 text-amber-400" />} />
            <MiniStat title="Assignments" value={stats?.activeAssignments ?? 0} icon={<FileText className="w-5 h-5 text-emerald-400" />} />
            <MiniStat title="Avg Completion" value={stats?.completionRate != null ? `${stats?.completionRate}%` : "—"} icon={<TrendingUp className="w-5 h-5 text-cyan-400" />} />
          </div>
        </motion.div>

      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <EditProfileModal
            currentName={displayName}
            currentImage={displayImage}
            onClose={() => setIsEditOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Student Profile ──────────────────────────────────────────────────────
function StudentProfile({ name: initialName, email, image: initialImage }: { name: string; email: string; image?: string | null }) {
  const { data: session } = useSession();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: submissions } = useSubmissionHistory();

  const [downloadingBadgeId, setDownloadingBadgeId] = useState<string | null>(null);
  const [downloadingLevel, setDownloadingLevel] = useState<number | null>(null);
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [displayName, setDisplayName] = useState(initialName);
  const [displayImage, setDisplayImage] = useState(initialImage);

  const [parentEmail, setParentEmail] = useState("");
  const [parentEnabled, setParentEnabled] = useState(false);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [testSentResult, setTestSentResult] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const saveParentSettings = useSaveParentSettings();
  const triggerParentReport = useTriggerParentReport();

  useEffect(() => {
    if (stats?.user) {
      setParentEmail((stats.user as any).parentEmail || "");
      setParentEnabled((stats.user as any).parentReportingEnabled || false);
      setFrequency((stats.user as any).parentReportFrequency || "WEEKLY");
    }
  }, [stats]);

  const showToast = (type: "success" | "error", msg: string, delay = 4000) => {
    setSaveToast({ type, msg });
    setTimeout(() => setSaveToast(null), delay);
  };

  const handleSaved = (name: string, avatar?: string) => {
    setDisplayName(name);
    if (avatar !== undefined) setDisplayImage(`avatar:${avatar}`);
  };

  const handleSaveSettings = async () => {
    setSaveToast(null);
    try {
      await saveParentSettings.mutateAsync({
        parentEmail: parentEmail || null,
        parentReportingEnabled: parentEnabled,
        parentReportFrequency: frequency,
      });
      showToast("success", t("profile.saveSuccess") || "Settings saved successfully!", 3500);
    } catch (err) {
      console.error(err);
      showToast("error", t("profile.saveFail") || "Failed to save settings. Please try again.");
    }
  };

  const handleSendTestReport = async () => {
    if (!parentEmail || !parentEnabled) {
      showToast("error", "Please specify a parent email and enable reporting first.");
      return;
    }
    setTestSentResult(null);
    try {
      const res = await triggerParentReport.mutateAsync();
      setTestSentResult(t("profile.testSuccess", { id: res.logId }) || "Test report sent successfully!");
    } catch (err) {
      console.error(err);
      showToast("error", t("profile.testFail") || "Failed to send test report.");
    }
  };

  const handleDownloadBadge = async (badgeId: string, badgeName: string) => {
    setDownloadingBadgeId(badgeId);
    setDownloadError(null);
    try {
      const token = (session?.user as any)?.token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/gamification/certificate/badge/${badgeId}`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      if (!res.ok) throw new Error("Failed to download certificate");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate_${badgeName.toLowerCase().replace(/ /g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setDownloadError("Could not download certificate. Please try again.");
      setTimeout(() => setDownloadError(null), 4000);
    } finally {
      setDownloadingBadgeId(null);
    }
  };

  const handleDownloadLevel = async (lvl: number) => {
    setDownloadingLevel(lvl);
    setDownloadError(null);
    try {
      const token = (session?.user as any)?.token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/gamification/certificate/level/${lvl}`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      if (!res.ok) throw new Error("Failed to download certificate");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate_level_${lvl}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setDownloadError("Could not download certificate. Please try again.");
      setTimeout(() => setDownloadError(null), 4000);
    } finally {
      setDownloadingLevel(null);
    }
  };

  const totalXP = stats?.xp.total ?? 0;
  const level = getLevel(totalXP);
  const xpStart = xpForLevel(level);
  const xpEnd = xpForLevel(level + 1);
  const progress = totalXP > 0 ? Math.round(((totalXP - xpStart) / (xpEnd - xpStart)) * 100) : 0;

  const submissionStats = useMemo(() => {
    if (!submissions) return { total: 0, graded: 0, avgScore: null as number | null };
    const graded = submissions.filter((s: any) => s.status === "GRADED");
    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((acc: number, s: any) => acc + (s.score ?? 0), 0) / graded.length)
      : null;
    return { total: submissions.length, graded: graded.length, avgScore };
  }, [submissions]);

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Profile Hero & Level Progress */}
        <motion.div variants={itemVariants}>
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 left-8 w-48 h-48 bg-accent/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar — click to change */}
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() => setIsEditOpen(true)}
                title="Change avatar"
              >
                <AvatarDisplay image={displayImage} name={displayName} size="large" />
                <div className="absolute inset-0 rounded-[2rem] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <SmilePlus className="w-7 h-7 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl font-medium tracking-tight text-foreground mb-1">{displayName}</h1>
                {email && <p className="text-sm font-medium text-foreground-subtle mb-4">{email}</p>}

                {/* Level Progress */}
                <div className="max-w-md">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground-muted mb-2">
                    <span>{t("profile.level")} {level}</span>
                    <span>{(xpEnd - totalXP).toLocaleString()} {t("profile.xp")} to {t("profile.level")} {level + 1}</span>
                  </div>
                  {statsLoading ? (
                    <div className="h-2 rounded-full bg-white/5 animate-pulse" />
                  ) : (
                    <div className="h-2 bg-surface-hover rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: smoothEase }}
                        className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full relative"
                      >
                        <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/30 to-transparent" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsEditOpen(true)}
                className="w-full md:w-auto mt-4 md:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-foreground text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {t("profile.edit")}
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-4 ml-2">{t("profile.statsTitle")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <MiniStat title={t("profile.statsAssignments")} value={submissionStats.total} icon={<BookOpen className="w-5 h-5 text-indigo-400" />} />
            <MiniStat title={t("profile.statsAvgScore")} value={submissionStats.avgScore != null ? `${submissionStats.avgScore}%` : "—"} icon={<Star className="w-5 h-5 text-amber-400" />} />
            <MiniStat title={t("profile.statsDayStreak")} value={stats?.streak.current ?? 0} icon={<Flame className="w-5 h-5 text-orange-400" />} />
            <MiniStat title={t("profile.statsTotalXP")} value={(stats?.xp.total ?? 0).toLocaleString()} icon={<Zap className="w-5 h-5 text-emerald-400" />} />
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <h2 className="text-base font-medium text-foreground tracking-wide">{t("profile.badges")}</h2>
              </div>
              <span className="text-xs font-medium text-foreground-subtle bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {t("profile.badgesTotal", { count: stats?.badges?.earned ?? 0 })}
              </span>
            </div>

            {downloadError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {downloadError}
              </div>
            )}

            {!stats?.badges?.items || stats.badges.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-foreground-subtle" />
                </div>
                <p className="text-sm font-medium text-foreground-subtle">{t("profile.badgesNone")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.badges.items.map((badge: any, i: number) => (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: smoothEase }}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-accent/20 transition-all text-center group [perspective:1000px] cursor-default"
                  >
                    <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(360deg)] group-hover:border-accent/30 shadow-lg select-none">
                      {badge.icon.startsWith('/') ? <img src={badge.icon} alt={badge.name} className="w-8 h-8 object-contain" /> : badge.icon || '🏅'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-0.5">{badge.name}</p>
                      <p className="text-[10px] text-foreground-subtle leading-tight px-2 mb-2">{badge.desc}</p>
                      <button
                        onClick={() => handleDownloadBadge(badge.id, badge.name)}
                        disabled={downloadingBadgeId === badge.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[10px] font-semibold text-accent-light hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                      >
                        {downloadingBadgeId === badge.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>Certificate</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Level Milestones */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-medium text-foreground tracking-wide">{t("profile.milestones")}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[2, 5, 10].map((milestoneLvl) => {
                const isReached = level >= milestoneLvl;
                return (
                  <div
                    key={milestoneLvl}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      isReached
                        ? "border-accent/20 bg-accent/5"
                        : "border-white/5 bg-white/[0.01] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isReached ? "bg-accent text-white" : "bg-white/5 text-foreground-muted"
                      }`}>
                        L{milestoneLvl}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t("profile.level")} {milestoneLvl} {t("profile.milestones")}</p>
                        <p className="text-[11px] text-foreground-subtle">
                          {isReached
                            ? t("profile.milestoneReached")
                            : t("profile.milestoneLocked", { current: level, required: milestoneLvl })}
                        </p>
                      </div>
                    </div>

                    {isReached ? (
                      <button
                        onClick={() => handleDownloadLevel(milestoneLvl)}
                        disabled={downloadingLevel === milestoneLvl}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-accent-light disabled:opacity-50"
                        title="Download Certificate"
                      >
                        {downloadingLevel === milestoneLvl ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <FileText className="w-4.5 h-4.5" />
                        )}
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-foreground-subtle">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Parent Reporting Card */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div
              className="flex items-center justify-between cursor-pointer group/header select-none"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-medium text-foreground tracking-wide group-hover/header:text-white transition-colors">
                  {t("profile.parentReporting")}
                </h2>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-foreground-subtle transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 max-w-xl mt-6 pt-4 border-t border-white/5"
              >
                {/* Opt-in toggle */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={parentEnabled}
                    onChange={(e) => setParentEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent-light focus:ring-accent-light/20 mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">
                      {t("profile.parentShare")}
                    </span>
                    <p className="text-[11px] text-foreground-subtle leading-normal mt-0.5">
                      {t("profile.parentShareSub")}
                    </p>
                  </div>
                </label>

                {parentEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-2"
                  >
                    {/* Parent Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
                        {t("profile.parentEmail")}
                      </label>
                      <input
                        type="email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] focus:bg-white/5 text-xs text-foreground focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Frequency select */}
                    <div>
                      <label className="block text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
                        {t("profile.parentFrequency")}
                      </label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] focus:bg-white/5 text-xs text-foreground focus:outline-none transition-colors appearance-none"
                      >
                        <option value="WEEKLY" className="bg-neutral-900 text-foreground">{t("profile.parentFreqWeekly")}</option>
                        <option value="MONTHLY" className="bg-neutral-900 text-foreground">{t("profile.parentFreqMonthly")}</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Toast Banner */}
                <AnimatePresence>
                  {saveToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                        saveToast.type === "success"
                          ? "bg-success/10 border-success/20 text-success"
                          : "bg-error/10 border-error/20 text-error"
                      }`}
                    >
                      {saveToast.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                      {saveToast.msg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Privacy note */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[11px] text-foreground-subtle leading-normal">
                  {t("profile.parentPrivacyNote")}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saveParentSettings.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {saveParentSettings.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{t("profile.saveSettings")}</span>
                  </button>

                  {parentEnabled && parentEmail && (
                    <button
                      onClick={handleSendTestReport}
                      disabled={triggerParentReport.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {triggerParentReport.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{t("profile.sendTestReport")}</span>
                    </button>
                  )}
                </div>

                {testSentResult && (
                  <div className="text-xs text-green-400 font-semibold p-3 rounded-xl border border-green-500/20 bg-green-500/5 mt-2">
                    {testSentResult}
                  </div>
                )}
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <EditProfileModal
            currentName={displayName}
            currentImage={displayImage}
            onClose={() => setIsEditOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const name = user?.name ?? (user?.role === "TEACHER" ? "Teacher" : "Student");
  const email = user?.email ?? "";
  const image = user?.image ?? null;

  return (
    <div className="min-h-screen relative selection:bg-accent/30">
      <GradientMesh className="opacity-40" />
      {user?.role === "TEACHER" ? (
        <TeacherProfile name={name} email={email} image={image} />
      ) : (
        <StudentProfile name={name} email={email} image={image} />
      )}
    </div>
  );
}