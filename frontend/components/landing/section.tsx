import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** Background treatment for the band. */
  tone?: "default" | "muted" | "tint" | "ink";
};

const TONES: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-background",
  muted: "bg-muted/50",
  tint: "bg-primary/5",
  ink: "bg-foreground text-background",
};

export function Section({
  id,
  children,
  className,
  tone = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 px-5 py-16 sm:px-8 md:py-24 lg:px-12",
        TONES[tone],
        className
      )}
    >
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <span className="text-xs font-bold tracking-[0.18em] text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-3xl font-bold -tracking-[0.03em] sm:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-base leading-7 text-muted-foreground">{body}</p>
      ) : null}
    </Reveal>
  );
}
