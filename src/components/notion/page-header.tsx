import React from "react";

interface PageHeaderProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#e9e9e7] dark:border-[#2e2e2e] gap-4">
      <div className="space-y-1">
        <div className="flex items-center space-x-2.5">
          {typeof icon === "string" ? (
            <span className="text-2xl select-none">{icon}</span>
          ) : (
            icon
          )}
          <h1 className="text-2xl font-bold tracking-tight text-[#37352f] dark:text-[#f0f0f0]">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-[#787774] dark:text-[#9b9a97] max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center space-x-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
