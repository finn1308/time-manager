import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-ink)] placeholder:text-[#8ba393] dark:placeholder:text-[#6a8773] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] focus-visible:border-transparent transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
