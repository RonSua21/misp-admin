"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import NotificationBell from "@/components/layout/NotificationBell";

export default function TopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { theme, toggle } = useTheme();
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b-2 border-makati-gold flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-slate-500">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
