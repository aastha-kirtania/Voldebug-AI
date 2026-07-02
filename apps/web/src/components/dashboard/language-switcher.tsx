"use client";

import { useTranslation } from "@web/context/language-context";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 selection:bg-transparent">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider transition-all ${
          language === "en"
            ? "bg-accent text-white shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("hi")}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider transition-all ${
          language === "hi"
            ? "bg-accent text-white shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        हि
      </button>
    </div>
  );
}
