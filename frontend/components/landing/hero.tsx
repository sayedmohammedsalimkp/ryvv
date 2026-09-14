import Link from "next/link";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import {
  Amount,
  Bubble,
  ChatHeader,
  ChatThread,
  PhoneFrame,
} from "@/components/landing/telegram-chat";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-20 lg:px-12">
      <div
        aria-hidden
        className="bg-grid-faint pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="max-w-xl">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-primary">
            PERSONAL MONEY MANAGER
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.06] -tracking-[0.035em] sm:text-5xl lg:text-[3.4rem]">
            Your money, tracked from chat
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
            Create your RYVV account, link Telegram, and log money by texting or
            talking. Everything syncs to your dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Link href="/signup">Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Free to start · Works in Telegram · Indian ₹
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex justify-center lg:justify-end">
            <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-0">
              <PhoneFrame className="w-[236px] shrink-0 sm:-rotate-2">
                <ChatHeader />
                <ChatThread className="gap-2">
                  <Bubble from="user">gave rahul 500</Bubble>
                  <Bubble from="bot">
                    Logged ✅ Gave <Amount>₹500</Amount> to Rahul
                  </Bubble>
                  <Bubble from="user">who owes me?</Bubble>
                  <Bubble from="bot">
                    You will get <Amount>₹4,850</Amount>
                    <br />
                    Rahul · Meena · Karthik
                  </Bubble>
                </ChatThread>
              </PhoneFrame>

              <div className="relative z-20 w-full max-w-[285px] rounded-2xl border border-border bg-card p-5 shadow-card sm:-ml-6 sm:w-[272px] lg:w-[285px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">RYVV dashboard</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-money-get">
                    <CheckCircle2 className="size-3" aria-hidden />
                    Synced just now
                  </span>
                </div>
                <p className="mt-7 text-sm text-muted-foreground">
                  Total balance
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-[2rem]">
                  ₹1,25,000.50
                </p>
                <div className="mt-7 rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground">On hand</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">
                    ₹82,430.50
                  </p>
                </div>
              </div>

              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 z-30 hidden size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground ring-8 ring-background sm:flex"
              >
                <RefreshCw className="size-4" />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
