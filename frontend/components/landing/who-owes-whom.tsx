import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

const PEOPLE = [
  {
    initial: "R",
    name: "Rahul",
    chip: "You will get ₹1,200",
    hint: "They owe you",
    chipClass: "bg-money-get-soft text-money-get",
    avatarClass: "bg-money-get-soft text-money-get",
  },
  {
    initial: "P",
    name: "Priya",
    chip: "You will give ₹300",
    hint: "You owe them",
    chipClass: "bg-money-give-soft text-money-give",
    avatarClass: "bg-money-give-soft text-money-give",
  },
  {
    initial: "A",
    name: "Aarav",
    chip: "Settled ₹0",
    hint: "Balance is zero",
    chipClass: "bg-money-settled-soft text-money-settled",
    avatarClass: "bg-money-settled-soft text-money-settled",
  },
] as const;

const FLOW = [
  { label: "Gave", className: "bg-money-give-soft text-money-give" },
  { label: "Got", className: "bg-money-get-soft text-money-get" },
  { label: "Settle", className: "bg-money-settled-soft text-money-settled" },
] as const;

export function WhoOwesWhom() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="YOUR MONEY, CLEARLY"
        title="Know who owes whom"
        body="Gave, Got, and Settle make every personal balance easy to understand."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Reveal className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="font-bold">People</span>
            <span className="text-sm text-muted-foreground">
              3 active balances
            </span>
          </div>
          <ul>
            {PEOPLE.map((person, i) => (
              <li
                key={person.name}
                className={cn(
                  "group flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/60",
                  i < PEOPLE.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      person.avatarClass
                    )}
                  >
                    {person.initial}
                  </span>
                  <span className="truncate font-semibold">{person.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    title={person.hint}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold tabular-nums",
                      person.chipClass
                    )}
                  >
                    {person.chip}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 text-muted-foreground transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          delay={100}
          className="flex flex-col justify-center rounded-2xl bg-muted/60 p-6 sm:p-8"
        >
          <h3 className="font-display text-2xl font-bold">
            A simple flow for every person
          </h3>
          <p className="mt-4 leading-7 text-muted-foreground">
            Use Gave when money goes out, Got when it comes back, and Settle
            when the balance is complete. Settle always brings a person to ₹0.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {FLOW.map((item) => (
              <span
                key={item.label}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold",
                  item.className
                )}
              >
                {item.label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
