"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load preferred language from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("voldebug_lang") as Language;
      if (stored === "en" || stored === "hi") {
        setLanguageState(stored);
      }

      // Inject Google Translate script dynamically if not present
      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);

        // Define global callback
        (window as any).googleTranslateElementInit = () => {
          new (window as any).google.translate.TranslateElement({
            pageLanguage: "en",
            includedLanguages: "en,hi",
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, "google_translate_element");
        };

        // Inject custom styles to hide the Google Translate widget header banner and highlights
        const style = document.createElement("style");
        style.innerHTML = `
          .goog-te-banner-frame.skiptranslate,
          .goog-te-banner-frame,
          .goog-te-balloon-frame {
            display: none !important;
          }
          body {
            top: 0px !important;
          }
          .goog-tooltip {
            display: none !important;
          }
          .goog-tooltip:hover {
            display: none !important;
          }
          .goog-text-highlight {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          #google_translate_element {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("voldebug_lang", lang);

      // Manage cookie values to direct Google Translate element behavior
      const domain = window.location.hostname;
      if (lang === "hi") {
        document.cookie = `googtrans=/en/hi; path=/; domain=${domain}`;
        document.cookie = `googtrans=/en/hi; path=/`;
      } else {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      }
      
      // Reload page to apply full translation seamlessly
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {/* Hidden container needed by Google Translate script */}
      <div id="google_translate_element" style={{ display: "none" }} />
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }

  // Returns English fallback translation. Google Translate translates this dynamically to Hindi.
  // Maintains 100% backward compatibility with t() keys in profile & navigation components.
  const t = (keyPath: string, replacements?: Record<string, string | number>) => {
    const enDictionary: Record<string, any> = {
      nav: {
        home: "Home",
        dashboard: "Dashboard",
        classroom: "Classroom",
        assignments: "Assignments",
        analytics: "Analytics",
        grades: "Grades",
        scores: "Scores",
        profile: "Profile",
        tools: "Tools",
        roadmap: "Roadmap",
        signOut: "Sign Out",
      },
      profile: {
        title: "Student Profile",
        level: "Level",
        xp: "XP",
        edit: "Edit Profile",
        statsTitle: "Learning Stats",
        statsAssignments: "Assignments",
        statsAvgScore: "Avg Score",
        statsDayStreak: "Day Streak",
        statsTotalXP: "Total XP",
        badges: "Earned Badges",
        badgesTotal: `${replacements?.count ?? ""} Total`,
        badgesNone: "Complete your first assignment to earn a badge!",
        milestones: "Level Milestones",
        milestoneReached: "Milestone reached!",
        milestoneLocked: `Locked (Lvl ${replacements?.current}/${replacements?.required})`,
        parentReporting: "Parent Progress Reporting",
        parentShare: "Share my academic progress with my parent/guardian",
        parentShareSub: "When enabled, a regular academic summary will be generated and logged for email delivery.",
        parentEmail: "Parent / Guardian Email",
        parentFrequency: "Reporting Frequency",
        parentFreqWeekly: "Weekly (Every Sunday)",
        parentFreqMonthly: "Monthly (1st of the month)",
        parentPrivacyNote: "🔒 Privacy Isolation Guarantee: To protect your educational privacy, the report never exposes the raw text of your search queries, AI chat logs, or flagged audit warnings. High-level academic metrics only.",
        saveSettings: "Save Settings",
        sendTestReport: "Send Test Report Now",
        saveSuccess: "Parent reporting settings saved successfully!",
        saveFail: "Failed to save settings. Please make sure the email is valid.",
        testSuccess: `Success! Report compiled and printed to server log. (Verification Log ID: ${replacements?.id})`,
        testFail: "Failed to compile progress report. Make sure you saved your settings first.",
      }
    };

    const keys = keyPath.split(".");
    let current: any = enDictionary;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return keyPath;
      }
    }

    return typeof current === "string" ? current : keyPath;
  };

  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t
  };
}
