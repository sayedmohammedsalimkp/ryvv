"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

export function FinalCta() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError("Enter a valid email, or continue without one.");
      return;
    }
    setError("");
    startTransition(() => {
      router.push(value ? `/signup?email=${encodeURIComponent(value)}` : "/signup");
    });
  }

  return (
    <section
      id="signup"
      className="bg-foreground px-5 py-16 text-background sm:px-8 md:py-20 lg:px-12"
    >
      <Reveal className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl">
            Create your RYVV account
          </h2>
          <p className="mt-3 text-background/65">
            Link Telegram right after signup.
          </p>
        </div>

        <form onSubmit={onSubmit} className="w-full max-w-md">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="cta-email" className="sr-only">
              Email
            </label>
            <input
              id="cta-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "cta-email-error" : undefined}
              className="h-12 w-full rounded-xl border border-background/20 bg-background/10 px-4 text-base text-background placeholder:text-background/45 focus-visible:border-background/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50"
            />
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-12 shrink-0 transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {pending ? (
                "Opening signup…"
              ) : (
                <>
                  Create free account
                  <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </Button>
          </div>
          {error ? (
            <p
              id="cta-email-error"
              role="alert"
              className="mt-2 text-sm text-red-300"
            >
              {error}
            </p>
          ) : (
            <p className="mt-2 text-sm text-background/55">
              Email is optional — we&apos;ll carry it into the signup form.
            </p>
          )}
        </form>
      </Reveal>
    </section>
  );
}
