import { cn, formatDateOnly, formatDateTime, formatINR } from "@/lib/utils";
import type { Transaction, TxnType } from "@/types/money";

/** Money leaving your pocket reads red, money arriving reads green. */
const TYPE_TONE: Partial<Record<TxnType, string>> = {
  income: "text-money-get",
  received: "text-money-get",
  borrowed: "text-money-get",
  expense: "text-money-give",
  gave: "text-money-give",
  lent: "text-money-give",
};

export function TxnList({
  transactions,
  showAccount = false,
}: {
  transactions: Transaction[];
  showAccount?: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {transactions.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-accent/40 sm:px-5"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold capitalize">
              {t.type}
              {t.contact_name ? ` · ${t.contact_name}` : ""}
              {t.category_name ? ` · ${t.category_name}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateOnly(t.txn_date)}
              {showAccount ? ` · ${t.account_name ?? "On hand"}` : ""}
              {t.note ? ` · ${t.note}` : ""}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Logged {formatDateTime(t.created_at)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 font-semibold tabular-nums",
              TYPE_TONE[t.type]
            )}
          >
            {formatINR(t.amount_paise)}
          </span>
        </li>
      ))}
    </ul>
  );
}
