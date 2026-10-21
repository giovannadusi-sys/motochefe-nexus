import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground",
          "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
          "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
