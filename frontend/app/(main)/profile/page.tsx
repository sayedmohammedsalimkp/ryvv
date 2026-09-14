"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader } from "@/components/app/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/app/panel";
import { Field } from "@/components/app/field";
import { InlineLoading } from "@/components/app/states";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Check, LogOut, Send } from "lucide-react";

type TgLink = {
  linked: boolean;
  configured?: boolean;
  bot_username?: string | null;
  telegram_username?: string | null;
  digest_enabled?: boolean;
  alert_expense_paise?: number;
  linked_at?: string | null;
};

type TgCode = {
  code: string;
  expires_at: string;
  expires_in_minutes: number;
  deep_link?: string | null;
  bot_username?: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.full_name || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [codeInfo, setCodeInfo] = useState<TgCode | null>(null);
  const [alertRupees, setAlertRupees] = useState("5000");

  const tgQ = useQuery({
    queryKey: ["telegram-link"],
    queryFn: async () => (await api.get<TgLink>("/telegram/link")).data,
  });

  const genCode = useMutation({
    mutationFn: async () => (await api.post<TgCode>("/telegram/link/code")).data,
    onSuccess: (data) => setCodeInfo(data),
  });

  const unlink = useMutation({
    mutationFn: async () => api.delete("/telegram/link"),
    onSuccess: () => {
      setCodeInfo(null);
      qc.invalidateQueries({ queryKey: ["telegram-link"] });
    },
  });

  const savePrefs = useMutation({
    mutationFn: async () =>
      api.patch("/telegram/link/prefs", {
        digest_enabled: tgQ.data?.digest_enabled ?? true,
        alert_expense_rupees: Number(alertRupees) || 5000,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["telegram-link"] }),
  });

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await api.patch("/auth/me", { full_name: name.trim() });
      setUser(res.data);
      setMsg("Saved");
    } catch {
      setMsg("Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/login");
  }

  const tg = tgQ.data;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description={`${user?.email ?? ""} · amounts shown in INR`}
      />

      <Panel>
        <PanelHeader title="Your details" />
        <PanelBody className="space-y-4">
          <Field label="Full name" htmlFor="full-name">
            <Input
              id="full-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <div>
              <p className="text-sm font-medium">Appearance</p>
              <p className="text-xs text-muted-foreground">
                Light and dark both tuned for readable money colours.
              </p>
            </div>
            <ThemeToggle />
          </div>

          {msg ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-money-get" aria-hidden />
              {msg}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              onClick={save}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="size-4" aria-hidden /> Sign out
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Telegram assistant"
          description="Log Gave/Got, check balances, settle up, and pull a PDF — by chat or voice note."
          action={
            tg?.linked ? (
              <span className="rounded-full bg-money-get-soft px-3 py-1 text-xs font-bold text-money-get">
                Linked
              </span>
            ) : (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                Not linked
              </span>
            )
          }
        />
        <PanelBody className="space-y-4">
          {tgQ.isLoading ? (
            <InlineLoading />
          ) : !tg?.configured ? (
            <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              Bot not configured. Set TELEGRAM_BOT_TOKEN and GROQ_API_KEY on the
              backend.
            </p>
          ) : tg.linked ? (
            <>
              <p className="text-sm text-muted-foreground">
                Connected
                {tg.telegram_username ? ` as @${tg.telegram_username}` : ""}.
                Send a message like “gave Rahul 500” and it lands in your ledger.
              </p>

              <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Morning digest</p>
                  <p className="text-xs text-muted-foreground">
                    Yesterday&apos;s summary at 8:00 IST
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={tg.digest_enabled ? "default" : "outline"}
                  onClick={() => {
                    api
                      .patch("/telegram/link/prefs", {
                        digest_enabled: !tg.digest_enabled,
                      })
                      .then(() =>
                        qc.invalidateQueries({ queryKey: ["telegram-link"] })
                      );
                  }}
                >
                  {tg.digest_enabled ? "On" : "Off"}
                </Button>
              </div>

              <Field
                label="Expense alert (₹ and above)"
                htmlFor="alert-amount"
                hint="Get a ping the moment a big spend is logged."
              >
                <div className="flex gap-2">
                  <Input
                    id="alert-amount"
                    type="number"
                    inputMode="decimal"
                    value={alertRupees}
                    onChange={(e) => setAlertRupees(e.target.value)}
                    onFocus={() =>
                      setAlertRupees(
                        String((tg.alert_expense_paise || 500000) / 100)
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savePrefs.isPending}
                    onClick={() => savePrefs.mutate()}
                  >
                    {savePrefs.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </Field>

              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={unlink.isPending}
                onClick={() => unlink.mutate()}
              >
                {unlink.isPending ? "Unlinking…" : "Unlink Telegram"}
              </Button>
            </>
          ) : (
            <>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Generate a one-time code below.</li>
                <li>2. Open the RYVV bot in Telegram.</li>
                <li>3. Send the code — your chat is linked to this account.</li>
              </ol>

              <Button
                type="button"
                className="w-full"
                disabled={genCode.isPending}
                onClick={() => genCode.mutate()}
              >
                <Send className="size-4" aria-hidden />
                {genCode.isPending ? "Generating…" : "Generate link code"}
              </Button>

              {codeInfo ? (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center">
                  <p className="text-xs text-muted-foreground">
                    Open the bot and send
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-[0.2em]">
                    /start {codeInfo.code}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Expires in {codeInfo.expires_in_minutes} min
                  </p>
                  {codeInfo.deep_link ? (
                    <a
                      href={codeInfo.deep_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Open Telegram →
                    </a>
                  ) : null}
                  {codeInfo.bot_username ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      @{codeInfo.bot_username}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
