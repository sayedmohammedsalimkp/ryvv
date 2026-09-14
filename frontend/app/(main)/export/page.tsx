"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { Field, Select } from "@/components/app/field";
import { ErrorState } from "@/components/app/states";
import { api } from "@/lib/api";
import { downloadExport, ryvvReportName } from "@/lib/download";
import type { Contact } from "@/types/money";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [contactId, setContactId] = useState("");
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState("");

  const contactsQ = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => (await api.get<Contact[]>("/contacts")).data,
  });

  async function run(kind: "csv" | "pdf") {
    setBusy(kind);
    setError("");
    try {
      const contact = (contactsQ.data || []).find((c) => c.id === contactId);
      const label = contact?.name || "transactions";
      await downloadExport(
        kind === "csv" ? "/export/csv" : "/export/pdf",
        ryvvReportName(kind, label),
        {
          date_from: dateFrom,
          date_to: dateTo,
          contact_id: contactId,
        }
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  const scope = contactId
    ? (contactsQ.data || []).find((c) => c.id === contactId)?.name
    : "All transactions";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Download your statement"
        description="A clean PDF statement or a CSV you can open in any spreadsheet — the same report the Telegram bot can send you on request."
      />

      <Panel>
        <PanelHeader
          title="Choose what to include"
          description="Leave the dates empty for your full history."
        />
        <PanelBody className="space-y-5">
          {error ? <ErrorState title="Export failed" body={error} /> : null}

          <Field label="Contact" htmlFor="export-contact">
            <Select
              id="export-contact"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">All transactions</option>
              {(contactsQ.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="export-from">
              <Input
                id="export-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Field>
            <Field label="To" htmlFor="export-to">
              <Input
                id="export-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
            Report scope:{" "}
            <span className="font-semibold text-foreground">{scope}</span>
            {dateFrom || dateTo
              ? ` · ${dateFrom || "start"} to ${dateTo || "today"}`
              : " · full history"}{" "}
            · amounts in INR
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-12 flex-1"
              disabled={!!busy}
              onClick={() => run("pdf")}
            >
              <FileText className="size-4" aria-hidden />
              {busy === "pdf" ? "Preparing…" : "Download PDF"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 flex-1"
              disabled={!!busy}
              onClick={() => run("csv")}
            >
              <FileSpreadsheet className="size-4" aria-hidden />
              {busy === "csv" ? "Preparing…" : "Download CSV"}
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Download className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        Statements include each entry, the contact, the money place, and a
        running balance, so they work as a shareable proof of settlement.
      </p>
    </div>
  );
}
