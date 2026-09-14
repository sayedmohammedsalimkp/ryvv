"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { TxnList } from "@/components/app/txn-list";
import { EmptyState, InlineLoading } from "@/components/app/states";
import type { Transaction } from "@/types/money";
import { HandCoins } from "lucide-react";

type OnHand = { name: string; balance_paise: number };

export default function OnHandPage() {
  const balQ = useQuery({
    queryKey: ["accounts", "on-hand"],
    queryFn: async () => (await api.get<OnHand>("/accounts/on-hand")).data,
  });

  const txnsQ = useQuery({
    queryKey: ["transactions", "on-hand"],
    queryFn: async () =>
      (
        await api.get<Transaction[]>("/transactions", {
          params: { on_hand: true },
        })
      ).data,
  });

  const txns = txnsQ.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money place"
        title="On hand"
        description="Cash that is not linked to UPI, bank, or any other place. This is where money goes by default."
        back={{ href: "/accounts", label: "Money places" }}
      />

      <div className="rounded-2xl bg-foreground p-6 text-background sm:p-7">
        <p className="flex items-center gap-2 text-sm text-background/60">
          <HandCoins className="size-4" aria-hidden />
          Current balance
        </p>
        <p className="mt-6 font-display text-3xl font-bold tabular-nums">
          {balQ.isLoading ? "…" : formatINR(balQ.data?.balance_paise ?? 0)}
        </p>
        <p className="mt-2 text-xs text-background/60">
          {txns.length} {txns.length === 1 ? "entry" : "entries"} recorded here
        </p>
      </div>

      <Panel>
        <PanelHeader title="Transactions" description="Newest first" />
        {txnsQ.isLoading ? (
          <PanelBody>
            <InlineLoading />
          </PanelBody>
        ) : txns.length === 0 ? (
          <PanelBody>
            <EmptyState
              icon={HandCoins}
              title="No On hand entries yet"
              body="Anything you log without picking an account shows up here."
              className="border-0 bg-transparent py-6"
            />
          </PanelBody>
        ) : (
          <TxnList transactions={txns} />
        )}
      </Panel>
    </div>
  );
}
