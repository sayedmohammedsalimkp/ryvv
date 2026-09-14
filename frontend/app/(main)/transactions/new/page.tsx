"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody } from "@/components/app/panel";
import { Chip, Field, Select } from "@/components/app/field";
import { ErrorState } from "@/components/app/states";
import type { Account, Category, Contact, TxnType } from "@/types/money";
import { Loader2, Send } from "lucide-react";

const ALL_TYPES: TxnType[] = [
  "income",
  "expense",
  "gave",
  "received",
  "borrowed",
  "lent",
  "settle",
];

const TYPE_HINT: Record<TxnType, string> = {
  income: "Money coming in — salary, sale, refund.",
  expense: "Money going out — groceries, fuel, bills.",
  gave: "You handed money to a contact.",
  received: "A contact handed money to you.",
  borrowed: "You took money from a contact as a loan.",
  lent: "You gave a contact money as a loan.",
  settle: "Close out a balance with a contact.",
};

export default function NewTransactionPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [txnDate, setTxnDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [contactId, setContactId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const contactsQ = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => (await api.get<Contact[]>("/contacts")).data,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get<Account[]>("/accounts")).data,
  });
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  });

  const needsContact = ["gave", "received", "borrowed", "lent", "settle"].includes(
    type
  );
  const filteredCats = useMemo(() => {
    const cats = categoriesQ.data || [];
    if (type === "income") return cats.filter((c) => c.kind === "income");
    if (type === "expense") return cats.filter((c) => c.kind === "expense");
    return cats;
  }, [categoriesQ.data, type]);

  const create = useMutation({
    mutationFn: async () =>
      api.post("/transactions", {
        type,
        amount_rupees: Number(amount),
        txn_date: txnDate,
        note: note || null,
        contact_id: contactId || null,
        account_id: accountId || null,
        category_id: categoryId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      router.push("/transactions");
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        eyebrow="New entry"
        title="Add transaction"
        description="Income, expense, or money moving between you and a contact."
        back={{ href: "/transactions", label: "Transactions" }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Panel>
          <PanelBody className="space-y-5">
            {create.isError ? (
              <ErrorState
                title="Could not save"
                body="Check the amount and required fields, then try again."
              />
            ) : null}

            <Field label="Type" hint={TYPE_HINT[type]}>
              <div className="flex flex-wrap gap-2">
                {ALL_TYPES.map((t) => (
                  <Chip
                    key={t}
                    selected={type === t}
                    tone={
                      t === "income" || t === "received" || t === "borrowed"
                        ? "get"
                        : t === "expense" || t === "gave" || t === "lent"
                          ? "give"
                          : "primary"
                    }
                    onClick={() => setType(t)}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (₹)" htmlFor="amount">
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Date" htmlFor="date">
                <Input
                  id="date"
                  type="date"
                  required
                  value={txnDate}
                  onChange={(e) => setTxnDate(e.target.value)}
                />
              </Field>
            </div>

            {needsContact ? (
              <Field label="Contact" htmlFor="contact">
                <Select
                  id="contact"
                  required
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                >
                  <option value="">Select contact</option>
                  {(contactsQ.data || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <Field
              label="Account"
              htmlFor="account"
              hint="Leave as On hand for plain cash."
            >
              <Select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">On hand</option>
                {(accountsQ.data || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </Select>
            </Field>

            {type === "income" || type === "expense" ? (
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Optional</option>
                  {filteredCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <Field label="Note" htmlFor="note">
              <Textarea
                id="note"
                placeholder="Optional — what was this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                size="lg"
                className="h-12 flex-1"
                disabled={create.isPending}
              >
                {create.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save transaction"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => router.push("/transactions")}
                disabled={create.isPending}
              >
                Cancel
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </form>

      <p className="flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
        <Send className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        Faster on the go: send “gave Rahul 500 for lunch” to the Telegram bot
        and it lands here with the same fields filled in.
      </p>
    </div>
  );
}
