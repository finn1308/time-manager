import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "notion" | "secondary" | "outline" | "ghost" | "destructive" | "pill" | "amber" | "mint";
  size?: "default" | "sm" | "lg" | "icon" | "pill";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-95";

    const variantStyles = {
      default:
        "rounded-full bg-[var(--mint)] text-white hover:bg-[#1b4332] shadow-sm hover:shadow-md",
      pill:
        "rounded-full bg-white text-[var(--text-ink)] border border-[var(--border)] hover:border-[#b7d1be] hover:bg-[var(--mint-bg)] shadow-xs",
      notion:
        "rounded-full bg-[var(--bg-surface)] text-[var(--text-ink)] border border-[var(--border)] hover:bg-[var(--mint-soft)] shadow-xs",
      secondary:
        "rounded-full bg-[var(--mint-bg)] text-[var(--text-ink)] hover:bg-[var(--mint-bg)] dark:hover:bg-[#274431]",
      outline:
        "rounded-full border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--mint-soft)] text-[var(--text-ink)] shadow-xs",
      ghost:
        "rounded-full hover:bg-[var(--mint-soft)] text-[var(--text-ink)]",
      destructive:
        "rounded-full bg-[#b87474] text-white hover:bg-[#a66363] shadow-sm",
      amber:
        "rounded-full bg-[#a3a86c] text-white hover:bg-[#8f9457] shadow-sm font-semibold",
      mint:
        "rounded-full bg-[#52b788] text-white hover:bg-[#40916c] shadow-sm font-medium",
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
