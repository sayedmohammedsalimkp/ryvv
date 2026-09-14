import Link from "next/link";
import { cn } from "@/lib/utils";

export type StatTone = "invert" | "brand" | "get" | "give" | "neutral";

const SURFACE: Record<StatTone, string> = {
  invert: "bg-foreground text-background border border-transparent",
  brand: "border border-primary/20 bg-primary/5",
  get: "border border-money-get/20 bg-money-get-soft/50",
  give: "border border-money-give/20 bg-money-give-soft/50",
  neutral: "border border-border bg-card",
};

const LABEL: Record<StatTone, string> = {
  invert: "text-background/60",
  brand: "text-muted-foreground",
  get: "text-muted-foreground",
  give: "text-muted-foreground",
  neutral: "text-muted-foreground",
};

const VALUE: Record<StatTone, string> = {
  invert: "",
  brand: "",
  get: "text-money-get",
  give: "text-money-give",
  neutral: "",
};

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: StatTone;
  href?: string;
  /** Rendered at the top-right — usually a disclosure button. */
  corner?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  valueClassName?: string;
};

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  href,
  corner,
  children,
  className,
  valueClassName,
}: StatCardProps) {
  const body = (
    <>
      <p className={cn("text-sm", LABEL[tone])}>{label}</p>
      <p
        className={cn(
          "mt-6 text-2xl font-bold tabular-nums",
          VALUE[tone],
          valueClassName
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-2 text-xs", LABEL[tone])}>{hint}</p>
      ) : null}
    </>
  );

  return (
    <div className={cn("relative rounded-2xl p-5 sm:p-6", SURFACE[tone], className)}>
      {href ? (
        <Link
          href={href}
          className="block rounded-lg transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
      {corner ? <div className="absolute right-4 top-4">{corner}</div> : null}
      {children}
    </div>
  );
}

/** Dropdown panel anchored under a stat card. */
export function StatDrawer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%-8px)] z-20 pt-3">
      <div
        className={cn(
          "max-h-60 overflow-auto rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-card",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
