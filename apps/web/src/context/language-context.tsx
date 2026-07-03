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
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("voldebug_lang", lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }

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

    const hiDictionary: Record<string, any> = {
      nav: {
        home: "होम",
        dashboard: "डैशबोर्ड",
        classroom: "कक्षा",
        assignments: "असाइनमेंट",
        analytics: "विश्लेषण",
        grades: "ग्रेड",
        scores: "अंक",
        profile: "प्रोफ़ाइल",
        tools: "टूल्स",
        roadmap: "रोडमैप",
        signOut: "लॉग आउट",
      },
      profile: {
        title: "छात्र प्रोफ़ाइल",
        level: "स्तर",
        xp: "एक्सपी",
        edit: "प्रोफ़ाइल संपादित करें",
        statsTitle: "सीखने के आँकड़े",
        statsAssignments: "असाइनमेंट",
        statsAvgScore: "औसत अंक",
        statsDayStreak: "दैनिक निरंतरता",
        statsTotalXP: "कुल एक्सपी",
        badges: "अर्जित बैज",
        badgesTotal: `${replacements?.count ?? ""} कुल`,
        badgesNone: "बैज अर्जित करने के लिए अपना पहला असाइनमेंट पूरा करें!",
        milestones: "स्तर के मील के पत्थर",
        milestoneReached: "मील का पत्थर हासिल किया!",
        milestoneLocked: `लॉक (स्तर ${replacements?.current}/${replacements?.required})`,
        parentReporting: "अभिभावक प्रगति रिपोर्टिंग",
        parentShare: "मेरी शैक्षणिक प्रगति मेरे अभिभावक के साथ साझा करें",
        parentShareSub: "सक्षम होने पर, ईमेल विवरण के लिए एक नियमित शैक्षणिक सारांश उत्पन्न किया जाएगा और लॉग किया जाएगा।",
        parentEmail: "अभिभावक का ईमेल",
        parentFrequency: "रिपोर्टिंग आवृत्ति",
        parentFreqWeekly: "साप्ताहिक (हर रविवार)",
        parentFreqMonthly: "मासिक (महीने की 1 तारीख)",
        parentPrivacyNote: "🔒 गोपनीयता अलगाव गारंटी: आपकी शैक्षणिक गोपनीयता की रक्षा के लिए, यह रिपोर्ट कभी भी आपके खोज प्रश्नों, एआई चैट लॉग, या चेतावनी लॉग को उजागर नहीं करती है। केवल उच्च-स्तरीय शैक्षणिक डेटा भेजा जाता है।",
        saveSettings: "सेटिंग्स सहेजें",
        sendTestReport: "अभी परीक्षण रिपोर्ट भेजें",
        saveSuccess: "अभिभावक रिपोर्टिंग सेटिंग्स सफलतापूर्वक सहेजी गईं!",
        saveFail: "सेटिंग्स सहेजने में विफल। कृपया सुनिश्चित करें कि ईमेल मान्य है।",
        testSuccess: `सफलता! रिपोर्ट संकलित की गई और सर्वर लॉग में मुद्रित की गई। (सत्यापन लॉग आईडी: ${replacements?.id})`,
        testFail: "प्रगति रिपोर्ट संकलित करने में विफल। सुनिश्चित करें कि आपने पहले अपनी सेटिंग्स सहेज ली हैं।",
      }
    };

    const dictionary = context.language === "hi" ? hiDictionary : enDictionary;
    const keys = keyPath.split(".");
    let current: any = dictionary;

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
