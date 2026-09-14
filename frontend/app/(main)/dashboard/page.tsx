"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { StatCard, StatDrawer } from "@/components/app/stat-card";
import { BalanceChip } from "@/components/app/balance";
import {
  EmptyState,
  ErrorState,
  SkeletonCards,
  SkeletonRows,
} from "@/components/app/states";
import type { Dashboard, MonthStat } from "@/types/money";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  HandCoins,
  History,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

function DisclosureButton({
  open,
  onClick,
  label,
  className,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <ChevronDown
        className={cn("size-5 transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

function MonthPicker({
  months,
  selected,
  onSelect,
}: {
  months: MonthStat[];
  selected: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {months.map((m, idx) => (
        <button
          key={m.label}
          type="button"
          onClick={() => onSelect(idx)}
          aria-pressed={selected === idx}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            selected === idx
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<Dashboard>("/dashboard/summary")).data,
  });

  const [incomeMonthIdx, setIncomeMonthIdx] = useState(0);
  const [expenseMonthIdx, setExpenseMonthIdx] = useState(0);
  const [openBalance, setOpenBalance] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [openGet, setOpenGet] = useState(false);
  const [openGive, setOpenGive] = useState(false);

  const months = useMemo(() => data?.months ?? [], [data?.months]);
  const incomeMonth: MonthStat | undefined = months[incomeMonthIdx] ?? months[0];
  const expenseMonth: MonthStat | undefined =
    months[expenseMonthIdx] ?? months[0];

  const incomeValue = incomeMonth?.income_paise ?? data?.month_income_paise ?? 0;
  const expenseValue =
    expenseMonth?.expense_paise ?? data?.month_expense_paise ?? 0;

  const currentLabel = useMemo(() => {
    const cur = months.find((m) => m.is_current);
    return cur?.label ?? "This month";
  }, [months]);

  const header = (
    <PageHeader
      eyebrow="Dashboard"
      title="Your money at a glance"
      description="Balances, people, and this month's flow — all updated the moment you log something here or in Telegram."
      action={
        <Button asChild size="lg" className="h-11">
          <Link href="/transactions/new">
            <Plus className="size-4" aria-hidden /> Add transaction
          </Link>
        </Button>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        {header}
        <SkeletonCards count={6} />
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        {header}
        <ErrorState
          title="Could not load your dashboard"
          body="Check that you are online and the RYVV API is reachable, then try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Total balance */}
        <StatCard
          tone="invert"
          label="Total balance"
          value={formatINR(data.total_balance_paise)}
          hint={
            data.accounts.length === 0
              ? "On hand only"
              : `On hand + ${data.accounts.length} account${data.accounts.length === 1 ? "" : "s"}`
          }
          corner={
            <DisclosureButton
              open={openBalance}
              onClick={() => setOpenBalance((v) => !v)}
              label="Show money places"
              className="text-background/70 hover:bg-background/10 hover:text-background"
            />
          }
        >
          {openBalance ? (
            <StatDrawer>
              <ul className="space-y-2">
                <li className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <HandCoins className="size-3.5 text-primary" aria-hidden />
                    On hand
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatINR(data.on_hand_paise)}
                  </span>
                </li>
                {data.accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Wallet className="size-3.5 text-primary" aria-hidden />
                      {a.name}
                      <span className="text-xs uppercase text-muted-foreground">
                        {a.type}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatINR(a.balance_paise)}
                    </span>
                  </li>
                ))}
              </ul>
              {data.accounts.length === 0 ? (
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/accounts">
                    <Plus className="size-4" aria-hidden /> Add account
                  </Link>
                </Button>
              ) : (
                <Link
                  href="/accounts"
                  className="mt-3 block rounded-sm text-center text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Manage accounts →
                </Link>
              )}
            </StatDrawer>
          ) : null}
        </StatCard>

        {/* You will get */}
        <StatCard
          tone="get"
          label="You will get"
          value={formatINR(data.you_will_get_paise)}
          hint={`${data.get_contacts.length} ${data.get_contacts.length === 1 ? "person owes" : "people owe"} you · tap to open`}
          href="/contacts?filter=get"
          corner={
            <DisclosureButton
              open={openGet}
              onClick={() => setOpenGet((v) => !v)}
              label="Show people who owe you"
              className="text-money-get"
            />
          }
        >
          {openGet ? (
            <StatDrawer>
              {data.get_contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nobody owes you right now.
                </p>
              ) : (
                <ul className="space-y-1">
                  {data.get_contacts.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/contacts/${c.id}`}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="font-semibold tabular-nums text-money-get">
                          {formatINR(c.balance_paise)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </StatDrawer>
          ) : null}
        </StatCard>

        {/* You will give */}
        <StatCard
          tone="give"
          label="You will give"
          value={formatINR(data.you_will_give_paise)}
          hint={`${data.give_contacts.length} ${data.give_contacts.length === 1 ? "person" : "people"} waiting · tap to open`}
          href="/contacts?filter=give"
          corner={
            <DisclosureButton
              open={openGive}
              onClick={() => setOpenGive((v) => !v)}
              label="Show people you owe"
              className="text-money-give"
            />
          }
        >
          {openGive ? (
            <StatDrawer>
              {data.give_contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You owe nobody. Nice.
                </p>
              ) : (
                <ul className="space-y-1">
                  {data.give_contacts.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/contacts/${c.id}`}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="font-semibold tabular-nums text-money-give">
                          {formatINR(Math.abs(c.balance_paise))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </StatDrawer>
          ) : null}
        </StatCard>

        {/* Monthly income */}
        <StatCard
          tone="neutral"
          label="Month income"
          value={formatINR(incomeValue)}
          hint={`${incomeMonth?.label ?? currentLabel} · resets on the 1st`}
          valueClassName="text-money-get"
          corner={
            <DisclosureButton
              open={openIncome}
              onClick={() => setOpenIncome((v) => !v)}
              label="Pick income month"
              className="text-muted-foreground"
            />
          }
        >
          {openIncome ? (
            <StatDrawer>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Pick month
              </p>
              <MonthPicker
                months={months}
                selected={incomeMonthIdx}
                onSelect={setIncomeMonthIdx}
              />
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-sm">
                <span className="text-muted-foreground">Still to collect</span>
                <span className="font-semibold tabular-nums text-money-get">
                  {formatINR(data.you_will_get_paise)}
                </span>
              </div>
            </StatDrawer>
          ) : null}
        </StatCard>

        {/* Monthly expense */}
        <StatCard
          tone="neutral"
          label="Month expense"
          value={formatINR(expenseValue)}
          hint={`${expenseMonth?.label ?? currentLabel} · resets on the 1st`}
          valueClassName="text-money-give"
          corner={
            <DisclosureButton
              open={openExpense}
              onClick={() => setOpenExpense((v) => !v)}
              label="Pick expense month"
              className="text-muted-foreground"
            />
          }
        >
          {openExpense ? (
            <StatDrawer>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Pick month
              </p>
              <MonthPicker
                months={months}
                selected={expenseMonthIdx}
                onSelect={setExpenseMonthIdx}
              />
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-sm">
                <span className="text-muted-foreground">Still to pay back</span>
                <span className="font-semibold tabular-nums text-money-give">
                  {formatINR(data.you_will_give_paise)}
                </span>
              </div>
            </StatDrawer>
          ) : null}
        </StatCard>

        {/* Month net */}
        <StatCard
          tone="brand"
          label="Month net"
          value={formatINR(data.month_net_paise)}
          hint={`${currentLabel} · income − expense`}
          valueClassName={
            data.month_net_paise >= 0 ? "text-money-get" : "text-money-give"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Contacts"
            description="Everyone you track money with."
            action={
              <Link
                href="/contacts"
                className="rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                View all
              </Link>
            }
          />
          {(data.contacts || []).length === 0 ? (
            <PanelBody>
              <EmptyState
                icon={Users}
                title="No contacts yet"
                body="Add the people you lend to and borrow from, or just say “gave Rahul 500” in Telegram."
                action={
                  <Button asChild>
                    <Link href="/contacts">
                      <Plus className="size-4" aria-hidden /> Add contact
                    </Link>
                  </Button>
                }
                className="border-0 bg-transparent py-6"
              />
            </PanelBody>
          ) : (
            <ul className="divide-y divide-border">
              {(data.contacts || []).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50 sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {c.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Added {formatDateTime(c.created_at)}
                      </span>
                    </span>
                    <BalanceChip paise={c.balance_paise} compact />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent activity"
            description="Every create, edit, delete and settle — web and Telegram."
          />
          {(data.activity || []).length === 0 ? (
            <PanelBody>
              <EmptyState
                icon={History}
                title="Nothing logged yet"
                body="Your first transaction will show up here with a full audit trail."
                className="border-0 bg-transparent py-6"
              />
            </PanelBody>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {(data.activity || []).map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 px-4 py-3.5 text-sm sm:px-5"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    {a.action === "deleted" ? (
                      <Trash2
                        className="mt-0.5 size-4 shrink-0 text-money-give"
                        aria-hidden
                      />
                    ) : a.action === "settled" ? (
                      <HandCoins
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : a.action === "created" ? (
                      <ArrowDownLeft
                        className="mt-0.5 size-4 shrink-0 text-money-get"
                        aria-hidden
                      />
                    ) : (
                      <ArrowUpRight
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="capitalize">{a.action}</span>
                        {" · "}
                        {a.entity_type}
                        {a.detail ? ` · ${a.detail}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(a.created_at)}
                      </p>
                    </div>
                  </div>
                  {a.amount_paise != null && a.amount_paise !== 0 ? (
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatINR(Math.abs(a.amount_paise))}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
