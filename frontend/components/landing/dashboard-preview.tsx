import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

const ACTIVITY = [
  { label: "Gave Rahul", value: "-₹500", tone: "text-money-give" },
  { label: "Got from Priya", value: "+₹200", tone: "text-money-get" },
  { label: "Grocery shopping", value: "-₹1,240", tone: "" },
] as const;

const BALANCES = [
  { name: "Rahul", value: "₹1,200", tone: "text-money-get" },
  { name: "Meena", value: "₹2,400", tone: "text-money-get" },
  { name: "Priya", value: "-₹300", tone: "text-money-give" },
] as const;

export function DashboardPreview() {
  return (
    <Section>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <span className="text-xs font-bold tracking-[0.18em] text-primary">
            THE DASHBOARD
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl">
            The full picture, when you need it
          </h2>
          <p className="mt-5 leading-7 text-muted-foreground">
            The web app is where your history becomes useful: edit entries,
            filter activity, review contact balances, and understand every
            change.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 h-12 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Link href="/signup">Explore the dashboard</Link>
          </Button>
        </Reveal>

        <Reveal
          delay={110}
          className="rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-primary p-4 text-primary-foreground">
              <p className="text-xs opacity-75">Total balance</p>
              <p className="mt-3 text-xl font-bold tabular-nums">₹1,25,000</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">You will get</p>
              <p className="mt-3 text-xl font-bold tabular-nums text-money-get">
                ₹4,850
              </p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">You will give</p>
              <p className="mt-3 text-xl font-bold tabular-nums text-money-give">
                ₹1,240
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-bold">Recent activity</p>
              <ul className="mt-4 space-y-3 text-sm">
                {ACTIVITY.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-muted-foreground">
                      {row.label}
                    </span>
                    <b className={`tabular-nums ${row.tone}`}>{row.value}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold">Balances</p>
              <ul className="mt-4 space-y-3 text-sm">
                {BALANCES.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-muted-foreground">{row.name}</span>
                    <span className={`font-semibold tabular-nums ${row.tone}`}>
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
