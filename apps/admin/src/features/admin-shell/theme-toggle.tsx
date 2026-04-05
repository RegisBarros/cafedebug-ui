"use client";

import { useOptimistic, useTransition } from "react";

import { type Theme } from "@/lib/auth/theme";

import { setThemeAction } from "./server/theme.actions";

type ThemeToggleProps = {
  currentTheme: "light" | "dark";
};

export function ThemeToggle({ currentTheme }: ThemeToggleProps) {
  const [, startTransition] = useTransition();
  const [optimisticTheme, setOptimisticTheme] = useOptimistic(currentTheme);

  function handleToggle() {
    const next: Theme = optimisticTheme === "dark" ? "light" : "dark";

    startTransition(async () => {
      setOptimisticTheme(next);
      document.documentElement.setAttribute("data-theme", next);
      await setThemeAction(next);
    });
  }

  return (
    <button
      type="button"
      aria-label={optimisticTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleToggle}
      className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {optimisticTheme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
