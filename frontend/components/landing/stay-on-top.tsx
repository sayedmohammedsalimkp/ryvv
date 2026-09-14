import { BellRing, Sparkles, Sunrise } from "lucide-react";
import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

const ITEMS = [
  {
    icon: Sunrise,
    title: "Daily digest",
    body: "Start your day with a clear view of balances and recent activity in Telegram.",
  },
  {
    icon: BellRing,
    title: "Pending dues",
    body: "Gentle reminders for balances that still need your attention.",
  },
  {
    icon: Sparkles,
    title: "Spending alerts",
    body: "Know when your month is moving faster than planned.",
  },
] as const;

export function StayOnTop() {
  return (
    <Section>
      <SectionHeading
        align="center"
        eyebrow="STAY ON TOP"
        title="Helpful, not noisy"
      />

      <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, body }, i) => (
          <Reveal
            key={title}
            delay={i * 80}
            className="rounded-2xl border border-border p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <Icon className="size-6 text-primary" aria-hidden />
            <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
