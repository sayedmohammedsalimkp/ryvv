"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { StatCard } from "@/components/app/stat-card";
import { Modal } from "@/components/app/modal";
import { Field, Select } from "@/components/app/field";
import type { Account } from "@/types/money";
import { Trash2 } from "lucide-react";

type OnHand = { name: string; balance_paise: number };

export default function AccountsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<"upi" | "bank" | "other">("upi");
  const [opening, setOpening] = useState("0");
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get<Account[]>("/accounts")).data,
  });

  const onHandQ = useQuery({
    queryKey: ["accounts", "on-hand"],
    queryFn: async () => (await api.get<OnHand>("/accounts/on-hand")).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      api.post("/accounts", {
        name,
        type,
        opening_balance_rupees: Number(opening) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setName("");
      setOpening("0");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setConfirmDelete(null);
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money places"
        title="Your money, wherever it lives"
        description="On hand is the default pocket. Add UPI, bank, or other places when you want them separated. Delete a place and its money returns to On hand."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="invert"
          label="On hand"
          value={
            onHandQ.isLoading
              ? "…"
              : formatINR(onHandQ.data?.balance_paise ?? 0)
          }
          hint="Default cash pocket · tap for entries"
          href="/accounts/on-hand"
        />

        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-[148px] animate-pulse rounded-2xl border border-border bg-card"
              />
            ))
          : data.map((a) => (
              <StatCard
                key={a.id}
                tone="neutral"
                label={a.type.toUpperCase()}
                value={formatINR(a.balance_paise)}
                hint={`${a.name} · tap for entries`}
                href={`/accounts/${a.id}`}
                corner={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(a)}
                    aria-label={`Delete ${a.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            ))}
      </div>

      <form
        className="max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Panel>
          <PanelHeader
            title="Add a money place"
            description="Opening balance counts toward your total right away."
          />
          <PanelBody className="space-y-4">
            <Field label="Name" htmlFor="account-name">
              <Input
                id="account-name"
                required
                placeholder="PhonePe, HDFC savings…"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Type" htmlFor="account-type">
              <Select
                id="account-type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "upi" | "bank" | "other")
                }
              >
                <option value="upi">UPI</option>
                <option value="bank">Bank</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Opening balance (₹)" htmlFor="account-opening">
              <Input
                id="account-opening"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              className="w-full"
              disabled={create.isPending || !name.trim()}
            >
              {create.isPending ? "Saving…" : "Add money place"}
            </Button>
          </PanelBody>
        </Panel>
      </form>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        busy={remove.isPending}
        title="Delete this money place?"
        description={
          confirmDelete ? (
            <>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {confirmDelete.name}
              </span>
              ? Every linked transaction moves to{" "}
              <span className="font-semibold text-foreground">On hand</span>.
              Current balance {formatINR(confirmDelete.balance_paise)}.
            </>
          ) : null
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={remove.isPending}
              onClick={() =>
                confirmDelete ? remove.mutate(confirmDelete.id) : undefined
              }
            >
              {remove.isPending ? "Deleting…" : "Delete → On hand"}
            </Button>
          </>
        }
      />
    </div>
  );
}
