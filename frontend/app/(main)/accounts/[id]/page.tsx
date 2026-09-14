"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { TxnList } from "@/components/app/txn-list";
import {
  EmptyState,
  ErrorState,
  InlineLoading,
  SkeletonRows,
} from "@/components/app/states";
import type { Account, Transaction } from "@/types/money";
import { ArrowLeftRight, Wallet } from "lucide-react";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();

  const accountQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get<Account[]>("/accounts")).data,
  });

  const account = (accountQ.data || []).find((a) => a.id === id);

  const txnsQ = useQuery({
    queryKey: ["transactions", "account", id],
    queryFn: async () =>
      (
        await api.get<Transaction[]>("/transactions", {
          params: { account_id: id },
        })
      ).data,
    enabled: !!id,
  });

  if (accountQ.isLoading) {
    return (
      <div className="space-y-8">
        <InlineLoading label="Loading account…" />
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Account not found"
          back={{ href: "/accounts", label: "Money places" }}
        />
        <ErrorState
          title="This money place is gone"
          body="It may have been deleted — its transactions moved back to On hand."
        />
      </div>
    );
  }

  const txns = txnsQ.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={account.type}
        title={account.name}
        description="Everything logged against this money place."
        back={{ href: "/accounts", label: "Money places" }}
      />

      <div className="rounded-2xl bg-foreground p-6 text-background sm:p-7">
        <p className="flex items-center gap-2 text-sm text-background/60">
          <Wallet className="size-4" aria-hidden />
          Current balance
        </p>
        <p className="mt-6 font-display text-3xl font-bold tabular-nums">
          {formatINR(account.balance_paise)}
        </p>
        <p className="mt-2 text-xs text-background/60">
          Opening {formatINR(account.opening_balance_paise)} · {txns.length}{" "}
          {txns.length === 1 ? "entry" : "entries"}
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
              icon={ArrowLeftRight}
              title="Nothing here yet"
              body="Pick this account when adding a transaction and it will show up here."
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
