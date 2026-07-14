"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAssignmentList } from "@web/hooks/use-classroom";
import { useDashboardStats } from "@web/hooks/use-dashboard";
import { useTranslation } from "@web/context/language-context";
import { GradientMesh } from "@web/components/ui/background";
import { sound } from "@web/lib/audio";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Zap,
  Calendar,
  Filter,
  ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type Tab = "all" | "active" | "completed" | "overdue";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

// ─── Sophisticated Motion Variants ──────────────────────────────────────

const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: smoothEase },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.3, ease: smoothEase },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function getDaysLeft(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function dueBadgeStyle(days: number, isCompleted: boolean) {
  if (isCompleted) return "bg-success/10 border-success/20 text-success";
  if (days < 0) return "bg-error/10 border-error/20 text-error";
  if (days === 0) return "bg-error/10 border-error/20 text-error";
  if (days <= 2) return "bg-warning/10 border-warning/20 text-warning";
  return "bg-white/5 border-white/10 text-foreground-subtle";
}

function dueBadgeLabel(days: number, isCompleted: boolean, isHindi: boolean) {
  if (isCompleted) return isHindi ? "पूर्ण" : "Completed";
  if (days < 0)
    return isHindi
      ? `${Math.abs(days)} दिन देरी`
      : `${Math.abs(days)}d overdue`;
  if (days === 0) return isHindi ? "आज देय" : "Due today";
  if (days === 1) return isHindi ? "कल देय" : "Due tomorrow";
  return isHindi ? `${days} दिन बचे हैं` : `${days} days left`;
}

interface PracticeQuest {
  title: string;
  desc: string;
  toolName: string;
  toolId: string;
  icon: string;
  color: string;
  xp: number;
}

function getPracticeQuests(
  subject: string | null,
  isHindi: boolean,
): PracticeQuest[] {
  const subLower = subject?.toLowerCase() || "";

  if (subLower === "math" || subLower === "mathematics") {
    return [
      {
        title: isHindi
          ? "द्विघात समीकरण सूत्र चरण-दर-चरण समझें"
          : "Explain the quadratic formula step by step",
        desc: isHindi
          ? "वक्र पैराबोला के रहस्यों को अनलॉक करें"
          : "Unlock the secret key to parabola curves",
        toolName: "ChatGPT",
        toolId: "1",
        icon: "📐",
        color: "#10a37f",
        xp: 50,
      },
      {
        title: isHindi
          ? "परिमेय और अपरिमेय संख्याएं समझें"
          : "Understand rational and irrational numbers",
        desc: isHindi
          ? "संख्याओं के बीच के अंतर हल करें"
          : "Solve differences between numbers",
        toolName: "Claude",
        toolId: "6",
        icon: "🔢",
        color: "#d97706",
        xp: 40,
      },
      {
        title: isHindi
          ? "त्रिकोणमिति की मूल बातें"
          : "Help me understand trigonometry basics",
        desc: isHindi
          ? "त्रिभुज गणनाओं का अभ्यास करें"
          : "Practice triangle calculations and ratios",
        toolName: "ChatGPT",
        toolId: "1",
        icon: "🔺",
        color: "#10a37f",
        xp: 45,
      },
    ];
  }
  if (subLower === "science") {
    return [
      {
        title: isHindi
          ? "प्रकाश संश्लेषण सौर ऊर्जा को कैसे परिवर्तित करता है?"
          : "How does photosynthesis convert solar energy?",
        desc: isHindi
          ? "जानें कि पत्तियां प्रकाश से भोजन कैसे बनाती हैं"
          : "Discover how leaves cook food with light",
        toolName: "ChatGPT",
        toolId: "1",
        icon: "🌱",
        color: "#10a37f",
        xp: 50,
      },
      {
        title: isHindi
          ? "माइटोसिस और मियोसिस में अंतर समझें"
          : "Explain the difference between mitosis and meiosis",
        desc: isHindi
          ? "सीखें कि सूक्ष्म कोशिकाएं कैसे विभाजित होती हैं"
          : "Learn how microscopic cells multiply",
        toolName: "Claude",
        toolId: "6",
        icon: "🔬",
        color: "#d97706",
        xp: 45,
      },
      {
        title: isHindi
          ? "परमाणु की संरचना क्या है?"
          : "What is the structure of an atom?",
        desc: isHindi
          ? "प्रोटॉन, न्यूट्रॉन और इलेक्ट्रॉन्स के बारे में जानें"
          : "Zoom into protons, neutrons, and electrons",
        toolName: "Perplexity AI",
        toolId: "5",
        icon: "⚛️",
        color: "#20b2aa",
        xp: 50,
      },
    ];
  }
  if (subLower === "english") {
    return [
      {
        title: isHindi
          ? "रूपक और उपमा: भाषा के रूप"
          : "Metaphor vs Simile: figures of speech",
        desc: isHindi
          ? "अपने लेखन में सुंदर भावनाएं भरें"
          : "Breathe life into your writing",
        toolName: "Grammarly",
        toolId: "4",
        icon: "📝",
        color: "#15c39a",
        xp: 40,
      },
      {
        title: isHindi
          ? "शेक्सपियर द्वारा रोमियो और जूलियट के विषय"
          : "Themes in Romeo and Juliet by Shakespeare",
        desc: isHindi
          ? "प्राचीन परिवारों की त्रासदी का विश्लेषण करें"
          : "Analyze the tragedy of ancient families",
        toolName: "Claude",
        toolId: "6",
        icon: "📖",
        color: "#d97706",
        xp: 50,
      },
      {
        title: isHindi
          ? "एक प्रभावशाली निबंध थीसिस कैसे लिखें?"
          : "How do I write a persuasive essay thesis?",
        desc: isHindi
          ? "रूपरेखा बिंदु और सारांश तैयार करें"
          : "Draft outline points and summaries",
        toolName: "QuillBot",
        toolId: "9",
        icon: "✍️",
        color: "#4CAF50",
        xp: 45,
      },
    ];
  }
  if (subLower === "history") {
    return [
      {
        title: isHindi
          ? "पश्चिमी रोमन साम्राज्य का पतन क्यों हुआ?"
          : "Why fell the Western Roman Empire?",
        desc: isHindi
          ? "ऐतिहासिक गिरावट के प्रमुख कारणों का पता लगाएं"
          : "Trace key events of historical collapse",
        toolName: "Claude",
        toolId: "6",
        icon: "🏛️",
        color: "#d97706",
        xp: 50,
      },
      {
        title: isHindi
          ? "प्रथम विश्व युद्ध के प्रमुख घटनाक्रम और सारांश"
          : "Key events and summaries of World War I",
        desc: isHindi
          ? "महान युद्ध की कालानुक्रमिक समीक्षा करें"
          : "Chronological feed review of the great war",
        toolName: "Perplexity AI",
        toolId: "5",
        icon: "⚔️",
        color: "#20b2aa",
        xp: 50,
      },
      {
        title: isHindi
          ? "मैग्ना कार्टा क्यों महत्वपूर्ण था?"
          : "Why was the Magna Carta important?",
        desc: isHindi
          ? "शैक्षणिक स्वतंत्रता और अधिकारों का अध्ययन करें"
          : "Study rules of academic freedom and rights",
        toolName: "ChatGPT",
        toolId: "1",
        icon: "📜",
        color: "#10a37f",
        xp: 45,
      },
    ];
  }
  if (subLower === "geography") {
    return [
      {
        title: isHindi
          ? "महाद्वीपों और प्रमुख महासागरों का मानचित्र बनाएं"
          : "Map the continents and major oceans",
        desc: isHindi
          ? "स्थान और निर्देशांक पहचानें"
          : "Identify coordinates and maps",
        toolName: "ChatGPT",
        toolId: "1",
        icon: "🗺️",
        color: "#10a37f",
        xp: 40,
      },
      {
        title: isHindi
          ? "ऊंची पर्वत श्रृंखलाएं कैसे बनती हैं?"
          : "How are high mountain ranges formed?",
        desc: isHindi
          ? "टेक्टोनिक प्लेटों के खिसकने के बारे में जानें"
          : "Learn about tectonic plates shift",
        toolName: "Claude",
        toolId: "6",
        icon: "🏔️",
        color: "#d97706",
        xp: 45,
      },
      {
        title: isHindi
          ? "अक्षांश और देशांतर रेखाओं को समझना"
          : "Understanding latitude and longitude lines",
        desc: isHindi
          ? "जानें कि ग्रिड निर्देशांक कैसे काम करते हैं"
          : "Discover how grid coordinates work",
        toolName: "Perplexity AI",
        toolId: "5",
        icon: "🌐",
        color: "#20b2aa",
        xp: 45,
      },
    ];
  }
  // Coding / Robot Factory default fallback
  return [
    {
      title: isHindi
        ? "बाइनरी सर्च एल्गोरिदम कैसे काम करता है?"
        : "Explain how a binary search algorithm works",
      desc: isHindi
        ? "खोज क्षेत्र को आधा करने वाले लूप लिखें"
        : "Write search loops that cut search area in half",
      toolName: "GitHub Copilot",
      toolId: "2",
      icon: "🤖",
      color: "#1b1f24",
      xp: 50,
    },
    {
      title: isHindi
        ? "स्टैक और क्यू के बीच क्या अंतर है?"
        : "What is the difference between a stack and a queue?",
      desc: isHindi
        ? "अनुक्रम सरणियों और अनुक्रमणिकाओं को प्रबंधित करें"
        : "Manage sequence arrays and indexes",
      toolName: "Replit",
      toolId: "7",
      icon: "⚙️",
      color: "#f26207",
      xp: 45,
    },
    {
      title: isHindi
        ? "एसिंक्रोनस प्रोग्रामिंग कैसे काम करती है?"
        : "How does asynchronous programming work?",
      desc: isHindi
        ? "एसिंक्रोनस देरी और एपीआई कॉल लिखें"
        : "Write asynchronous delays and API calls",
      toolName: "GitHub Copilot",
      toolId: "2",
      icon: "⚡",
      color: "#1b1f24",
      xp: 50,
    },
  ];
}

// ─── Premium UI Sub-components ────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

  const messages: Record<
    Tab,
    { title: string; desc: string; icon: React.ElementType }
  > = {
    all: {
      title: isHindi ? "अभी तक कोई असाइनमेंट नहीं" : "No assignments yet",
      desc: isHindi
        ? "आपके शिक्षक ने अभी तक कोई असाइनमेंट पोस्ट नहीं किया है। जल्द ही वापस जाँचें!"
        : "Your teacher hasn't posted any assignments. Check back soon!",
      icon: BookOpen,
    },
    active: {
      title: isHindi ? "सब पूरा हो गया!" : "All caught up!",
      desc: isHindi
        ? "आपके पास अभी कोई सक्रिय असाइनमेंट नहीं है। बहुत बढ़िया!"
        : "You have no active assignments right now. Great work!",
      icon: CheckCircle2,
    },
    completed: {
      title: isHindi ? "अभी तक कोई सबमिशन नहीं" : "No submissions yet",
      desc: isHindi
        ? "इसे यहाँ देखने के लिए अपना पहला असाइनमेंट पूरा करें।"
        : "Complete your first assignment to see it here.",
      icon: Zap,
    },
    overdue: {
      title: isHindi
        ? "कोई देरी वाला असाइनमेंट नहीं"
        : "No overdue assignments",
      desc: isHindi
        ? "आप हर चीज़ में सबसे आगे हैं। इसे बनाए रखें!"
        : "You're on top of everything. Keep it up!",
      icon: CheckCircle2,
    },
  };
  const { title, desc, icon: Icon } = messages[tab];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: smoothEase }}
      className="flex flex-col items-center justify-center py-20 text-center bg-surface/30 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-xl mt-4"
    >
      <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 border border-white/5 flex items-center justify-center mb-5 shadow-inner">
        <Icon className="w-10 h-10 text-foreground-subtle opacity-50" />
      </div>
      <p className="font-display text-xl font-medium tracking-tight text-foreground mb-2">
        {title}
      </p>
      <p className="text-sm font-medium text-foreground-subtle max-w-sm">
        {desc}
      </p>
    </motion.div>
  );
}

function AssignmentCard({ assignment }: { assignment: any }) {
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

  const isCompleted =
    assignment.submissions && assignment.submissions.length > 0;
  const days = getDaysLeft(assignment.dueDate);
  const badgeStyle = dueBadgeStyle(days, isCompleted);
  const badgeLabel = dueBadgeLabel(days, isCompleted, isHindi);
  const toolColor =
    assignment.suggestedTool?.brandColor || "var(--color-accent)";

  return (
    <motion.a
      variants={itemVariants}
      layout
      href={`/dashboard/classroom/${assignment.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 rounded-[1.5rem] border border-white/5 bg-surface/40 backdrop-blur-xl hover:bg-white/10 hover:border-white/10 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] transition-all duration-500 gap-4 relative overflow-hidden"
    >
      <div className="flex items-start sm:items-center gap-4 md:gap-5 flex-1 min-w-0 z-10">
        {/* Tool badge / Icon */}
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-inner border border-black/10 transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundColor: toolColor }}
        >
          {assignment.suggestedTool?.name?.[0] ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col mb-2">
            <h3 className="text-base md:text-lg font-medium text-foreground group-hover:text-accent-light transition-colors duration-300 truncate">
              {assignment.title}
            </h3>
            <p className="text-xs font-medium text-foreground-subtle mt-0.5 truncate">
              {assignment.className}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 mt-2">
            {/* Due Date Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${badgeStyle}`}
            >
              {badgeLabel}
            </span>

            {/* Suggested Tool Badge */}
            {assignment.suggestedTool && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm"
                style={{
                  backgroundColor: `${toolColor}15`,
                  color: toolColor,
                  border: `1px solid ${toolColor}25`,
                }}
              >
                {assignment.suggestedTool.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: XP & Status */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t border-white/5 sm:border-t-0 pt-4 sm:pt-0 z-10 w-full sm:w-auto">
        <span className="text-sm font-black text-success bg-success/10 px-3 py-1 rounded-xl border border-success/20 whitespace-nowrap">
          +{assignment.xpReward} XP
        </span>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-success mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isHindi ? "प्रस्तुत" : "Submitted"}
            {assignment.submissions[0]?.score != null && (
              <span className="text-foreground-muted ml-1 lowercase tracking-normal">
                ({assignment.submissions[0].score}%)
              </span>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/10 transition-all duration-300 mt-1 hidden sm:flex">
            <ArrowUpRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
          </div>
        )}
      </div>
    </motion.a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

function ClassroomPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const searchParams = useSearchParams();
  const router = useRouter();
  const classIdParam = searchParams.get("classId");
  const subjectParam = searchParams.get("subject");

  const { data: stats } = useDashboardStats();
  const { data: assignments, isLoading } = useAssignmentList();
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

  const [kidsMode, setKidsMode] = useState(false);

  useEffect(() => {
    const checkKidsMode = () => {
      const saved = localStorage.getItem("kids-mode");
      if (saved !== null) {
        setKidsMode(saved === "true");
      }
    };
    checkKidsMode();
    const interval = setInterval(checkKidsMode, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabLabels: Record<Tab, string> = {
    all: isHindi ? "सभी" : "All",
    active: isHindi ? "सक्रिय" : "Active",
    completed: isHindi ? "पूरे किए गए" : "Completed",
    overdue: isHindi ? "देरी वाले" : "Overdue",
  };

  const filtered = useMemo(() => {
    if (!assignments) return [];

    // Apply class filter
    let base = assignments;
    if (classIdParam) {
      base = assignments.filter((a) => a.classId === classIdParam);
    }

    // Apply subject filter
    if (subjectParam) {
      const subLower = subjectParam.toLowerCase();
      base = base.filter((a) => {
        const toolSubjects =
          a.suggestedTool?.subjects?.map((s: string) => s.toLowerCase()) || [];
        const toolCategory = a.suggestedTool?.category?.toLowerCase() || "";

        if (subLower === "math" || subLower === "mathematics") {
          return (
            toolSubjects.includes("math") ||
            toolSubjects.includes("mathematics") ||
            a.title.toLowerCase().includes("math") ||
            a.description.toLowerCase().includes("math")
          );
        }
        if (subLower === "science") {
          return (
            toolSubjects.includes("science") ||
            toolCategory.includes("research") ||
            a.title.toLowerCase().includes("science") ||
            a.title.toLowerCase().includes("physic") ||
            a.title.toLowerCase().includes("chem") ||
            a.title.toLowerCase().includes("bio") ||
            a.description.toLowerCase().includes("science")
          );
        }
        if (subLower === "english") {
          return (
            toolSubjects.includes("english") ||
            toolSubjects.includes("writing") ||
            toolCategory.includes("writing") ||
            a.title.toLowerCase().includes("english") ||
            a.title.toLowerCase().includes("story") ||
            a.title.toLowerCase().includes("write") ||
            a.description.toLowerCase().includes("english")
          );
        }
        if (subLower === "history") {
          return (
            toolSubjects.includes("history") ||
            toolSubjects.includes("social") ||
            a.title.toLowerCase().includes("history") ||
            a.title.toLowerCase().includes("dino") ||
            a.description.toLowerCase().includes("history")
          );
        }
        if (subLower === "geography") {
          return (
            toolSubjects.includes("geography") ||
            toolSubjects.includes("map") ||
            a.title.toLowerCase().includes("geography") ||
            a.title.toLowerCase().includes("mountain") ||
            a.title.toLowerCase().includes("ocean") ||
            a.description.toLowerCase().includes("geography")
          );
        }
        if (
          subLower === "coding" ||
          subLower === "computer science" ||
          subLower === "code"
        ) {
          return (
            toolSubjects.includes("coding") ||
            toolSubjects.includes("computer science") ||
            toolCategory.includes("code") ||
            a.title.toLowerCase().includes("code") ||
            a.title.toLowerCase().includes("robot") ||
            a.description.toLowerCase().includes("code")
          );
        }
        return true;
      });
    }

    const now = new Date();
    switch (activeTab) {
      case "active":
        return base.filter((a) => {
          const due = new Date(a.dueDate);
          return (!a.submissions || a.submissions.length === 0) && due >= now;
        });
      case "completed":
        return base.filter((a) => a.submissions && a.submissions.length > 0);
      case "overdue":
        return base.filter((a) => {
          const due = new Date(a.dueDate);
          return (!a.submissions || a.submissions.length === 0) && due < now;
        });
      default:
        return base;
    }
  }, [assignments, activeTab, classIdParam, subjectParam]);

  const counts = useMemo(() => {
    if (!assignments) return { all: 0, active: 0, completed: 0, overdue: 0 };

    // Apply class filter
    let base = assignments;
    if (classIdParam) {
      base = assignments.filter((a) => a.classId === classIdParam);
    }

    // Apply subject filter
    if (subjectParam) {
      const subLower = subjectParam.toLowerCase();
      base = base.filter((a) => {
        const toolSubjects =
          a.suggestedTool?.subjects?.map((s: string) => s.toLowerCase()) || [];
        const toolCategory = a.suggestedTool?.category?.toLowerCase() || "";

        if (subLower === "math" || subLower === "mathematics") {
          return (
            toolSubjects.includes("math") ||
            toolSubjects.includes("mathematics") ||
            a.title.toLowerCase().includes("math") ||
            a.description.toLowerCase().includes("math")
          );
        }
        if (subLower === "science") {
          return (
            toolSubjects.includes("science") ||
            toolCategory.includes("research") ||
            a.title.toLowerCase().includes("science") ||
            a.title.toLowerCase().includes("physic") ||
            a.title.toLowerCase().includes("chem") ||
            a.title.toLowerCase().includes("bio") ||
            a.description.toLowerCase().includes("science")
          );
        }
        if (subLower === "english") {
          return (
            toolSubjects.includes("english") ||
            toolSubjects.includes("writing") ||
            toolCategory.includes("writing") ||
            a.title.toLowerCase().includes("english") ||
            a.title.toLowerCase().includes("story") ||
            a.title.toLowerCase().includes("write") ||
            a.description.toLowerCase().includes("english")
          );
        }
        if (subLower === "history") {
          return (
            toolSubjects.includes("history") ||
            toolSubjects.includes("social") ||
            a.title.toLowerCase().includes("history") ||
            a.title.toLowerCase().includes("dino") ||
            a.description.toLowerCase().includes("history")
          );
        }
        if (subLower === "geography") {
          return (
            toolSubjects.includes("geography") ||
            toolSubjects.includes("map") ||
            a.title.toLowerCase().includes("geography") ||
            a.title.toLowerCase().includes("mountain") ||
            a.title.toLowerCase().includes("ocean") ||
            a.description.toLowerCase().includes("geography")
          );
        }
        if (
          subLower === "coding" ||
          subLower === "computer science" ||
          subLower === "code"
        ) {
          return (
            toolSubjects.includes("coding") ||
            toolSubjects.includes("computer science") ||
            toolCategory.includes("code") ||
            a.title.toLowerCase().includes("code") ||
            a.title.toLowerCase().includes("robot") ||
            a.description.toLowerCase().includes("code")
          );
        }
        return true;
      });
    }

    const now = new Date();
    return {
      all: base.length,
      active: base.filter(
        (a) =>
          (!a.submissions || !a.submissions.length) &&
          new Date(a.dueDate) >= now,
      ).length,
      completed: base.filter((a) => a.submissions && a.submissions.length > 0)
        .length,
      overdue: base.filter(
        (a) =>
          (!a.submissions || !a.submissions.length) &&
          new Date(a.dueDate) < now,
      ).length,
    };
  }, [assignments, classIdParam, subjectParam]);

  if (kidsMode) {
    return (
      <div className="min-h-screen relative selection:bg-violet-300/40 pb-20 bg-[#fefdf8] kids-mode font-sans">
        <div className="max-w-5xl mx-auto pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">
          {/* Kids Mode Mascot Bubble */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="kids-card p-5 bg-white flex flex-col sm:flex-row items-center gap-4 border-2 border-violet-100 mb-8"
          >
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-3xl select-none animate-bounce">
              🌲
            </div>
            <div className="mascot-bubble border-violet-200">
              <p className="text-sm font-bold text-gray-600">
                🎉 Volt Bot says:{" "}
                <span className="text-[#7c3aed]">
                  "🏆 Welcome to your Quests Room! Let's choose an active
                  mission and win some stars! 🌟"
                </span>
              </p>
            </div>
          </motion.div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              ⚔️{" "}
              {subjectParam
                ? `${subjectParam.charAt(0).toUpperCase() + subjectParam.slice(1)} Quests`
                : isHindi
                  ? "मेरे सक्रिय मिशन"
                  : "My Active Quests"}
            </h1>
            <a
              href="/dashboard/student"
              onClick={() => sound.playClick()}
              className="kids-btn-primary px-5 py-3 text-xs font-black bg-violet-400 border-violet-500 text-white shadow-sm flex items-center gap-1.5 animate-bounce-gentle"
            >
              🏰 Back to Kingdom
            </a>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    sound.playClick();
                  }}
                  className={`px-5 py-3 rounded-full text-xs font-black border-2 transition-all ${
                    active
                      ? "bg-violet-400 border-violet-500 text-white shadow-md shadow-violet-200/50 scale-105"
                      : "bg-white border-gray-100 hover:border-violet-200 text-gray-500"
                  }`}
                >
                  {tabLabels[tab.key]} ({counts[tab.key]})
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="space-y-6 animate-fade-in">
                {/* Practice Quests List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-gray-700 mt-8 flex items-center gap-2">
                    <span>🌟</span>{" "}
                    {isHindi
                      ? "अभ्यास मिशन (ट्रेनिंग मोड)"
                      : "Practice Quests (Training Mode)"}
                  </h3>

                  {getPracticeQuests(subjectParam, isHindi).map(
                    (quest, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          sound.playClick();
                          router.push(`/dashboard/tools/${quest.toolId}`);
                        }}
                        className="kids-card p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-gray-100 hover:border-violet-200 hover:shadow-md transition-all gap-4 relative overflow-hidden group cursor-pointer"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md"
                            style={{ backgroundColor: quest.color }}
                          >
                            {quest.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-black text-gray-800 truncate group-hover:text-violet-500 transition-colors">
                              ⚔️ {quest.title}
                            </h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">
                              {quest.desc} •{" "}
                              <span className="text-violet-500 font-extrabold">
                                {isHindi ? "एआई टूल: " : "AI Tool: "}
                                {quest.toolName}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-white bg-violet-400 px-3 py-1.5 rounded-full shadow-sm">
                            +{quest.xp} ⭐
                          </span>
                          <span className="text-lg">➔</span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((assignment) => {
                  const isCompleted =
                    assignment.submissions && assignment.submissions.length > 0;
                  const days = getDaysLeft(assignment.dueDate);
                  const badgeStyle = dueBadgeStyle(days, isCompleted);
                  const badgeLabel = dueBadgeLabel(days, isCompleted, isHindi);
                  const toolColor =
                    assignment.suggestedTool?.brandColor || "#7c3aed";

                  return (
                    <motion.a
                      key={assignment.id}
                      layout
                      href={`/dashboard/classroom/${assignment.id}`}
                      className="kids-card p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-gray-100 hover:border-violet-200 hover:shadow-md transition-all gap-4 relative overflow-hidden group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md"
                          style={{ backgroundColor: toolColor }}
                        >
                          {assignment.suggestedTool?.name?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-gray-800 truncate group-hover:text-violet-500 transition-colors">
                            ⚔️ {assignment.title}
                          </h3>
                          <p className="text-xs font-bold text-gray-400 mt-1">
                            {assignment.className} •{" "}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeStyle}`}
                            >
                              {badgeLabel}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-white bg-violet-400 px-3 py-1.5 rounded-full shadow-sm">
                          +{assignment.xpReward} ⭐
                        </span>
                        <span className="text-lg">➔</span>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative selection:bg-accent/30">
      <GradientMesh className="opacity-40" />

      <div className="max-w-5xl mx-auto pb-24 lg:pb-12 px-4 md:px-8 pt-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-accent/20 to-purple-500/10 border border-accent/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <BookOpen className="w-8 h-8 text-accent-light" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-medium tracking-tight text-foreground">
                {isHindi ? "कक्षा" : "Classroom"}
              </h1>
              <p className="text-sm font-medium text-foreground-subtle mt-1 tracking-wide">
                <span className="text-foreground">{counts.active}</span>{" "}
                {isHindi ? "सक्रिय खोज" : "active quests"} ·{" "}
                <span className="text-success">{counts.completed}</span>{" "}
                {isHindi ? "पूर्ण" : "completed"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filter and Tab Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Segmented Glass Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: smoothEase, delay: 0.1 }}
            className="inline-flex p-1.5 bg-surface/30 backdrop-blur-xl rounded-[1.25rem] border border-white/5 shadow-lg overflow-x-auto max-w-full hide-scrollbar"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center justify-center py-2.5 px-5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-white"
                    : "text-foreground-subtle hover:text-foreground hover:bg-white/5"
                }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-accent rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tabLabels[tab.key]}</span>
                {counts[tab.key] > 0 && (
                  <span
                    className={`relative z-10 ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-black ${
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-white/10 text-foreground-muted"
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Class Filter Selector */}
          {stats?.classes && stats.classes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: smoothEase, delay: 0.15 }}
              className="flex items-center gap-2 bg-surface/30 backdrop-blur-xl border border-white/5 px-4 py-2.5 rounded-2xl shadow-lg shrink-0 self-start sm:self-center"
            >
              <span className="text-[10px] font-black text-foreground-subtle uppercase tracking-wider">
                {isHindi ? "कक्षा फ़िल्टर:" : "Class Filter:"}
              </span>
              <select
                value={classIdParam || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    router.push(`/dashboard/classroom?classId=${val}`);
                  } else {
                    router.push("/dashboard/classroom");
                  }
                }}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-4"
              >
                <option value="" className="bg-[#0b0c16] text-foreground">
                  {isHindi ? "सभी कक्षाएं" : "All Classes"}
                </option>
                {stats.classes.map((cls) => (
                  <option
                    key={cls.id}
                    value={cls.id}
                    className="bg-[#0b0c16] text-foreground"
                  >
                    {cls.name}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-[1.5rem] bg-white/5 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <AnimatePresence mode="wait">
              <EmptyState key="empty" tab={activeTab} />
            </AnimatePresence>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              key={activeTab} // Forces re-animation when switching tabs
              className="space-y-4"
            >
              {filtered.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <ClassroomPageContent />
    </Suspense>
  );
}
