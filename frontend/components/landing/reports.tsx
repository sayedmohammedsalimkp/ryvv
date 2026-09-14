import { Download, FileText } from "lucide-react";
import { Section } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

const TAGS = ["PDF statements", "CSV export", "Date ranges"] as const;

const LINES = [
  { label: "Opening balance", value: "₹1,01,340.50", tone: "" },
  { label: "Income", value: "+₹42,000", tone: "text-money-get" },
  { label: "Expenses", value: "-₹18,340", tone: "text-money-give" },
] as const;

export function Reports() {
  return (
    <Section id="reports" tone="muted">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <span className="text-xs font-bold tracking-[0.18em] text-primary">
            REPORTS
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl">
            Your money, ready to share
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
            Generate PDF and CSV statements per person or by date range. Request
            them from the web or simply ask the bot.
          </p>
          <ul className="mt-7 flex flex-wrap gap-3">
            {TAGS.map((tag) => (
              <li
                key={tag}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          delay={110}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <FileText className="size-5" />
              </span>
              <div>
                <p className="font-bold">RYVV Statement</p>
                <p className="text-xs text-muted-foreground">September 2026</p>
              </div>
            </div>
            <Download
              aria-hidden
              className="size-5 shrink-0 text-muted-foreground"
            />
          </div>

          <dl className="space-y-4 py-5 text-sm">
            {LINES.map((line) => (
              <div
                key={line.label}
                className="flex items-center justify-between gap-3"
              >
                <dt className="text-muted-foreground">{line.label}</dt>
                <dd className={`font-bold tabular-nums ${line.tone}`}>
                  {line.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between border-t border-border pt-4 font-bold">
            <span>Closing balance</span>
            <span className="tabular-nums">₹1,25,000.50</span>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
