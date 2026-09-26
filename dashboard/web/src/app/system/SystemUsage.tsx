"use client";

/* Senuto i SerpData nie idą przez collectora – termin ważności tokenu i licznik
   zapytań zna Worker (D1), więc dociągamy je z /api/cw/usage. Rotacja tokenu
   Senuto: wklejenie tutaj → POST /api/senuto-token (KV); collector i pipeline
   pobierają go z Workera, więc to jedyny krok rotacji. */
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";
import { useEffect, useState } from "react";
import { Pill, type Tone } from "./Pill";

type Usage = {
  senuto?: { configured?: boolean; days_left?: number | null; status?: string; expires_at?: string | null };
  serpdata?: { configured?: boolean; left?: number | null; used?: number | null; limit?: number | null; status?: string; error?: string };
};

const tone = (s?: string): Tone => (s === "ok" ? "ok" : s === "warn" ? "warn" : s === "err" ? "err" : "off");
const BAR: Record<Tone, string> = { ok: "bg-brand-500", warn: "bg-warning-500", err: "bg-error-500", off: "bg-gray-300" };

export default function SystemUsage() {
  const [data, setData] = useState<Usage | null>(null);
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/cw/usage", { headers: { "X-CW-Request": "1" } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null)); // podgląd bez Workera – kafelki zostają ukryte
  }, []);

  if (!data) return null;
  const sen = data.senuto ?? {};
  const serp = data.serpdata ?? {};
  const days = sen.days_left ?? null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/senuto-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? `HTTP ${res.status}`);
      setMsg({ text: `Zapisano – token ważny do ${new Date(payload.expires_at).toLocaleDateString("pl-PL")}. Odświeżam…`, ok: true });
      setTimeout(() => location.reload(), 1400);
    } catch (error) {
      setMsg({ text: error instanceof Error ? error.message : "Nie udało się zapisać tokenu.", ok: false });
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Senuto · token</h3>
          <Pill tone={sen.configured ? tone(sen.status) : "off"}>
            {!sen.configured ? "Brak tokenu" : sen.status === "err" ? "Wygasł" : sen.status === "warn" ? "Rotacja" : "OK"}
          </Pill>
        </div>
        <p className="mt-4 text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">
          {days === null ? "–" : fmtInt(days)}{" "}
          <span className="text-base font-normal text-gray-500">
            {days === null ? "termin nieznany" : days < 0 ? "dni po terminie" : "dni do rotacji"}
          </span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <i
            className={cn("block h-full rounded-full", BAR[tone(sen.status)])}
            style={{ width: `${days === null ? 0 : Math.max(0, Math.min(100, Math.round((days / 31) * 100)))}%` }}
          />
        </div>
        <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
          {sen.expires_at ? `ważny do ${new Date(sen.expires_at).toLocaleDateString("pl-PL")}` : "klucz JWT ważny ~31 dni"} · rotacja: wklej
          nowy token poniżej
        </p>
        <form onSubmit={save} className="mt-3 flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="wklej nowy token JWT z Senuto"
            autoComplete="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
          />
          <button
            type="submit"
            disabled={busy || !token.trim()}
            className="h-11 rounded bg-brand-500 px-4 text-theme-sm font-medium text-gray-950 hover:bg-brand-400 disabled:opacity-40"
          >
            Zapisz
          </button>
        </form>
        {msg && (
          <p className={cn("mt-2 text-theme-xs", msg.ok ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400")}>
            {msg.text}
          </p>
        )}
      </Card>

      {serp.configured && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">SerpData</h3>
            <Pill tone={tone(serp.status)}>{serp.status === "err" ? "Niski stan" : serp.status === "warn" ? "Uwaga" : serp.status === "ok" ? "OK" : "Nieznane"}</Pill>
          </div>
          <p className="mt-4 text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">
            {serp.left == null ? "–" : fmtInt(serp.left)}{" "}
            <span className="text-base font-normal text-gray-500">{serp.left == null ? "saldo nieznane" : "zapytań zostało"}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            {serp.limit ? (
              <i
                className={cn("block h-full rounded-full", BAR[tone(serp.status)])}
                style={{ width: `${Math.min(100, Math.round(((serp.used ?? 0) / serp.limit) * 100))}%` }}
              />
            ) : null}
          </div>
          <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            {serp.limit ? `zużyto ${fmtInt(serp.used ?? 0)} / ${fmtInt(serp.limit)}` : (serp.error ?? "saldo pakietu")} · research SERP w
            edytorze i pipelinie
          </p>
        </Card>
      )}
    </>
  );
}
