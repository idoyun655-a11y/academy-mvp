import * as React from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({
  children,
}: React.PropsWithChildren<{ delayDuration?: number }>) {
  return <>{children}</>;
}

export function Tooltip({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

export function TooltipTrigger({
  children,
}: React.PropsWithChildren<{ asChild?: boolean }>) {
  return <>{children}</>;
}

export function TooltipContent({
  className,
  side,
  align,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: string; align?: string }) {
  return (
    <div
      className={cn("rounded-lg border border-white/10 bg-[#11161d] px-2 py-1 text-xs text-white/80", className)}
      data-side={side}
      data-align={align}
      {...props}
    />
  );
}
