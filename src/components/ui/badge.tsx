import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "blue"
    | "green"
    | "yellow"
    | "purple"
    | "red"
    | "dark"
    | "pill-active";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
    secondary:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    outline:
      "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800",
    blue:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    green:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    yellow:
      "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    purple:
      "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    red:
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    dark:
      "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold",
    "pill-active":
      "bg-emerald-600 text-white font-semibold shadow-xs",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-tight select-none transition-all duration-150",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
