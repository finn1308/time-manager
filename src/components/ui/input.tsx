import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[16px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-4 py-2 text-sm text-[#192e22] dark:text-[#f0f7f2] placeholder:text-[#8ba393] dark:placeholder:text-[#6a8773] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] focus-visible:border-transparent transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
