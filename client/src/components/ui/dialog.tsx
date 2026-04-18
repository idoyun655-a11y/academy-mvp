import * as React from "react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
};

const DialogContext = React.createContext<DialogContextValue>({ open: true });

export function Dialog({
  children,
  open = true,
}: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>) {
  return <DialogContext.Provider value={{ open }}>{children}</DialogContext.Provider>;
}

export function DialogContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = React.useContext(DialogContext);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={cn("w-full max-w-lg rounded-2xl border border-white/10 bg-[#11161d] p-6", className)}
        {...props}
      />
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}
