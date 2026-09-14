import { supabase } from "@/lib/supabase";

/** Timestamp for download filenames, e.g. 20260913-095700 */
export function reportTimestamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export function ryvvReportName(kind: "csv" | "pdf", label = "statement") {
  const ts = reportTimestamp();
  const safe = label.replace(/[^\w\-]+/g, "_").replace(/^_|_$/g, "") || "statement";
  return kind === "csv"
    ? `RYVV-${safe}-${ts}.csv`
    : `RYVV-${safe}-${ts}.pdf`;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = /filename="?([^";]+)"?/i.exec(header);
  return m?.[1] || null;
}

/** Authenticated blob download for CSV/PDF exports. */
export async function downloadExport(
  path: string,
  filename: string,
  params: Record<string, string>
) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const res = await fetch(`${base}${path}?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameFromDisposition(res.headers.get("Content-Disposition")) || filename;
  a.click();
  URL.revokeObjectURL(url);
}
