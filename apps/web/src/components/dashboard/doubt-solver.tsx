"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, BookOpen, GraduationCap, CornerDownLeft, Loader2 } from "lucide-react";
import { api } from "@web/lib/api";
import { useToast } from "@web/components/ui/toast-provider";
import { WarningModal } from "./warning-modal";

interface Message {
  sender: "student" | "ai";
  text: string;
  timestamp: Date;
  isBlocked?: boolean;
}

interface DoubtSolverProps {
  toolId: string;
  toolName: string;
  defaultGradeLevel?: number;
}

const PREDICTIVE_CHIPS: Record<string, string[]> = {
  Mathematics: [
    "Explain the quadratic formula step by step",
    "What is the difference between rational and irrational numbers?",
    "Help me understand trigonometry basics",
  ],
  Science: [
    "How does photosynthesis convert solar energy?",
    "Explain the difference between mitosis and meiosis",
    "What is the structure of an atom?",
  ],
  History: [
    "What caused the fall of the Western Roman Empire?",
    "Summarize the key events of World War I",
    "Why was the Magna Carta important?",
  ],
  "Computer Science": [
    "Explain how a binary search algorithm works",
    "What is the difference between a stack and a queue?",
    "How does asynchronous programming work?",
  ],
  English: [
    "What are the common themes in Romeo and Juliet?",
    "Explain the difference between metaphor and simile",
    "How do I write a persuasive essay thesis?",
  ],
};

const SUBJECTS = ["Mathematics", "Science", "History", "Computer Science", "English"];

export function DoubtSolver({ toolId, toolName, defaultGradeLevel = 9 }: DoubtSolverProps) {
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<number>(defaultGradeLevel);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [blockedQuery, setBlockedQuery] = useState("");
  const [blockedCategory, setBlockedCategory] = useState("");
  const [blockedSeverity, setBlockedSeverity] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuery = async (queryToSend: string) => {
    if (!queryToSend.trim()) return;

    // Add student message to chat
    const studentMsg: Message = {
      sender: "student",
      text: queryToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, studentMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await api.post<{
        blocked: boolean;
        category?: string;
        severity?: string;
        message?: string;
        response?: string;
      }>(`/v1/tools/${toolId}/chat`, {
        prompt: queryToSend,
        gradeLevel: grade,
        subject,
        topic,
      } as any);

      if (res.blocked) {
        setBlockedQuery(queryToSend);
        setBlockedCategory(res.category || "CHEATING");
        setBlockedSeverity(res.severity || "HIGH");
        setWarningOpen(true);

        const blockedMsg: Message = {
          sender: "ai",
          text: `⚠️ [BLOCKED] ${res.message}`,
          timestamp: new Date(),
          isBlocked: true,
        };
        setMessages((prev) => [...prev, blockedMsg]);
        toast.showError("Academic safety violation", "Your request was blocked.");
      } else {
        const aiMsg: Message = {
          sender: "ai",
          text: res.response || "",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      toast.showError("Request Failed", "Failed to communicate with the Doubt Solver AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery(prompt);
    }
  };

  return (
    <div className="card p-6 flex flex-col h-[650px] relative overflow-hidden bg-surface/20 border-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
            <Sparkles className="w-5 h-5 text-accent-light" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Doubt Solver</h2>
            <p className="text-xs text-foreground-subtle">Ask doubt queries tailored to your learning needs</p>
          </div>
        </div>

        {/* Grade Indicator / Dropdown */}
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-foreground-muted" />
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="bg-surface border border-white/5 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-accent-light"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selectors: Subject & Topic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider block mb-1">
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent-light"
          >
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider block mb-1">
            Topic / Context (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Photosynthesis, Fractions, Romans"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent-light"
          />
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 bg-black/10 rounded-2xl p-4 border border-white/5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <BookOpen className="w-10 h-10 text-foreground-muted mb-3" />
            <h4 className="text-sm font-semibold text-foreground">Start asking doubts</h4>
            <p className="text-xs text-foreground-subtle max-w-xs mt-1">
              Select a subject, use predictive duda chips below, or write a custom query to get a grade-tailored AI explanation.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAI = msg.sender === "ai";
          return (
            <div key={i} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  isAI
                    ? msg.isBlocked
                      ? "bg-error/15 border border-error/25 text-error font-medium"
                      : "bg-surface border border-white/5 text-foreground/90 shadow-sm"
                    : "bg-accent text-white font-medium shadow-lg shadow-accent/15"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-accent-light animate-spin" />
              <span className="text-xs text-foreground-muted">AI is explaining...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Predictive Duda Chips */}
      {messages.length === 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider block mb-2">
            Suggested Queries
          </span>
          <div className="flex flex-wrap gap-2">
            {PREDICTIVE_CHIPS[subject]?.map((chipText, i) => (
              <button
                key={i}
                onClick={() => sendQuery(chipText)}
                className="text-xs text-foreground-muted hover:text-foreground bg-surface/50 border border-white/5 hover:border-white/10 rounded-full px-3 py-1.5 transition-all text-left"
              >
                {chipText}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="relative">
        <textarea
          placeholder="Ask a doubt or paste an assignment problem..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          rows={2}
          className="w-full bg-surface border border-white/5 rounded-xl pl-4 pr-12 py-3 text-xs font-medium focus:outline-none focus:border-accent-light resize-none placeholder:text-foreground-subtle disabled:opacity-50"
        />
        <button
          onClick={() => sendQuery(prompt)}
          disabled={loading || !prompt.trim()}
          className="absolute right-3.5 bottom-3.5 w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:hover:opacity-30"
          aria-label="Send prompt"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Warning Modal */}
      <WarningModal
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        blockedQuery={blockedQuery}
        category={blockedCategory}
        severity={blockedSeverity}
      />
    </div>
  );
}
