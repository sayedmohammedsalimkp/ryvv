"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Download,
  LayoutDashboard,
  Plus,
  User,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DESKTOP = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Contacts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/accounts", label: "Accounts" },
  { href: "/export", label: "Reports" },
] as const;

const MOBILE = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "People", icon: Users },
  { href: "/transactions/new", label: "Add", icon: Plus, primary: true },
  { href: "/transactions", label: "Txns", icon: ArrowLeftRight },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (pathname === href) return true;
    // "Add transaction" lives under /transactions but is its own destination.
    if (href === "/transactions") return false;
    return href !== "/dashboard" && pathname.startsWith(href);
  };
}

export function TopNav() {
  const isActive = useIsActive();

  return (
    <header className="sticky top-0 z-50 hidden border-b border-border bg-background/90 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-6 px-8 lg:px-12">
        <BrandLogo href="/dashboard" className="h-7 w-auto shrink-0" />

        <nav aria-label="Main" className="flex items-center gap-1">
          {DESKTOP.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="Profile">
            <Link href="/profile">
              <User className="size-5" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/transactions/new">
              <Plus className="size-4" aria-hidden />
              Add transaction
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MobileBrandBar() {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur-xl md:hidden">
      <BrandLogo href="/dashboard" className="h-7 w-auto" />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button asChild variant="ghost" size="icon" aria-label="Reports">
          <Link href="/export">
            <Download className="size-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {MOBILE.map(({ href, label, icon: Icon, ...rest }) => {
          const primary = "primary" in rest && rest.primary;
          const active = isActive(href);

          if (primary) {
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={label}
                  className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform active:scale-95"
                >
                  <Icon className="size-6" />
                </Link>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.4]")} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}