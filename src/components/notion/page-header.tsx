import React from "react";

interface PageHeaderProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-[#dbe7dd]/80 dark:border-[#263d2e] gap-4">
      <div className="space-y-1">
        <div className="flex items-center space-x-2.5">
          {typeof icon === "string" ? (
            <span className="text-2xl select-none">{icon}</span>
          ) : (
            icon
          )}
          <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center space-x-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
