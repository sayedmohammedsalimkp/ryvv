import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

type Step = {
  n: number;
  title: string;
  body: string;
  code?: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Create your RYVV account",
    body: "Start with the account that owns your money history.",
  },
  {
    n: 2,
    title: "Link Telegram with your one-time code",
    body: "Send the code to the bot once — it stays linked after that.",
    code: "/start 4F9K2A",
  },
  {
    n: 3,
    title: "Log from chat or web — always in sync",
    body: "Your phone and dashboard stay on the same data.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="muted">
      <SectionHeading
        align="center"
        eyebrow="HOW IT WORKS"
        title="From first message to full picture"
        body="A simple setup keeps every rupee in one trusted place."
      />

      <ol className="relative mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
        <span
          aria-hidden
          className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-border md:block"
        />
        {STEPS.map((step, i) => (
          <Reveal
            as="li"
            key={step.n}
            delay={i * 90}
            className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card focus-within:border-primary/30"
          >
            <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {step.n}
            </span>
            <h3 className="mt-7 font-display text-xl font-bold leading-snug">
              {step.title}
            </h3>
            {step.code ? (
              <span className="mt-4 inline-flex rounded-md bg-foreground px-3 py-2 font-mono text-xs text-background">
                {step.code}
              </span>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-muted-foreground transition-opacity duration-300 md:opacity-70 md:group-hover:opacity-100">
              {step.body}
            </p>
            <ArrowUpRight
              aria-hidden
              className="mt-6 size-5 text-primary transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
