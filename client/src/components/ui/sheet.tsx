import * as React from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open = false,
  onOpenChange,
  children,
}: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>) {
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange?.(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/70"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
}

export function SheetTrigger({ children }: React.PropsWithChildren<{ asChild?: boolean }>) {
  return <>{children}</>;
}

export function SheetContent({
  children,
  className,
  side,
  ...props
}: React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "left" | "right";
  }
>) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 z-[60] w-80 max-w-full bg-[#11161d] p-4 shadow-2xl",
        side === "left" ? "left-0" : "right-0",
        className
      )}
      data-side={side}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("mb-3", className)}>{children}</div>;
}

export function SheetTitle({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <h2 className={cn("text-base font-semibold", className)}>{children}</h2>;
}

export function SheetDescription({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <p className={cn("text-sm text-white/60", className)}>{children}</p>;
}
