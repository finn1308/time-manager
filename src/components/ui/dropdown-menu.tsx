"use client";

import React, { useState, useRef, useEffect, createContext, useContext } from "react";

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className = "",
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { open, setOpen } = useContext(DropdownContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        (children.props as any).onClick?.(e);
        setOpen((prev) => !prev);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
      className={className}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  align = "end",
  className = "",
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const { open, setOpen } = useContext(DropdownContext);

  if (!open) return null;

  const alignClass =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] p-1 shadow-lg ring-1 ring-black/5 focus:outline-none ${alignClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}) {
  const { setOpen } = useContext(DropdownContext);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setOpen(false);
        onClick?.(e);
      }}
      className={`flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs text-[#192e22] dark:text-[#f0f7f2] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] outline-none transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = "" }: { className?: string }) {
  return <div className={`-mx-1 my-1 h-px bg-[#dbe7dd]/60 dark:bg-[#263d2e] ${className}`} />;
}
