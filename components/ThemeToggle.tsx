"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "neet-theme";

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", shouldUseDark);
  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
  });

  useEffect(() => {
    applyTheme(mode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((window.localStorage.getItem(STORAGE_KEY) ?? "system") === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  function setTheme(nextMode: ThemeMode) {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  }

  const options: Array<{ value: ThemeMode; label: string; icon: ReactNode }> = [
    { value: "light", label: "Light mode", icon: <Sun aria-hidden="true" /> },
    { value: "dark", label: "Dark mode", icon: <Moon aria-hidden="true" /> },
    { value: "system", label: "System mode", icon: <Monitor aria-hidden="true" /> },
  ];

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={mode === option.value}
          className="theme-toggle-button"
          onClick={() => setTheme(option.value)}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
