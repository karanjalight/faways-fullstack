"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, disabled, id, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          id={id}
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 shadow-sm ring-offset-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
      </div>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
