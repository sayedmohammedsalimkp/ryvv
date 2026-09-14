"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";
import {
  Amount,
  Bubble,
  ChatHeader,
  ChatThread,
  PhoneFrame,
} from "@/components/landing/telegram-chat";

type Topic = "rahul" | "priya" | "get" | "month" | "report";

const CAPABILITIES = [
  "Log by text or voice",
  "Check who owes you",
  "Settle a person",
  "Month summaries",
  "PDF reports",
] as const;

const SUMMARY: { topic: Topic; label: string; value: string; tone: string }[] = [
  {
    topic: "get",
    label: "You will get",
    value: "₹4,850",
    tone: "text-money-get",
  },
  { topic: "rahul", label: "Rahul", value: "₹1,200", tone: "text-money-get" },
  { topic: "priya", label: "Priya", value: "-₹300", tone: "text-money-give" },
  { topic: "month", label: "September net", value: "+₹23,660", tone: "" },
  {
    topic: "report",
    label: "Statement",
    value: "Sep · PDF",
    tone: "text-muted-foreground",
  },
];

export function AssistantShowcase() {
  const [active, setActive] = useState<Topic | null>(null);

  const hoverProps = (topic: Topic) => ({
    onMouseEnter: () => setActive(topic),
    onMouseLeave: () => setActive(null),
    className: cn(
      active === topic && "ring-2 ring-primary/60 ring-offset-2 ring-offset-chat"
    ),
  });

  return (
    <Section id="assistant" tone="tint">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="text-xs font-bold tracking-[0.18em] text-primary">
            THE ASSISTANT
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl">
            Money conversations that stay useful
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            Telegram is the fastest way to use the same RYVV account — not a
            separate product. Ask, log, and settle without losing the bigger
            picture.
          </p>
          <p className="mt-7 text-lg font-semibold">
            Same account. Same data. Just faster.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
            {CAPABILITIES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your dashboard, same moment
            </p>
            <dl className="mt-4 grid gap-1">
              {SUMMARY.map((row) => (
                <div
                  key={row.topic}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors",
                    active === row.topic ? "bg-primary/10" : "bg-transparent"
                  )}
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className={cn("font-semibold tabular-nums", row.tone)}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Hover a message to see what it changes.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <PhoneFrame className="mx-auto w-full max-w-[370px]">
            <ChatHeader subtitle="today" />
            <ChatThread>
              <Bubble from="user" {...hoverProps("rahul")}>
                gave rahul 500
              </Bubble>
              <Bubble from="bot" {...hoverProps("rahul")}>
                Logged ✅ Gave <Amount>₹500</Amount> to Rahul. Rahul now owes you{" "}
                <Amount>₹1,200</Amount>.
              </Bubble>

              <Bubble from="user" {...hoverProps("priya")}>
                🎤 voice note (0:04)
              </Bubble>
              <Bubble from="bot" {...hoverProps("priya")}>
                Heard: <i>&ldquo;got 200 from priya&rdquo;</i> — Logged ✅ You owe
                Priya <Amount>₹300</Amount>.
              </Bubble>

              <Bubble from="user" {...hoverProps("get")}>
                who owes me?
              </Bubble>
              <Bubble from="bot" {...hoverProps("get")}>
                You will get <Amount>₹4,850</Amount> — Rahul ₹1,200, Meena
                ₹2,400, Karthik ₹1,250
              </Bubble>

              <Bubble from="user" {...hoverProps("rahul")}>
                settle with rahul
              </Bubble>
              <Bubble from="bot" {...hoverProps("rahul")}>
                Settle Rahul at <Amount>₹1,200</Amount> → balance becomes ₹0.
                Confirm?
                <span className="mt-2 flex gap-2">
                  <span className="rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground">
                    Yes, settle
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground">
                    Cancel
                  </span>
                </span>
              </Bubble>

              <Bubble from="user" {...hoverProps("month")}>
                spend this month?
              </Bubble>
              <Bubble from="bot" {...hoverProps("month")}>
                September spend ₹18,340 · Income ₹42,000 · Net{" "}
                <Amount>+₹23,660</Amount>
              </Bubble>

              <Bubble from="user" {...hoverProps("report")}>
                send report
              </Bubble>
              <Bubble from="bot" {...hoverProps("report")}>
                📄 RYVV-Statement-Sep.pdf
              </Bubble>
            </ChatThread>
          </PhoneFrame>
        </Reveal>
      </div>
    </Section>
  );
}
