"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDateOnly, formatDateTime, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody } from "@/components/app/panel";
import { Modal } from "@/components/app/modal";
import { Chip, Field, Select } from "@/components/app/field";
import { EmptyState, SkeletonRows } from "@/components/app/states";
import type {
  Account,
  Category,
  Contact,
  Transaction,
  TxnType,
} from "@/types/money";
import { ArrowLeftRight, Pencil, Plus } from "lucide-react";

const EDIT_TYPES: TxnType[] = [
  "income",
  "expense",
  "gave",
  "received",
  "borrowed",
  "lent",
  "settle",
];

/** Money leaving your pocket reads red, money arriving reads green. */
const TYPE_TONE: Partial<Record<TxnType, string>> = {
  income: "text-money-get",
  received: "text-money-get",
  borrowed: "text-money-get",
  expense: "text-money-give",
  gave: "text-money-give",
  lent: "text-money-give",
};

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<TxnType>("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editContactId, setEditContactId] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["transactions", type, dateFrom, dateTo],
    queryFn: async () =>
      (
        await api.get<Transaction[]>("/transactions", {
          params: {
            type: type || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          },
        })
      ).data,
  });

  const contactsQ = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => (await api.get<Contact[]>("/contacts")).data,
    enabled: !!editing,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get<Account[]>("/accounts")).data,
    enabled: !!editing,
  });
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
    enabled: !!editing,
  });

  const update = useMutation({
    mutationFn: async () =>
      api.patch(`/transactions/${editing!.id}`, {
        type: editType,
        amount_rupees: Number(editAmount),
        txn_date: editDate || undefined,
        note: editNote || null,
        contact_id: editContactId || null,
        account_id: editAccountId || null,
        category_id: editCategoryId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setEditing(null);
    },
  });

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setEditType(t.type);
    setEditAmount(String(t.amount_rupees));
    setEditDate(t.txn_date?.slice(0, 10) || "");
    setEditNote(t.note || "");
    setEditContactId(t.contact_id || "");
    setEditAccountId(t.account_id || "");
    setEditCategoryId(t.category_id || "");
  };

  const hasFilters = !!(type || dateFrom || dateTo);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        description="Everything you and the Telegram bot have logged. Edit any entry — the change is written to your activity log."
        action={
          <Button asChild size="lg" className="h-11">
            <Link href="/transactions/new">
              <Plus className="size-4" aria-hidden /> New transaction
            </Link>
          </Button>
        }
      />

      <Panel>
        <PanelBody className="grid gap-3 sm:grid-cols-3">
          <Field label="Type" htmlFor="filter-type">
            <Select
              id="filter-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              {EDIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From" htmlFor="filter-from">
            <Input
              id="filter-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Field>
          <Field label="To" htmlFor="filter-to">
            <Input
              id="filter-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Field>
        </PanelBody>
      </Panel>

      {isLoading ? (
        <SkeletonRows count={6} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={hasFilters ? "Nothing matches these filters" : "No transactions yet"}
          body={
            hasFilters
              ? "Widen the date range or clear the type filter to see more."
              : "Add your first entry here, or tell the Telegram bot “spent 240 on groceries”."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setType("");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/transactions/new">
                  <Plus className="size-4" aria-hidden /> New transaction
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-border">
            {data.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold capitalize">
                    {t.type}
                    {t.contact_name ? ` · ${t.contact_name}` : ""}
                    {t.category_name ? ` · ${t.category_name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateOnly(t.txn_date)}
                    {t.account_name ? ` · ${t.account_name}` : " · On hand"}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Logged {formatDateTime(t.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      TYPE_TONE[t.type]
                    )}
                  >
                    {formatINR(t.amount_paise)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(t)}
                    aria-label={`Edit ${t.type} entry`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        busy={update.isPending}
        title="Edit transaction"
        description="Update is written to your activity log."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(null)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={
                update.isPending || !editAmount || Number(editAmount) <= 0
              }
              onClick={() => update.mutate()}
            >
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {EDIT_TYPES.map((t) => (
            <Chip
              key={t}
              selected={editType === t}
              onClick={() => setEditType(t)}
            >
              {t}
            </Chip>
          ))}
        </div>

        <Field label="Amount (₹)" htmlFor="edit-amount">
          <Input
            id="edit-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
          />
        </Field>
        <Field label="Date" htmlFor="edit-date">
          <Input
            id="edit-date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
        </Field>
        <Field label="Contact" htmlFor="edit-contact">
          <Select
            id="edit-contact"
            value={editContactId}
            onChange={(e) => setEditContactId(e.target.value)}
          >
            <option value="">None</option>
            {(contactsQ.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Account" htmlFor="edit-account">
          <Select
            id="edit-account"
            value={editAccountId}
            onChange={(e) => setEditAccountId(e.target.value)}
          >
            <option value="">On hand</option>
            {(accountsQ.data || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </Select>
        </Field>
        {editType === "income" || editType === "expense" ? (
          <Field label="Category" htmlFor="edit-category">
            <Select
              id="edit-category"
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
            >
              <option value="">None</option>
              {(categoriesQ.data || [])
                .filter((c) => c.kind === editType)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Note" htmlFor="edit-note">
          <Input
            id="edit-note"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
          />
        </Field>
      </Modal>
    </div>
  );
}
