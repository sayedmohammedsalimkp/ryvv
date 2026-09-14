"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-grid-faint" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo href="/" priority className="h-9 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            Track money with people, log it from Telegram, review it on the web.
          </p>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative z-10 px-5 pb-8 text-center text-xs text-muted-foreground sm:px-8">
        Free to start · No card needed · Telegram assistant included
      </footer>
    </div>
  );
}
