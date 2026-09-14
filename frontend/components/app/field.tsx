import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Native select styled to match the Input control. */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

type ChipProps = {
  selected: boolean;
  children: React.ReactNode;
  tone?: "primary" | "get" | "give";
} & Omit<React.ComponentProps<"button">, "className">;

const CHIP_ON: Record<NonNullable<ChipProps["tone"]>, string> = {
  primary: "border-transparent bg-primary text-primary-foreground",
  get: "border-transparent bg-money-get text-white",
  give: "border-transparent bg-money-give text-white",
};

/** Selectable pill used for transaction types and filters. */
export function Chip({
  selected,
  children,
  tone = "primary",
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? CHIP_ON[tone]
          : "border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
