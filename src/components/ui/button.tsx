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
        "rounded-full bg-[#2d6a4f] text-white hover:bg-[#1b4332] shadow-sm hover:shadow-md",
      pill:
        "rounded-full bg-white text-[#192e22] border border-[#dbe7dd] hover:border-[#b7d1be] hover:bg-[#eef5f0] shadow-xs",
      notion:
        "rounded-full bg-white dark:bg-[#17261c] text-[#192e22] dark:text-[#f0f7f2] border border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] shadow-xs",
      secondary:
        "rounded-full bg-[#eef5f0] dark:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2] hover:bg-[#d8ebe0] dark:hover:bg-[#274431]",
      outline:
        "rounded-full border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2] shadow-xs",
      ghost:
        "rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2]",
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
