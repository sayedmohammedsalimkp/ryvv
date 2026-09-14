"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { downloadExport, ryvvReportName } from "@/lib/download";
import { cn, formatDateOnly, formatDateTime, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { Modal } from "@/components/app/modal";
import { Field } from "@/components/app/field";
import { BalanceChip } from "@/components/app/balance";
import {
  EmptyState,
  ErrorState,
  InlineLoading,
  SkeletonRows,
} from "@/components/app/states";
import type { Contact, Transaction, TxnType } from "@/types/money";
import { Download, History, Pencil, Trash2 } from "lucide-react";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editType, setEditType] = useState<TxnType>("gave");
  const [editDate, setEditDate] = useState("");
  const [reportBusy, setReportBusy] = useState<"csv" | "pdf" | null>(null);
  const [reportError, setReportError] = useState("");

  const contactQ = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => (await api.get<Contact>(`/contacts/${id}`)).data,
  });

  const txnsQ = useQuery({
    queryKey: ["transactions", "contact", id],
    queryFn: async () =>
      (
        await api.get<Transaction[]>("/transactions", {
          params: { contact_id: id },
        })
      ).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["contact", id] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["contacts"] });
  };

  const addTxn = useMutation({
    mutationFn: async (type: "gave" | "received") =>
      api.post("/transactions", {
        type,
        amount_rupees: Number(amount),
        contact_id: id,
        note: note || null,
      }),
    onSuccess: () => {
      invalidate();
      setAmount("");
      setNote("");
    },
  });

  const markBalance = useMutation({
    mutationFn: async (type: "gave" | "received") => {
      const bal = contactQ.data?.balance_paise ?? 0;
      const rupees =
        type === "received" && bal > 0
          ? bal / 100
          : type === "gave" && bal < 0
            ? Math.abs(bal) / 100
            : Number(amount);
      if (!rupees || rupees <= 0) throw new Error("Enter amount");
      return api.post("/transactions", {
        type,
        amount_rupees: rupees,
        contact_id: id,
        note: note || null,
      });
    },
    onSuccess: () => {
      invalidate();
      setAmount("");
      setNote("");
    },
  });

  const remove = useMutation({
    mutationFn: async () => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.replace("/contacts");
    },
  });

  const settleAll = useMutation({
    mutationFn: async () => api.post(`/contacts/${id}/settle`),
    onSuccess: () => {
      invalidate();
      setConfirmSettle(false);
    },
  });

  const updateTxn = useMutation({
    mutationFn: async () =>
      api.patch(`/transactions/${editing!.id}`, {
        type: editType,
        amount_rupees: Number(editAmount),
        note: editNote || null,
        txn_date: editDate || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setEditAmount(String(t.amount_rupees));
    setEditNote(t.note || "");
    setEditType(t.type === "received" ? "received" : "gave");
    setEditDate(t.txn_date?.slice(0, 10) || "");
  };

  async function downloadReport(kind: "csv" | "pdf") {
    setReportBusy(kind);
    setReportError("");
    try {
      await downloadExport(
        kind === "csv" ? "/export/csv" : "/export/pdf",
        ryvvReportName(kind, contactQ.data?.name || "contact"),
        { contact_id: id }
      );
    } catch (e: unknown) {
      setReportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setReportBusy(null);
    }
  }

  const c = contactQ.data;

  if (contactQ.isLoading) {
    return (
      <div className="space-y-8">
        <InlineLoading label="Loading contact…" />
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (!c) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contact not found"
          back={{ href: "/contacts", label: "Contacts" }}
        />
        <ErrorState
          title="This contact is gone"
          body="It may have been deleted from the web app or from Telegram."
        />
      </div>
    );
  }

  const busy = addTxn.isPending || markBalance.isPending;
  const isSettled = c.balance_paise === 0;
  const txns = txnsQ.data || [];

  const onGave = () => {
    if (amount && Number(amount) > 0) {
      addTxn.mutate("gave");
      return;
    }
    if (c.balance_paise < 0) {
      markBalance.mutate("gave");
      return;
    }
  };

  const onGot = () => {
    if (amount && Number(amount) > 0) {
      addTxn.mutate("received");
      return;
    }
    if (c.balance_paise > 0) {
      markBalance.mutate("received");
      return;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={c.name}
        back={{ href: "/contacts", label: "Contacts" }}
        action={
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={remove.isPending}
          >
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BalanceChip paise={c.balance_paise} />
          <span className="text-xs text-muted-foreground">
            Added {formatDateTime(c.created_at)}
            {c.phone ? ` · ${c.phone}` : ""}
          </span>
        </div>
      </PageHeader>

      <Panel>
        <PanelHeader
          title="Log money"
          description="Gave and Got record money. Settle clears the balance to ₹0."
        />
        <PanelBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (₹)" htmlFor="amount">
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={
                  !isSettled
                    ? `Leave empty to use ${formatINR(Math.abs(c.balance_paise))}`
                    : "0.00"
                }
              />
            </Field>
            <Field label="Note" htmlFor="note">
              <Input
                id="note"
                placeholder="Optional"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              type="button"
              className="h-11 bg-money-give text-white hover:bg-money-give/90"
              disabled={
                busy || (!(amount && Number(amount) > 0) && c.balance_paise >= 0)
              }
              onClick={onGave}
            >
              Gave
            </Button>
            <Button
              type="button"
              className="h-11 bg-money-get text-white hover:bg-money-get/90"
              disabled={
                busy || (!(amount && Number(amount) > 0) && c.balance_paise <= 0)
              }
              onClick={onGot}
            >
              Got
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={isSettled || settleAll.isPending}
              onClick={() => setConfirmSettle(true)}
            >
              Settle to ₹0
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Statement"
          description={`Report for ${c.name} only — the same layout the Telegram bot sends.`}
        />
        <PanelBody className="space-y-3">
          {reportError ? (
            <ErrorState title="Export failed" body={reportError} />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!!reportBusy}
              onClick={() => downloadReport("pdf")}
            >
              <Download className="size-4" aria-hidden />
              {reportBusy === "pdf" ? "Preparing…" : "PDF statement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!reportBusy}
              onClick={() => downloadReport("csv")}
            >
              <Download className="size-4" aria-hidden />
              {reportBusy === "csv" ? "Preparing…" : "CSV"}
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="History"
          description={`${txns.length} ${txns.length === 1 ? "entry" : "entries"} with this contact`}
        />
        {txnsQ.isLoading ? (
          <PanelBody>
            <InlineLoading />
          </PanelBody>
        ) : txns.length === 0 ? (
          <PanelBody>
            <EmptyState
              icon={History}
              title="No entries yet"
              body="Log a Gave or Got above, or send it to the Telegram bot — it lands here instantly."
              className="border-0 bg-transparent py-6"
            />
          </PanelBody>
        ) : (
          <ul className="divide-y divide-border">
            {txns.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm sm:px-5"
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-medium tabular-nums",
                      t.type === "gave" && "text-money-give",
                      t.type === "received" && "text-money-get",
                      t.settled_at && "opacity-60"
                    )}
                  >
                    {t.type === "gave"
                      ? "Gave"
                      : t.type === "received"
                        ? "Got"
                        : t.type}
                    {" · "}
                    {formatINR(t.amount_paise)}
                    {t.settled_at ? " · cleared" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateOnly(t.txn_date)}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Logged {formatDateTime(t.created_at)}
                    {t.settled_at
                      ? ` · Cleared ${formatDateTime(t.settled_at)} in a ₹0 settle`
                      : ""}
                  </p>
                </div>
                {!t.settled_at ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => openEdit(t)}
                    aria-label={`Edit ${t.type} entry`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        open={confirmSettle}
        onClose={() => setConfirmSettle(false)}
        busy={settleAll.isPending}
        title="Settle to ₹0?"
        description={
          <>
            Set your balance with{" "}
            <span className="font-semibold text-foreground">{c.name}</span> to{" "}
            <span className="font-semibold text-foreground">₹0</span>. Current
            balance is{" "}
            <span className="font-semibold text-foreground">
              {formatINR(Math.abs(c.balance_paise))}
            </span>
            . Past entries stay in history, marked as cleared.
          </>
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmSettle(false)}
              disabled={settleAll.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={settleAll.isPending}
              onClick={() => settleAll.mutate()}
            >
              {settleAll.isPending ? "Settling…" : "Yes, settle"}
            </Button>
          </>
        }
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        busy={remove.isPending}
        title="Delete contact?"
        description={
          <>
            Delete{" "}
            <span className="font-semibold text-foreground">{c.name}</span>?
            This is recorded in your activity log.
          </>
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "Deleting…" : "Yes, delete"}
            </Button>
          </>
        }
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        busy={updateTxn.isPending}
        title="Edit entry"
        description="Every change is written to your activity log."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(null)}
              disabled={updateTxn.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={
                updateTxn.isPending || !editAmount || Number(editAmount) <= 0
              }
              onClick={() => updateTxn.mutate()}
            >
              {updateTxn.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEditType("gave")}
            aria-pressed={editType === "gave"}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-semibold transition-colors",
              editType === "gave"
                ? "border-transparent bg-money-give text-white"
                : "border-input hover:bg-accent"
            )}
          >
            Gave
          </button>
          <button
            type="button"
            onClick={() => setEditType("received")}
            aria-pressed={editType === "received"}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-semibold transition-colors",
              editType === "received"
                ? "border-transparent bg-money-get text-white"
                : "border-input hover:bg-accent"
            )}
          >
            Got
          </button>
        </div>
        <Field label="Amount (₹)" htmlFor="edit-amount">
          <Input
            id="edit-amount"
            type="number"
            min="0.01"
            step="0.01"
            required
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
