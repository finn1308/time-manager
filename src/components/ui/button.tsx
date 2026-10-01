import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "notion" | "secondary" | "outline" | "ghost" | "destructive" | "subtle";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "notion", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      default: "bg-[#2383e2] text-white hover:bg-[#1a73e8] shadow-sm",
      notion:
        "bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#d4d4d4] border border-[#e9e9e7] dark:border-[#2e2e2e] hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
      secondary: "bg-[#f1f1ef] dark:bg-[#2c2c2c] text-[#37352f] dark:text-[#d4d4d4] hover:bg-[#e8e8e6] dark:hover:bg-[#383838]",
      outline: "border border-[#e9e9e7] dark:border-[#2e2e2e] bg-transparent hover:bg-[#f7f6f3] dark:hover:bg-[#252525] text-[#37352f] dark:text-[#d4d4d4]",
      ghost: "hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#37352f] dark:text-[#d4d4d4]",
      destructive: "bg-[#eb5757] text-white hover:bg-[#d94848] shadow-sm",
      subtle: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300",
    };

    const sizeStyles = {
      default: "h-9 px-3.5 py-1.5",
      sm: "h-7 px-2.5 text-xs rounded",
      lg: "h-11 px-6 text-base",
      icon: "h-8 w-8 p-0",
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
