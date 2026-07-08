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
import { useTranslation } from "@web/context/language-context";
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

function getChallengeRedirectPath(action?: string): string {
  if (!action) return "/dashboard/tools";
  if (
    action === "Submit an assignment" ||
    action === "Achieve 90%+ on a graded assignment"
  ) {
    return "/dashboard/classroom";
  }
  if (action === "Check the scoreboard rankings") {
    return "/dashboard/scoreboard";
  }
  return "/dashboard/tools";
}

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

function getGreeting(t: any) {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.greetingMorning");
  if (hour < 17) return t("dashboard.greetingAfternoon");
  return t("dashboard.greetingEvening");
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
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

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

  const AVATAR_MAP: Record<string, { emoji?: string; image?: string; name: string }> = {
    "anime-boy": { image: "/avatars/anime-boy.png", name: "Gaming Boy" },
    "anime-girl": { image: "/avatars/anime-girl.png", name: "Anime Girl" },
    doge: { image: "/avatars/doge.png", name: "Doge Meme" },
    "sigma-chad": { image: "/avatars/sigma-chad.png", name: "Sigma Chad" },
    "gaming-noob": { image: "/avatars/gaming-noob.png", name: "Gaming Noob" },
    "banana-cat": { image: "/avatars/banana-cat.png", name: "Banana Cat" },
    robot: { image: "/avatars/gaming-noob.png", name: "Volt Robot" },
    lion: { image: "/avatars/sigma-chad.png", name: "Leo Lion" },
    panda: { image: "/avatars/banana-cat.png", name: "Pip Panda" },
    fox: { image: "/avatars/doge.png", name: "Foxy Fox" },
    unicorn: { image: "/avatars/anime-girl.png", name: "Spark Unicorn" },
    owl: { image: "/avatars/anime-boy.png", name: "Ollie Owl" },
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

  const [kidsMode, setKidsMode] = useState(false);

  useEffect(() => {
    const checkKidsMode = () => {
      const saved = localStorage.getItem("kids-mode");
      if (saved !== null) {
        setKidsMode(saved === "true");
      } else {
        setKidsMode(session?.user?.role === "STUDENT");
      }
    };
    checkKidsMode();
    const interval = setInterval(checkKidsMode, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const mascotGreeting = useMemo(() => {
    const greetings = [
      isHindi ? "अरे दोस्त! आज हम क्या नया सीखेंगे? 🌟" : "Hey adventurer! What magical things will we explore today? 🌟",
      isHindi ? "गलतियां केवल यह दर्शाती हैं कि आप कोशिश कर रहे हैं! 🧠" : "Mistakes just show that you are trying! Let's grow together! 🧠",
      isHindi ? "आप बहुत अच्छा कर रहे हैं! चलो क्लास का रिकॉर्ड तोड़ते हैं! 🚀" : "You are doing fantastic! Let's beat our high scores today! 🚀",
      isHindi ? "एआई टूल्स हमारी सुपरपावर हैं! चलो जादू शुरू करें! ⚡" : "AI tools are our superpowers! Let's create some magic! ⚡"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [isHindi]);

  if (status === "loading" || session?.user?.role === "TEACHER") {
    return null;
  }

  // Emojis and details for Kids Learning Worlds
  const kidsWorlds = [
    { name: isHindi ? "खजाना द्वीप" : "Treasure Island", subject: "Math", icon: "🏴‍☠️", desc: isHindi ? "गणित के पहेली नक्शे सुलझाएं!" : "Solve math puzzle maps & find gold!", color: "from-amber-300 via-yellow-400 to-orange-500", shadow: "shadow-amber-200/50 border-amber-300", path: "/dashboard/classroom?subject=math" },
    { name: isHindi ? "अंतरिक्ष अन्वेषक" : "Space Explorer", subject: "Science", icon: "🚀", desc: isHindi ? "ब्रह्मांड में उड़ें और नए ग्रह खोजें!" : "Blast into orbit and explore stars!", color: "from-sky-300 via-sky-400 to-indigo-500", shadow: "shadow-sky-200/50 border-sky-300", path: "/dashboard/classroom?subject=science" },
    { name: isHindi ? "कहानी का जंगल" : "Story Forest", subject: "English", icon: "🌲", desc: isHindi ? "बोलने वाले पेड़ों से मिलें और जादू लिखें!" : "Meet talking trees and write magic tales!", color: "from-emerald-300 via-green-400 to-teal-600", shadow: "shadow-emerald-200/50 border-emerald-300", path: "/dashboard/classroom?subject=english" },
    { name: isHindi ? "समय यात्रा" : "Time Travel", subject: "History", icon: "⏰", desc: isHindi ? "डायनासोर और राजाओं से बात करें!" : "Hop in the time machine and meet dinos!", color: "from-purple-300 via-purple-400 to-violet-500", shadow: "shadow-purple-200/50 border-purple-300", path: "/dashboard/classroom?subject=history" },
    { name: isHindi ? "दुनिया की सैर" : "Around the World", subject: "Geography", icon: "🗺️", desc: isHindi ? "बर्फ के पहाड़ों और विशाल महासागरों को पार करें!" : "Climb huge mountains and cross oceans!", color: "from-cyan-300 via-cyan-400 to-blue-500", shadow: "shadow-cyan-200/50 border-cyan-300", path: "/dashboard/classroom?subject=geography" },
    { name: isHindi ? "रोबोट फैक्टरी" : "Robot Factory", subject: "Coding", icon: "🤖", desc: isHindi ? "अपने खुद के ड्रोन्स और रोबोट्स बनाएं!" : "Code cool robots & command metal friends!", color: "from-rose-300 via-rose-400 to-red-500", shadow: "shadow-rose-200/50 border-rose-300", path: "/dashboard/classroom?subject=coding" }
  ];

  if (kidsMode) {
    return (
      <div className={"min-h-screen relative selection:bg-violet-300/40 pb-20 kids-mode " + gradeClass}>
        {/* Soft magical background blobs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-10 pb-24 px-4 md:px-8 pt-8 relative z-10 font-sans">
          
          {/* Magical Kid Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="kids-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-white overflow-hidden relative"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 z-10">
              {/* Interactive Mascot with jumping effect */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                onClick={() => {
                  sound.playLevelUp();
                }}
                className="w-20 h-20 rounded-[2rem] overflow-hidden flex items-center justify-center bg-gradient-to-br from-violet-200 to-violet-300 border-4 border-white shadow-xl cursor-pointer select-none active:scale-90 transition-transform"
                title="Click me for a surprise!"
              >
                {userAvatar.image ? (
                  <img src={userAvatar.image} alt={userAvatar.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{userAvatar.emoji}</span>
                )}
              </motion.div>

              {/* Speech bubble */}
              <div className="mascot-bubble max-w-md floating-element">
                <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                  {isHindi ? "नमस्ते" : "Hey there"}, {userName}! 👋
                </h1>
                <p className="text-sm font-bold text-gray-500 mt-1">
                  🤖 {userAvatar.name}: <span className="text-[#7c3aed]">{mascotGreeting}</span>
                </p>
              </div>
            </div>

            {/* Custom Interactive Action Buttons */}
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap z-10">
              <button
                onClick={() => {
                  setIsJoinOpen(true);
                  sound.playClick();
                }}
                className="kids-btn-primary px-6 py-4 text-white text-base h-14 flex items-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[3px]" />
                <span>{isHindi ? "गुप्त कोड दर्ज करें" : "Enter Secret Code"}</span>
              </button>

              <div className="kids-card px-5 py-3 h-14 flex items-center gap-3 bg-[#fdfcee]">
                <span className="text-2xl">🌟</span>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{isHindi ? "वर्तमान स्तर" : "LEVEL"}</p>
                  <p className="text-base font-black text-gray-700 leading-none">
                    {stats?.xp.level ?? 1} <span className="text-xs text-violet-500">({stats?.xp.total ?? 0} XP)</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Gamification Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              onClick={() => sound.playClick()}
              className="kids-card p-5 flex items-center gap-4 bg-yellow-50 border-yellow-200 cursor-pointer"
            >
              <span className="text-4xl">🏆</span>
              <div>
                <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">{isHindi ? "क्लास रैंक" : "RANK"}</p>
                <p className="text-xl font-black text-yellow-600">#{stats?.classRank ?? "—"}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              onClick={() => sound.playClick()}
              className="kids-card p-5 flex items-center gap-4 bg-cyan-50 border-cyan-200 cursor-pointer"
            >
              <span className="text-4xl">✨</span>
              <div>
                <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">{isHindi ? "पॉइंट्स" : "POINTS"}</p>
                <p className="text-xl font-black text-cyan-600">{stats?.xp.total ?? 0} ⭐</p>
              </div>
            </motion.div>
          </div>

          {/* Level Rainbow Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="kids-card p-6 bg-white"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">
                🚀 {isHindi ? "अगला माइलस्टोन" : "Next Milestone"}
              </h3>
              <span className="text-xs font-black text-[#7c3aed]">
                {stats?.xp.toNextLevel ?? 100} XP {isHindi ? "बाकी है" : "to go!"}
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1.5, ease: smoothEase }}
                className="h-full rounded-full xp-rainbow"
              />
            </div>
          </motion.div>

          {/* Learning Worlds Adventure Map - Large Cards */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗺️</span>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                {isHindi ? "लर्निंग एडवेंचर्स चुनें" : "Choose a Learning Adventure!"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {kidsWorlds.map((world, idx) => (
                <motion.div
                  key={idx}
                  onClick={() => {
                    sound.playClick();
                    router.push(world.path);
                  }}
                  whileHover={{ y: -8 }}
                  className={`world-card p-6 flex flex-col justify-between bg-gradient-to-br ${world.color} text-white shadow-xl ${world.shadow} group relative cursor-pointer`}
                >
                  <div className="absolute top-2 right-2 text-7xl opacity-10 group-hover:scale-125 transition-transform select-none">{world.icon}</div>
                  <div>
                    <span className="text-4xl block mb-4 filter drop-shadow-md">{world.icon}</span>
                    <h3 className="text-xl font-black tracking-tight">{world.name}</h3>
                    <span className="inline-block bg-white/20 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider mt-1.5 border border-white/10">
                      {world.subject}
                    </span>
                    <p className="text-xs text-white/90 font-medium mt-3 leading-relaxed">
                      {world.desc}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-[11px] font-black uppercase tracking-wider">{isHindi ? "शुरू करें →" : "Start Quest →"}</span>
                    <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                      ✨
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Daily Quest & Active Missions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Active Quests (Assignments) - Scroll style */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌲</span>
                <h2 className="text-xl font-black text-gray-800">{isHindi ? "मेरे सक्रिय मिशन" : "My Active Quests"}</h2>
              </div>

              <div className="kids-card p-6 bg-white space-y-4">
                {assignLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
                  </div>
                ) : activeAssignments.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <span className="text-5xl">🎉</span>
                    <p className="font-bold text-gray-500">{isHindi ? "सारे मिशन पूरे! आप बहुत बढ़िया हैं!" : "All catch up! You completed every quest!"}</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-gray-100 space-y-2">
                    {activeAssignments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          sound.playClick();
                          router.push(`/dashboard/classroom/${a.id}`);
                        }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between py-4 rounded-xl hover:bg-violet-50/50 px-2 transition-all gap-4 border-b border-transparent cursor-pointer"
                      >
                        <div>
                          <h4 className="font-bold text-gray-800 group-hover:text-violet-500 transition-colors">
                            ⚔️ {a.title}
                          </h4>
                          <p className="text-xs font-semibold text-gray-400 mt-1">
                            {a.className} • <span className="text-orange-500 font-extrabold">{getDaysUntilDue(a.dueDate)} {isHindi ? "दिन बाकी" : "days left"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-white bg-violet-400 px-3 py-1.5 rounded-full shadow-sm">
                            +{a.xpReward} ⭐
                          </span>
                          <span className="text-lg">➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Mission - Chest card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <h2 className="text-xl font-black text-gray-800">{isHindi ? "दैनिक चुनौती" : "Daily Challenge"}</h2>
              </div>

              <div className={`kids-card p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 relative overflow-hidden flex flex-col justify-between h-[300px] ${!challenge?.completed ? "pulse-border-accent" : ""}`}>
                <div className="absolute top-2 right-2 text-6xl opacity-10">🎁</div>
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-amber-600 bg-amber-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {challenge?.completed ? "Completed!" : "Active Quest!"}
                    </span>
                    <span className="text-xs font-bold text-amber-500">Resets: 12 AM</span>
                  </div>

                  <h3 className={`text-lg font-black leading-snug ${challenge?.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
                    🔑 {challenge?.action ?? "Try out a new AI tool"}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed">
                    {challenge?.completed
                      ? (isHindi ? "🎉 वोल्ट कहता है: \"क्या बात है! शानदार जीत!\"" : "🎉 Volt Bot: \"Incredible victory today! You did it!\"")
                      : (isHindi ? "🤖 वोल्ट कहता है: \"सुपर बोनस अर्जित करने के लिए इस चुनौती को पार करें!\"" : "🤖 Volt Bot: \"Conquer this challenge and claim your golden bonus!\"")}
                  </p>
                </div>

                <div className="pt-4 border-t border-amber-200/60 flex items-center justify-between mt-auto">
                  <span className="text-xl font-black text-amber-600">+{challenge?.xpAwarded ?? 50} XP ✨</span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      router.push(getChallengeRedirectPath(challenge?.action));
                    }}
                    className="kids-btn-primary px-4 py-2 text-xs font-extrabold shadow-sm bg-amber-500 border-amber-600 text-white"
                  >
                    {challenge?.completed ? "Explore More" : "Go! →"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Tools & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="kids-card p-6 bg-white">
              <h3 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2">
                <span>🤖</span> {isHindi ? "त्वरित एआई टूल्स" : "Quick AI Tools"}
              </h3>
              {!tools || tools.length === 0 ? (
                <EmptyState icon="🤖" message={isHindi ? "कोई टूल उपलब्ध नहीं है" : "No magical tools active"} />
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {quickTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => {
                        sound.playClick();
                        router.push(`/dashboard/tools/${tool.id}`);
                      }}
                      className="group flex flex-col items-center gap-2 p-2 rounded-2xl border-2 border-gray-100 hover:border-violet-200 hover:bg-violet-50/20 transition-all text-center cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md transition-transform group-hover:scale-110"
                        style={{ backgroundColor: tool.brandColor || "#7c3aed" }}
                      >
                        {tool.name[0]}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 truncate w-full">{tool.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="kids-card p-6 bg-white">
              <h3 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2">
                <span>🔔</span> {isHindi ? "हाल की जीतें" : "Recent Victories"}
              </h3>
              {recentActivity.length === 0 ? (
                <EmptyState icon="🔔" message={isHindi ? "अभी तक कोई जीत नहीं" : "No recent achievements recorded"} />
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <div>
                        <p className="text-xs font-bold text-gray-600">🏆 {item.label}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.time}</p>
                      </div>
                      <span className="text-xs font-black text-green-500">+{item.xp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Join Class secret code modal */}
        <AnimatePresence>
          {isJoinOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="kids-card p-8 bg-white max-w-md w-full relative overflow-hidden text-center"
              >
                <button
                  onClick={() => {
                    setIsJoinOpen(false);
                    setJoinError(undefined);
                    setJoinSuccess(undefined);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>

                <span className="text-5xl block mb-4 animate-bounce">🎈</span>
                <h3 className="text-xl font-black text-gray-800">{isHindi ? "एक नए Quest ग्रुप में शामिल हों!" : "Join a Quest Group!"}</h3>
                <p className="text-sm font-bold text-gray-400 mt-2">
                  {isHindi ? "अपने शिक्षक द्वारा दिया गया 6-अक्षर का गुप्त कोड दर्ज करें" : "Enter the 6-character secret code from your teacher"}
                </p>

                {joinError && (
                  <div className="my-4 p-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-500 text-xs font-bold">
                    ⚠️ {joinError}
                  </div>
                )}

                {joinSuccess ? (
                  <div className="py-6 space-y-2">
                    <span className="text-4xl block">✨🎉</span>
                    <p className="font-black text-gray-800">{joinSuccess}</p>
                  </div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="space-y-4 mt-6">
                    <input
                      type="text"
                      placeholder="CLASS CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      disabled={joinLoading}
                      required
                      className="w-full py-4 bg-gray-50 border-4 border-gray-100 rounded-2xl text-center font-mono text-3xl font-black uppercase tracking-wider focus:outline-none focus:border-violet-300 focus:bg-white text-gray-700 placeholder:text-gray-300"
                    />

                    <button
                      type="submit"
                      disabled={joinLoading || !joinCodeInput.trim()}
                      className="kids-btn-primary w-full py-4 text-base"
                    >
                      {joinLoading ? "Unlocking... 🔑" : "Unlock Quest! 🔑"}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Level Up Party Modal */}
        <AnimatePresence>
          {showLevelUp !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-yellow-400/90 z-50 flex flex-col items-center justify-center text-center p-6"
            >
              <ReactConfetti
                width={typeof window !== "undefined" ? window.innerWidth : 500}
                height={typeof window !== "undefined" ? window.innerHeight : 600}
                recycle={true}
                numberOfPieces={250}
              />
              <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="space-y-6 max-w-sm"
              >
                <div className="text-9xl animate-bounce">🏆⭐</div>
                <div className="space-y-2">
                  <h2 className="font-black text-5xl text-white tracking-tight drop-shadow-md">LEVEL UP!</h2>
                  <p className="text-2xl text-white font-extrabold drop-shadow-sm">
                    {isHindi ? `आप स्तर ${showLevelUp} पर पहुंच गए हैं!` : `You reached Level ${showLevelUp}!`}
                  </p>
                  <p className="text-sm text-yellow-900 font-bold leading-relaxed">
                    {isHindi ? "अद्भुत काम किया! नए एआई टूल्स का उपयोग करना और खजाने को जीतना जारी रखें।" : "Outstanding job! Keep exploring magical AI tools to rise to the top."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLevelUp(null);
                    sound.playClick();
                  }}
                  className="kids-btn-primary bg-white text-yellow-600 border-white px-8 py-4 font-black shadow-lg shadow-yellow-600/30 hover:scale-105 active:scale-95 text-base w-full"
                >
                  {isHindi ? "बहुत बढ़िया!" : "Awesome! Let's Go!"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Standard platform return fallback
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
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-accent/10 border border-accent/20 select-none mascot-emoji cursor-pointer"
              title={`${userAvatar.name} — click to wiggle!`}
            >
              {userAvatar.image ? (
                <img src={userAvatar.image} alt={userAvatar.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl md:text-6xl">{userAvatar.emoji}</span>
              )}
            </motion.div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {getGreeting(t)}, {userName}!
              </h1>
              <p className="text-sm text-foreground-subtle mt-1 flex items-center gap-1.5 flex-wrap">
                <span>{userAvatar.name} {isHindi ? "कहता है:" : "says:"}</span>
                <span className="text-accent-light font-bold">"{isHindi ? "अरे! चलो एआई सीखते हैं!" : "Hey! Let's learn AI!"}"</span>
                {stats?.user?.schoolName && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="text-foreground-muted">{stats.user.schoolName}</span>
                  </>
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="text-foreground-muted">{isHindi ? "कक्षा" : "Grade"} {stats?.user?.gradeLevel ?? gradeLevel}</span>
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
              <span>{isHindi ? "कक्षा में शामिल हों" : "Join Class"}</span>
            </button>

            <div className="flex items-center gap-4 bg-surface/30 backdrop-blur-xl border border-white/5 px-5 py-3 rounded-2xl shadow-xl h-14">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
                <Sparkles className="w-4 h-4 text-accent-light" />
              </div>
              <div>
                <p className="text-[10px] text-foreground-subtle font-medium uppercase tracking-wider mb-0.5">{isHindi ? "वर्तमान स्तर" : "Current Level"}</p>
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
                    {isHindi ? "अगला मील का पत्थर" : "Next Milestone"}
                  </h3>
                  <p className="text-2xl font-medium text-foreground">
                    {isHindi ? "स्तर" : "Level"} {stats?.xp.level ? stats.xp.level + 1 : 2}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-surface-hover border border-white/5 text-xs font-medium text-foreground-muted">
                  +{stats?.xp.thisWeek ?? 0} {isHindi ? "इस सप्ताह एक्सपी" : "XP this week"}
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
                  <span>{isHindi ? "प्रगति" : "Progress"}</span>
                  <span className="group-hover:text-accent-light transition-colors">
                    {stats?.xp.toNextLevel ?? 100} {isHindi ? "एक्सपी शेष (देखने के लिए क्लिक करें!)" : "XP remaining (Click to view!)"}
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
                      🏆 {isHindi ? `आप स्तर ${stats?.xp.level ? stats.xp.level + 1 : 2} से ${stats?.xp.toNextLevel ?? 100} एक्सपी दूर हैं!` : `You're ${stats?.xp.toNextLevel ?? 100} XP away from Level ${stats?.xp.level ? stats.xp.level + 1 : 2}!`}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-accent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>

          {/* Daily Mission Card - Span 4 */}
          <motion.div variants={itemVariants} className="md:col-span-4">
            <GlassCard className={`h-full relative overflow-hidden group ${!challenge?.completed ? "pulse-border-accent" : ""}`}>
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-subtle">{isHindi ? "आज का मिशन" : "Today's Mission"}</p>
                    {challenge?.completed ? (
                      <span className="text-[10px] font-bold text-success">{isHindi ? "✓ मिशन पूरा हुआ!" : "✓ Mission Complete!"}</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-warning flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {isHindi ? "आधी रात को रीसेट होगा" : "Resets at midnight"}
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
                  {challenge?.completed ? (isHindi ? "🌟 समाप्त!" : "🌟 Done!") : (isHindi ? "🔥 सक्रिय" : "🔥 Active")}
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
                      ? (isHindi ? "🎉 वोल्ट रोबोट कहता है: \"आज कमाल का काम किया! आप अजेय हैं!\"" : "🎉 Volt Robot says: \"Amazing work today! You're unstoppable!\"")
                      : (isHindi ? "🤖 वोल्ट रोबोट कहता है: \"दैनिक एक्सपी बोनस अर्जित करने के लिए इस मिशन को पूरा करें!\"" : "🤖 Volt Robot says: \"Complete this mission to earn your daily XP bonus!\"")}
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
                  href={getChallengeRedirectPath(challenge?.action)}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    challenge?.completed
                      ? "text-foreground-subtle"
                      : "text-accent-light hover:text-white hover:bg-accent/20"
                  }`}
                >
                  {challenge?.completed ? (isHindi ? "अधिक मिशन देखें" : "See more missions") : (isHindi ? "मिशन शुरू करें →" : "Start Mission →")}
                </a>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="md:col-span-12 cursor-pointer"
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
                <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">{isHindi ? "कक्षा रैंक" : "Class Rank"}</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  #{stats?.classRank ?? "—"}
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
                  <h2 className="text-base font-medium text-foreground tracking-wide">{isHindi ? "सक्रिय असाइनमेंट" : "Active Assignments"}</h2>
                </div>
                <a href="/dashboard/classroom" className="text-xs font-medium text-foreground-subtle hover:text-foreground transition-colors flex items-center gap-1">
                  {isHindi ? "सभी देखें" : "View all"} <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              {assignLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
                </div>
              ) : activeAssignments.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="w-6 h-6 text-foreground-subtle" />} message={isHindi ? "सब पूरा हो गया। कोई लंबित असाइनमेंट नहीं।" : "All caught up. No pending assignments."} />
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
                    <h2 className="text-base font-medium text-foreground tracking-wide">{isHindi ? "मेरी कक्षाएं" : "My Classes"}</h2>
                  </div>
                </div>

                {!stats?.classes || stats.classes.length === 0 ? (
                  <EmptyState icon={<BookOpen className="w-5 h-5 text-foreground-subtle" />} message={isHindi ? "आप अभी तक किसी भी कक्षा में शामिल नहीं हुए हैं।" : "You haven't joined any classes yet."} />
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
                    <h2 className="text-base font-medium text-foreground tracking-wide">{isHindi ? "त्वरित टूल्स" : "Quick Tools"}</h2>
                  </div>
                </div>

                {!tools || tools.length === 0 ? (
                  <EmptyState icon={<LayoutGrid className="w-5 h-5 text-foreground-subtle" />} message={isHindi ? "अभी तक किसी टूल का उपयोग नहीं किया गया।" : "No tools accessed yet."} />
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
                    <h2 className="text-base font-medium text-foreground tracking-wide">{isHindi ? "गतिविधि" : "Activity"}</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Activity className="w-8 h-8 text-foreground-subtle mb-2 opacity-50" />
                      <p className="text-xs font-medium text-foreground-subtle">{isHindi ? "कोई हाल की गतिविधि लॉग नहीं की गई।" : "No recent activity logged."}</p>
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
                  Enter the 6-character class code (OTP) provided by your teacher
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
                      placeholder="CLASS CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      disabled={joinLoading}
                      required
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-center font-mono text-2xl font-bold tracking-[0.4em] uppercase focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all placeholder:text-white/20 text-foreground"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joinLoading || !joinCodeInput.trim()}
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
                <h2 className="text-gradient font-display text-4xl font-extrabold tracking-tight">{isHindi ? "स्तर बढ़ा!" : "LEVEL UP!"}</h2>
                <p className="text-lg text-white font-semibold">{isHindi ? `आप स्तर ${showLevelUp} पर पहुंच गए हैं!` : `You reached Level ${showLevelUp}!`}</p>
                <p className="text-sm text-foreground-subtle leading-relaxed">
                  {isHindi ? "उत्कृष्ट कार्य! शीर्ष पर पहुंचने के लिए एआई टूल्स का उपयोग करना और असाइनमेंट पूरा करना जारी रखें।" : "Outstanding job! Keep using AI tools and finishing assignments to rise to the top."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLevelUp(null);
                  sound.playClick();
                }}
                className="px-6 py-3 rounded-2xl bg-accent text-white font-bold hover:bg-accent-light shadow-lg shadow-accent/25 transition-all text-sm w-full"
              >
                {isHindi ? "बहुत बढ़िया!" : "Awesome!"}
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
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

  return (
    <a href={`/dashboard/classroom/${assignment.id}`} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 -mx-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 gap-4">
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium text-foreground group-hover:text-accent-light transition-colors duration-300 truncate mb-1.5">
          {assignment.title}
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-foreground-muted">{assignment.className}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span className={`text-[11px] font-medium ${isUrgent ? 'text-error/90' : 'text-foreground-subtle'}`}>
            {daysUntilDue === 0 ? (isHindi ? "आज देय" : "Due today") : (isHindi ? `${daysUntilDue} दिन शेष` : `${daysUntilDue} days left`)}
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