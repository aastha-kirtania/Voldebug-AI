"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search, Bot, Code2, Pen, Image, BookOpen,
  Sparkles, TrendingUp, ChevronRight, Zap, X, Lock,
  ArrowRight, GraduationCap
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────

const GUEST_VISIBLE_LIMIT = 10;

const CATEGORIES = [
  { key: "", label: "All Worlds", icon: Sparkles },
  { key: "CHAT_AI", label: "💬 Story Forest (Chat AI)", icon: Bot },
  { key: "CODE_AI", label: "🤖 Robot Factory (Code AI)", icon: Code2 },
  { key: "IMAGE_AI", label: "🎨 Creative Studio (Design)", icon: Image },
  { key: "WRITING_AI", label: "📝 Writer's Sanctuary (Writing)", icon: Pen },
  { key: "RESEARCH_AI", label: "🚀 Space Explorer (Research)", icon: BookOpen },
];

const CATEGORY_COLORS: Record<string, string> = {
  CHAT_AI: "#6366f1",
  CODE_AI: "#06b6d4",
  IMAGE_AI: "#ec4899",
  WRITING_AI: "#22c55e",
  RESEARCH_AI: "#f59e0b",
};

const CATEGORY_LABEL: Record<string, string> = {
  CHAT_AI: "💬 Story Forest (Chat)",
  CODE_AI: "🤖 Robot Factory (Code)",
  IMAGE_AI: "🎨 Creative Studio (Design)",
  WRITING_AI: "📝 Writer's Sanctuary (Writing)",
  RESEARCH_AI: "🚀 Space Explorer (Research)",
};

// 20 demo tools — first 10 visible, rest locked
const ALL_TOOLS = [
  { id: "1",  name: "ChatGPT",       category: "CHAT_AI",     description: "Advanced conversational AI for brainstorming, writing, and answering complex questions.", brandColor: "#10a37f", useCases: ["Essay help", "Brainstorming", "Q&A"],                         usageCount: 12500 },
  { id: "2",  name: "GitHub Copilot",category: "CODE_AI",     description: "AI pair programmer that helps you write code faster and smarter.",                         brandColor: "#1b1f24", useCases: ["Code completion", "Bug fixing", "Learning"],               usageCount: 8900  },
  { id: "3",  name: "Midjourney",    category: "IMAGE_AI",    description: "Generate stunning, high-quality images from text descriptions.",                           brandColor: "#7c3aed", useCases: ["Art projects", "Presentations", "Creative work"],           usageCount: 7560  },
  { id: "4",  name: "Grammarly",     category: "WRITING_AI",  description: "Advanced writing assistant that checks grammar, style, and clarity in real time.",          brandColor: "#15c39a", useCases: ["Essay editing", "Grammar check", "Writing improvement"],   usageCount: 11000 },
  { id: "5",  name: "Perplexity AI", category: "RESEARCH_AI", description: "AI-powered search engine that gives direct, cited answers to research questions.",          brandColor: "#20b2aa", useCases: ["Research", "Fact-checking", "Learning"],                    usageCount: 6800  },
  { id: "6",  name: "Claude",        category: "CHAT_AI",     description: "Thoughtful AI assistant excellent at analysis, writing, and nuanced reasoning.",            brandColor: "#d97706", useCases: ["Analysis", "Writing", "Tutoring"],                          usageCount: 5400  },
  { id: "7",  name: "Replit",        category: "CODE_AI",     description: "Online IDE with built-in AI to help you code, run, and share projects.",                   brandColor: "#f26207", useCases: ["Coding projects", "Learning to code", "Collaboration"],     usageCount: 4200  },
  { id: "8",  name: "Canva AI",      category: "IMAGE_AI",    description: "Design tool with AI image generation and editing for presentations and projects.",           brandColor: "#00c4cc", useCases: ["Presentations", "Posters", "Social media"],                usageCount: 8900  },
  { id: "9",  name: "QuillBot",      category: "WRITING_AI",  description: "AI paraphrasing and summarization tool for better, clearer writing.",                      brandColor: "#4CAF50", useCases: ["Paraphrasing", "Summarizing", "Writing"],                   usageCount: 6500  },
  { id: "10", name: "Elicit",        category: "RESEARCH_AI", description: "AI research assistant that helps find and summarize academic papers.",                      brandColor: "#5b21b6", useCases: ["Academic research", "Paper summaries", "Literature review"],usageCount: 3100  },
  { id: "11", name: "Gemini",        category: "CHAT_AI",     description: "Google's multimodal AI for text, images and code across all subjects.",                    brandColor: "#4285F4", useCases: ["Multimodal Q&A", "Image understanding", "Coding"],       usageCount: 9200  },
  { id: "12", name: "Codeium",       category: "CODE_AI",     description: "Free AI coding assistant with support for 70+ languages and editors.",                     brandColor: "#09B6A2", useCases: ["Autocomplete", "Refactoring", "Documentation"],             usageCount: 3800  },
  { id: "13", name: "Adobe Firefly", category: "IMAGE_AI",    description: "Adobe's generative AI for images, vectors, and design assets.",                           brandColor: "#FF0000", useCases: ["Generative fill", "Text to image", "Recolor"],              usageCount: 4100  },
  { id: "14", name: "Wordtune",      category: "WRITING_AI",  description: "AI-powered rewriting tool that improves clarity, tone, and style.",                        brandColor: "#6C5CE7", useCases: ["Rewriting", "Tone adjustment", "Summarizing"],              usageCount: 2900  },
  { id: "15", name: "Consensus",     category: "RESEARCH_AI", description: "Search and extract findings from 200M+ scientific papers using AI.",                      brandColor: "#3B82F6", useCases: ["Literature review", "Fact-checking", "Evidence finding"],  usageCount: 1800  },
  { id: "16", name: "Mistral",       category: "CHAT_AI",     description: "Open-weights AI model with strong reasoning and multilingual capabilities.",                brandColor: "#FF7000", useCases: ["Reasoning", "Multilingual", "Summarization"],               usageCount: 2200  },
  { id: "17", name: "Tabnine",       category: "CODE_AI",     description: "AI code completion for teams with privacy and IDE integration focus.",                     brandColor: "#5B5EA6", useCases: ["Team coding", "Code completion", "Privacy"],                usageCount: 1600  },
  { id: "18", name: "DALL·E 3",      category: "IMAGE_AI",    description: "OpenAI's image generation model with precise prompt following.",                           brandColor: "#10a37f", useCases: ["Illustrations", "Concept art", "Presentations"],             usageCount: 5200  },
  { id: "19", name: "Jasper",        category: "WRITING_AI",  description: "AI writing platform for long-form content, marketing copy, and reports.",                  brandColor: "#FF6B35", useCases: ["Long-form writing", "Marketing", "Reports"],                usageCount: 3300  },
  { id: "20", name: "Semantic Scholar",category:"RESEARCH_AI",description: "Free AI-powered search engine for scientific literature.",                                  brandColor: "#1D3557", useCases: ["Academic search", "Citation graph", "Paper summaries"],    usageCount: 2100  },
];

// ─── Sub-components ───────────────────────────────────────────────────────

type ToolItem = typeof ALL_TOOLS[number];

function ToolCard({ tool, index }: { tool: ToolItem; index: number }) {
  const color = tool.brandColor || CATEGORY_COLORS[tool.category] || "#6366f1";
  const catLabel = CATEGORY_LABEL[tool.category] || tool.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.04, 0.3) }}
      className="group relative rounded-2xl border border-card-border bg-card p-5 flex flex-col gap-4 hover:border-card-border-hover hover:bg-card-hover hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
          style={{ backgroundColor: color }}
        >
          {tool.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{tool.name}</p>
          <span
            className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {catLabel}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>

      {/* Description */}
      <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">{tool.description}</p>

      {/* Use cases */}
      <div className="flex flex-wrap gap-1.5">
        {tool.useCases.slice(0, 2).map((uc) => (
          <span key={uc} className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-foreground-muted border border-card-border">
            {uc}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs text-foreground-subtle pt-1 border-t border-card-border">
        <TrendingUp className="w-3 h-3" />
        <span>{tool.usageCount.toLocaleString()} uses</span>
      </div>
    </motion.div>
  );
}

function LockedToolCard({ tool, index }: { tool: ToolItem; index: number }) {
  const color = tool.brandColor || CATEGORY_COLORS[tool.category] || "#6366f1";
  const catLabel = CATEGORY_LABEL[tool.category] || tool.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.04, 0.4) }}
      className="relative rounded-2xl border border-card-border bg-card p-5 flex flex-col gap-4 overflow-hidden cursor-not-allowed select-none"
    >
      {/* Blurred content */}
      <div className="filter blur-[3px] pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            {tool.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{tool.name}</p>
            <span
              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {catLabel}
            </span>
          </div>
        </div>
        <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2 mt-4">{tool.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tool.useCases.slice(0, 2).map((uc) => (
            <span key={uc} className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-foreground-muted border border-card-border">
              {uc}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-foreground-subtle pt-1 border-t border-card-border mt-4">
          <TrendingUp className="w-3 h-3" />
          <span>{tool.usageCount.toLocaleString()} uses</span>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fefdf8]/75 backdrop-blur-[1px] rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center mb-2 shadow-sm">
          <Lock className="w-5 h-5 text-foreground-muted" />
        </div>
        <p className="text-xs text-foreground-muted font-medium">Sign up to unlock</p>
      </div>
    </motion.div>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────

function CtaBanner({ totalLocked }: { totalLocked: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="col-span-full relative rounded-2xl overflow-hidden border border-accent/20 my-2"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/10 to-purple-600/10" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <Zap className="w-5 h-5 text-accent-light" />
            <span className="text-xs font-semibold text-accent-light uppercase tracking-widest">Free Access</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Unlock {totalLocked} more tools
          </h2>
          <p className="text-sm text-foreground-muted max-w-sm">
            Create a free account to access the full AI tools library, track your usage, and get personalized recommendations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-card-border bg-surface hover:bg-surface-hover text-foreground-muted hover:text-foreground text-sm font-semibold transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-card-border bg-card/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            <span className="text-gradient">VOLDEBUG</span>
            <span className="text-foreground-subtle text-xs ml-1 font-normal">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-foreground-muted hover:text-foreground border border-card-border hover:border-card-border-hover bg-card hover:bg-card-hover transition-all"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-light text-white transition-all shadow-lg shadow-accent/20"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ToolsPreviewPage() {
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [apiTools, setApiTools] = useState<ToolItem[] | null>(null);

  // Debounce search
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  // Try to fetch from public API; fall back to static list
  useEffect(() => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
    fetch(`${apiUrl}/v1/tools`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((json) => {
        if (Array.isArray(json?.data) && json.data.length > 0) setApiTools(json.data);
      })
      .catch(() => {/* fall through to static demo list */});
  }, []);

  const baseTools: ToolItem[] = (apiTools && apiTools.length > 0 ? apiTools : ALL_TOOLS) as ToolItem[];

  const filtered = useMemo(() => {
    let t = baseTools;
    if (activeCategory) t = t.filter((tool) => tool.category === activeCategory);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      t = t.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q)
      );
    }
    return t;
  }, [baseTools, activeCategory, debouncedSearch]);

  const visibleTools = filtered.slice(0, GUEST_VISIBLE_LIMIT);
  const lockedTools = filtered.slice(GUEST_VISIBLE_LIMIT);
  const totalLocked = lockedTools.length;

  return (
    <div className="min-h-screen relative overflow-x-hidden kids-mode bg-[#fefdf8] text-[#3d3b30] selection:bg-violet-300/40 font-sans pb-20">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#fefdf8]">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-violet-100/30 blur-[130px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-sky-100/20 blur-[110px]" />
        <div className="absolute -bottom-40 right-1/3 w-[600px] h-[600px] rounded-full bg-amber-100/30 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(61,59,48,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(61,59,48,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-10 pb-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/25 bg-accent/8 text-accent-dark mb-5">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-xs font-semibold text-accent-dark uppercase tracking-wider">AI Tool Explorer</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            AI Tool Worlds
          </h1>
          <p className="text-base text-foreground-muted max-w-lg mx-auto">
            Discover and master {baseTools.length} curated AI tools tailored for school assignments and creative learning.
          </p>

          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            {[
              { icon: Zap,            label: `${baseTools.length} Worlds`       },
              { icon: GraduationCap,  label: "For Students"                    },
              { icon: BookOpen,       label: "All Subjects"                    },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <Icon className="w-3.5 h-3.5 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="sticky top-14 z-30 py-4 -mx-4 px-4 md:-mx-6 md:px-6 space-y-3"
          style={{ background: "linear-gradient(to bottom, #fefdf8 70%, transparent)" }}
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search AI tools…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-card border border-card-border text-sm text-foreground placeholder-foreground-subtle focus:outline-none focus:border-accent focus:bg-card-hover transition-all"
              aria-label="Search AI tools"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat.key
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "bg-card text-foreground-muted hover:text-foreground hover:bg-card-hover border border-card-border"
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        <div className="mt-2 mb-4 flex items-center justify-between">
          <p className="text-xs text-foreground-subtle">
            Showing <span className="text-foreground-muted font-medium">{visibleTools.length}</span> of{" "}
            <span className="text-foreground-muted font-medium">{filtered.length}</span> tools
            {totalLocked > 0 && (
              <> — <span className="text-accent font-medium">{totalLocked} locked</span></>
            )}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-card border border-card-border flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-foreground-subtle" />
            </div>
            <p className="font-semibold text-foreground-muted mb-1">No tools found</p>
            <p className="text-sm text-foreground-subtle">Try a different search or category</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Visible tools */}
              {visibleTools.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}

              {/* CTA banner — spans full width after visible tools */}
              {totalLocked > 0 && <CtaBanner totalLocked={totalLocked} />}

              {/* Locked tools — blurred */}
              {lockedTools.map((tool, i) => (
                <LockedToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Bottom CTA (when all tools are visible / no locked) */}
        {totalLocked === 0 && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 text-center py-10 border-t border-card-border"
          >
            <p className="text-foreground-muted text-sm mb-4">
              Ready to start using these tools in your studies?
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-all shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        <div className="h-16" />
      </div>
    </div>
  );
}
