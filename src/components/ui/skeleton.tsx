import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted bg-[#e8f0eb] dark:bg-[#203326]", className)}
      {...props}
    />
  );
}

export { Skeleton };
