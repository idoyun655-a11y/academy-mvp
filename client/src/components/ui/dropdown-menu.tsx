import * as React from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ children }: React.PropsWithChildren) {
  return <div>{children}</div>;
}

export function DropdownMenuTrigger({
  children,
}: React.PropsWithChildren<{ asChild?: boolean }>) {
  return <>{children}</>;
}

export function DropdownMenuContent({
  className,
  align,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: string }) {
  return (
    <div
      className={cn("rounded-xl border border-white/10 bg-[#11161d] p-2 shadow-xl", className)}
      data-align={align}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm hover:bg-white/10", className)}
      {...props}
    />
  );
}
