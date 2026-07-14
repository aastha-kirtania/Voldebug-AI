"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Laptop, Sparkles } from "lucide-react";
import { useTheme, type Theme } from "../providers/theme-provider";
import { sound } from "@web/lib/audio";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [kidsMode, setKidsMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync kidsMode on mount and listen to changes
  useEffect(() => {
    const checkKidsMode = () => {
      const saved = localStorage.getItem("kids-mode");
      setKidsMode(saved === "true");
    };

    checkKidsMode();
    window.addEventListener("kids-mode-change", checkKidsMode);

    // Fallback polling to match other components
    const interval = setInterval(checkKidsMode, 1000);

    return () => {
      window.removeEventListener("kids-mode-change", checkKidsMode);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (mode: "light" | "dark" | "system" | "kids") => {
    sound.playClick();
    if (mode === "kids") {
      setKidsMode(true);
      localStorage.setItem("kids-mode", "true");
      window.document.documentElement.classList.add("kids-mode");
    } else {
      setKidsMode(false);
      localStorage.setItem("kids-mode", "false");
      window.document.documentElement.classList.remove("kids-mode");
      setTheme(mode);
    }
    window.dispatchEvent(new Event("kids-mode-change"));
    setOpen(false);
  };

  const getActiveIcon = () => {
    if (kidsMode) return Sparkles;
    if (theme === "system") return Laptop;
    return theme === "light" ? Sun : Moon;
  };

  const IconComponent = getActiveIcon();

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
    { value: "kids", label: "Kids Mode", icon: Sparkles },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all relative overflow-hidden ${
          kidsMode
            ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-violet-200/50"
            : "hover:bg-surface/60 border-white/5 text-foreground-muted hover:text-foreground"
        }`}
        aria-label="Toggle theme"
        title="Theme Settings"
      >
        <motion.div
          key={kidsMode ? "kids" : theme}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <IconComponent className="w-[18px] h-[18px] transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-card border border-card-border shadow-xl z-50 p-1"
          >
            {options.map((opt) => {
              const OptIcon = opt.icon;
              const isSelected =
                opt.value === "kids" ? kidsMode : !kidsMode && theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isSelected
                      ? "bg-accent-surface text-accent-light"
                      : "text-foreground-muted hover:bg-surface/60 hover:text-foreground"
                  }`}
                >
                  <OptIcon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
