import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  size?: string;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", variant, size, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "lg" && "px-5 py-3 text-base",
        variant === "ghost" && "border-transparent bg-transparent hover:bg-white/10",
        variant === "secondary" && "bg-white/5 text-white/80",
        variant === "destructive" && "bg-red-500/20 text-red-100",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button };
export default Button;
