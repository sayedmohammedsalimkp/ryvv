import { cn } from "@/lib/utils";
import { Section } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

type Place = {
  label: string;
  value: string;
  note: string;
  /** On hand gets the inverted treatment — it is the default money pocket. */
  primary?: boolean;
};

const PLACES: Place[] = [
  {
    label: "On hand",
    value: "₹82,430.50",
    note: "Default cash pocket",
    primary: true,
  },
  { label: "UPI", value: "₹24,850.00", note: "PhonePe · GPay" },
  { label: "Bank", value: "₹17,720.00", note: "Savings account" },
  { label: "Other", value: "₹0.00", note: "Add a place anytime" },
];

export function MoneyPlaces() {
  return (
    <Section tone="muted">
      <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold tracking-[0.18em] text-primary">
            MONEY PLACES
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl">
            Your money, wherever it lives
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Separate your everyday cash from UPI, bank, and other accounts.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACES.map((place, i) => (
          <Reveal
            key={place.label}
            delay={i * 70}
            className={cn(
              "rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1",
              place.primary
                ? "bg-foreground text-background"
                : "border border-border bg-card"
            )}
          >
            <p
              className={cn(
                "text-sm",
                place.primary ? "text-background/60" : "text-muted-foreground"
              )}
            >
              {place.label}
            </p>
            <p className="mt-7 text-2xl font-bold tabular-nums">
              {place.value}
            </p>
            <p
              className={cn(
                "mt-2 text-xs",
                place.primary ? "text-background/60" : "text-muted-foreground"
              )}
            >
              {place.note}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal
        delay={120}
        className="mt-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 p-6"
      >
        <div>
          <p className="text-sm text-muted-foreground">Total balance</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">₹1,25,000.50</p>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Month income</p>
            <p className="mt-1 font-bold tabular-nums text-money-get">
              ₹42,000
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Month expense</p>
            <p className="mt-1 font-bold tabular-nums text-money-give">
              ₹18,340
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
