import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  back,
  action,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <span className="text-xs font-bold tracking-[0.18em] text-primary">
              {eyebrow.toUpperCase()}
            </span>
          ) : null}
          <h1
            className={cn(
              "font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl",
              eyebrow && "mt-2"
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
          {children}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
