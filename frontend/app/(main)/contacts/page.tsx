"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody } from "@/components/app/panel";
import { StatCard } from "@/components/app/stat-card";
import { BalanceChip } from "@/components/app/balance";
import { Field } from "@/components/app/field";
import { EmptyState, SkeletonRows } from "@/components/app/states";
import type { Contact } from "@/types/money";
import { Plus, Search, Users, X } from "lucide-react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "get", label: "You will get" },
  { id: "give", label: "You will give" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

function ContactsInner() {
  const search = useSearchParams();
  const filterParam = search.get("filter");
  const initialFilter: Filter =
    filterParam === "get" || filterParam === "give" ? filterParam : "all";

  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  // Dashboard and the summary cards link here with ?filter=get|give.
  useEffect(() => {
    if (filterParam === "get" || filterParam === "give") setFilter(filterParam);
  }, [filterParam]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["contacts", q],
    queryFn: async () =>
      (await api.get<Contact[]>("/contacts", { params: { q: q || undefined } }))
        .data,
  });

  const youWillGet = useMemo(
    () =>
      data
        .filter((c) => c.balance_paise > 0)
        .reduce((s, c) => s + c.balance_paise, 0),
    [data]
  );
  const youWillGive = useMemo(
    () =>
      data
        .filter((c) => c.balance_paise < 0)
        .reduce((s, c) => s + Math.abs(c.balance_paise), 0),
    [data]
  );

  const filtered = useMemo(() => {
    if (filter === "get") return data.filter((c) => c.balance_paise > 0);
    if (filter === "give") return data.filter((c) => c.balance_paise < 0);
    return data;
  }, [data, filter]);

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post<Contact>("/contacts", {
          name,
          phone: phone || null,
          note: note || null,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setName("");
      setPhone("");
      setNote("");
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="People"
        title="Who owes whom"
        description="Every person you give, take, lend, or borrow with — with a running balance that never needs mental math."
        action={
          <Button
            type="button"
            size="lg"
            className="h-11"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? (
              <>
                <X className="size-4" aria-hidden /> Close
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden /> Add contact
              </>
            )}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          tone="get"
          label="You will get"
          value={formatINR(youWillGet)}
          hint="Money on its way back to you"
          href="/contacts?filter=get"
        />
        <StatCard
          tone="give"
          label="You will give"
          value={formatINR(youWillGive)}
          hint="What you still owe others"
          href="/contacts?filter=give"
        />
      </div>

      {open ? (
        <form
          className="rounded-2xl border border-border bg-card"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <PanelBody className="space-y-4">
            <h2 className="font-display text-lg font-bold">New contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="contact-name">
                <Input
                  id="contact-name"
                  required
                  placeholder="Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Phone" htmlFor="contact-phone">
                <Input
                  id="contact-phone"
                  inputMode="tel"
                  placeholder="Optional"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Note" htmlFor="contact-note">
              <Textarea
                id="contact-note"
                placeholder="Optional — shop name, how you know them…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending || !name.trim()}>
                {create.isPending ? "Saving…" : "Save contact"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </PanelBody>
        </form>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === f.id
                  ? f.id === "get"
                    ? "bg-money-get text-white"
                    : f.id === "give"
                      ? "bg-money-give text-white"
                      : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Search contacts…"
            aria-label="Search contacts"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No match for that search" : "Nothing in this view"}
          body={
            filter === "all"
              ? "Add your first contact, or message the Telegram bot — “gave Rahul 500” creates the person and the entry together."
              : "Switch back to All to see everyone you track."
          }
          action={
            filter === "all" ? (
              <Button type="button" onClick={() => setOpen(true)}>
                <Plus className="size-4" aria-hidden /> Add contact
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilter("all")}
              >
                Show all contacts
              </Button>
            )
          }
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-border">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contacts/${c.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-accent/50 sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {c.name}
                    </span>
                    {c.phone ? (
                      <span className="block text-xs text-muted-foreground">
                        {c.phone}
                      </span>
                    ) : null}
                    <span className="block text-[11px] text-muted-foreground">
                      Added {formatDateTime(c.created_at)}
                    </span>
                  </span>
                  <BalanceChip paise={c.balance_paise} compact />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<SkeletonRows count={5} />}>
      <ContactsInner />
    </Suspense>
  );
}
