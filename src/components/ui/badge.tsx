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
  // All badge variants are harmonized within the Pastel Green / Sage / Mint design system
  const variantStyles = {
    default:
      "bg-[#eef5f0] text-[#192e22] dark:bg-[#1d3024] dark:text-[#f0f7f2] border border-[#dbe7dd] dark:border-[#263d2e]",
    secondary:
      "bg-[#eef5f0] text-[#526b5c] dark:bg-[#1d3024] dark:text-[#a3bda9]",
    outline:
      "border border-[#dbe7dd] dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2] bg-white dark:bg-[#17261c]",
    blue: // Re-routed to soft sage-mint
      "bg-[#d8ebe0] text-[#1b4332] border border-[#b7d8c3] dark:bg-[#1d3827] dark:text-[#9cd1b1] dark:border-[#2a4e37]",
    green: // Pastel botanical green
      "bg-[#d8ebe0] text-[#2d6a4f] border border-[#b7d8c3] dark:bg-[#1d3827] dark:text-[#74c69d] dark:border-[#2a4e37]",
    yellow: // Soft olive/moss green
      "bg-[#edf0dc] text-[#595e2b] border border-[#dadfbf] dark:bg-[#2b301c] dark:text-[#d3d89e] dark:border-[#3c4327]",
    purple: // Soft eucalyptus/slate mint
      "bg-[#e2ede7] text-[#2c473a] border border-[#c4dcce] dark:bg-[#203328] dark:text-[#a3c9b4] dark:border-[#2e4739]",
    red: // Gentle warm sage/dusty rose
      "bg-[#f3e6e6] text-[#783e3e] border border-[#e5c9c9] dark:bg-[#331f1f] dark:text-[#e0a8a8] dark:border-[#4d2f2f]",
    dark:
      "bg-[#1b4332] text-white dark:bg-[#52b788] dark:text-[#101c14] font-semibold",
    "pill-active":
      "bg-[#2d6a4f] text-white font-semibold shadow-xs",
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
