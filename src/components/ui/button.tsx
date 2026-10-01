import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "notion" | "secondary" | "outline" | "ghost" | "destructive" | "pill" | "amber" | "mint";
  size?: "default" | "sm" | "lg" | "icon" | "pill";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-95";

    const variantStyles = {
      default:
        "rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
      pill:
        "rounded-full bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs",
      notion:
        "rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs",
      secondary:
        "rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700",
      outline:
        "rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs",
      ghost:
        "rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
      destructive:
        "rounded-full bg-red-500 text-white hover:bg-red-600 shadow-sm",
      amber:
        "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm font-semibold",
      mint:
        "rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm font-medium",
    };

    const sizeStyles = {
      default: "h-10 px-5 py-2",
      sm: "h-8 px-3.5 text-xs",
      lg: "h-12 px-7 text-base font-semibold",
      pill: "h-9 px-4 text-xs font-semibold",
      icon: "h-9 w-9 p-0 rounded-full",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
