"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  useTeacherClasses,
  useCreateAnnouncement,
} from "@web/hooks/use-teacher";
import { useTranslation } from "@web/context/language-context";
import { GradientMesh } from "@web/components/ui/background";
import {
  Megaphone,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function SendAnnouncementPage() {
  const router = useRouter();
  const { data: classes, isLoading: loadingClasses } = useTeacherClasses();
  const createAnnouncementMutation = useCreateAnnouncement();
  const { t } = useTranslation();
  const isHindi = t("nav.home") === "होम";

  const [selectedClassId, setSelectedClassId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !body.trim()) return;

    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    createAnnouncementMutation.mutate(
      {
        classId: selectedClassId,
        title: title.trim() || (undefined as any),
        body: body.trim(),
      },
      {
        onSuccess: (resData) => {
          setSuccessMessage(
            resData.message || "Announcement successfully sent!",
          );
          setBody("");
          setTitle("");
          setTimeout(() => {
            router.push("/dashboard/teacher");
          }, 2000);
        },
        onError: (err: any) => {
          setErrorMessage(
            err?.message ?? "Failed to send announcement. Please try again.",
          );
        },
      },
    );
  };

  return (
    <div className="min-h-screen relative selection:bg-accent/30">
      <GradientMesh className="opacity-40" />

      <div className="max-w-xl mx-auto space-y-6 pb-24 lg:pb-12 px-4 pt-8 relative z-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />{" "}
          {isHindi ? "डैशबोर्ड पर वापस" : "Back to Dashboard"}
        </button>

        {/* Form Card */}
        <div className="card p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-info/5 blur-[100px] rounded-full w-64 h-64 pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center mb-2">
              <Megaphone className="w-6 h-6 text-info-light" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {isHindi ? "कक्षा सूचना भेजें" : "Send Classroom Announcement"}
            </h1>
            <p className="text-sm text-foreground-subtle leading-relaxed">
              {isHindi
                ? "सभी नामांकित छात्रों के सूचना फ़ीड में तुरंत सूचना दें।"
                : "Broadcast announcements directly to all enrolled students' notification feeds instantly."}
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-error/15 border border-error/25 text-error text-xs">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-success/20 border border-success/35 flex items-center justify-center text-success mx-auto animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {isHindi ? "भेज दिया!" : "Sent!"}
              </h2>
              <p className="text-sm text-foreground-subtle">{successMessage}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-accent-light pt-4 animate-pulse">
                <span>
                  {isHindi
                    ? "डैशबोर्ड पर वापस आ रहे हैं"
                    : "Returning to dashboard"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Class selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="announcementClass"
                  className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider"
                >
                  {isHindi ? "लक्ष्य कक्षा" : "Target Classroom"}
                </label>
                {loadingClasses ? (
                  <div className="flex items-center gap-2 text-xs text-foreground-subtle py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-light" />
                    {isHindi
                      ? "कक्षाएं लोड हो रही हैं..."
                      : "Loading classrooms..."}
                  </div>
                ) : !classes || classes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
                    {isHindi
                      ? "⚠️ आपने अभी कोई कक्षा नहीं बनाई। पहले एक कक्षा बनाएं।"
                      : "⚠️ You haven't created any classes yet. Please create a class first."}
                  </div>
                ) : (
                  <select
                    id="announcementClass"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all text-sm text-foreground"
                  >
                    <option value="" className="bg-surface-hover">
                      {isHindi ? "कक्षा चुनें..." : "Select class..."}
                    </option>
                    {classes.map((cls) => (
                      <option
                        key={cls.id}
                        value={cls.id}
                        className="bg-surface-hover"
                      >
                        {cls.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="announcementTitle"
                  className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider"
                >
                  {isHindi ? "सूचना शीर्षक" : "Announcement Title"}
                </label>
                <input
                  id="announcementTitle"
                  type="text"
                  placeholder={
                    isHindi
                      ? "उदा.: कक्षा याद दहाना, गृहकार्य बदलाव (वैकल्पिक)"
                      : "e.g. Class reminder, Homework change (optional)"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={createAnnouncementMutation.isPending}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all text-sm text-foreground placeholder:text-white/20"
                />
              </div>

              {/* Body Textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="announcementBody"
                  className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider"
                >
                  {isHindi ? "सूचना संदेश" : "Announcement Message"}
                </label>
                <textarea
                  id="announcementBody"
                  placeholder={
                    isHindi
                      ? "छात्रों के पढ़ने के लिए अपना संदेश यहाँ लिखें..."
                      : "Type your message here for students to read..."
                  }
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={createAnnouncementMutation.isPending}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all text-sm text-foreground placeholder:text-white/20 resize-y"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={
                  createAnnouncementMutation.isPending ||
                  !selectedClassId ||
                  !body.trim()
                }
                className="w-full py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent/90 hover:to-accent-light/90 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {createAnnouncementMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {isHindi ? "सूचना पोस्ट करें" : "Post Announcement"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
