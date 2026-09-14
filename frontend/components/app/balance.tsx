import { cn, formatINR } from "@/lib/utils";

export type BalanceState = "get" | "give" | "settled";

export function balanceState(paise: number): BalanceState {
  if (paise > 0) return "get";
  if (paise < 0) return "give";
  return "settled";
}

const CHIP: Record<BalanceState, string> = {
  get: "bg-money-get-soft text-money-get",
  give: "bg-money-give-soft text-money-give",
  settled: "bg-money-settled-soft text-money-settled",
};

const TEXT: Record<BalanceState, string> = {
  get: "text-money-get",
  give: "text-money-give",
  settled: "text-money-settled",
};

const HINT: Record<BalanceState, string> = {
  get: "They owe you",
  give: "You owe them",
  settled: "Balance is zero",
};

function label(paise: number, compact: boolean) {
  const state = balanceState(paise);
  const amount = formatINR(Math.abs(paise));
  if (state === "settled") return compact ? "Settled" : "Settled ₹0";
  if (state === "get") return compact ? `Get ${amount}` : `You will get ${amount}`;
  return compact ? `Give ${amount}` : `You will give ${amount}`;
}

export function BalanceChip({
  paise,
  compact = false,
  className,
}: {
  paise: number;
  compact?: boolean;
  className?: string;
}) {
  const state = balanceState(paise);
  return (
    <span
      title={HINT[state]}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold tabular-nums",
        CHIP[state],
        className
      )}
    >
      {label(paise, compact)}
    </span>
  );
}

export function BalanceText({
  paise,
  compact = false,
  className,
}: {
  paise: number;
  compact?: boolean;
  className?: string;
}) {
  const state = balanceState(paise);
  return (
    <span
      className={cn("font-semibold tabular-nums", TEXT[state], className)}
    >
      {label(paise, compact)}
    </span>
  );
}

export const balanceTextClass = TEXT;
