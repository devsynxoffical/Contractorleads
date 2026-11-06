"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Target = "owner" | "work_email" | "phone" | "mobile";

type Provider = {
  id: string;
  name: string;
  paid: boolean;
  async: boolean;
  targets: Target[];
  configured: boolean;
  enabled: boolean;
  available: boolean;
  docsUrl: string;
  version: string;
};

type Settings = { disabledProviders: string[]; order: Partial<Record<Target, string[]>> };

const TARGETS: Array<{ id: Target; label: string }> = [
  { id: "owner", label: "Owner / decision-maker" },
  { id: "work_email", label: "Owner work email" },
  { id: "phone", label: "Business phone" },
  { id: "mobile", label: "Owner mobile" },
];

/**
 * Admin controls for the enrichment waterfall: switch providers on/off and set the
 * order per field. Keys are entered in "Platform API keys" above; a provider without a
 * key is never called, whatever its switch says.
 */
export function EnrichmentProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [settings, setSettings] = useState<Settings>({ disabledProviders: [], order: {} });
  const [defaults, setDefaults] = useState<Record<Target, string[]>>({ owner: [], work_email: [], phone: [], mobile: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/enrichment")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        setProviders(j.providers ?? []);
        setSettings(j.settings ?? { disabledProviders: [], order: {} });
        setDefaults(j.defaultOrder ?? {});
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, []);

  const byId = new Map(providers.map((p) => [p.id, p]));
  const orderOf = (t: Target) => {
    const base = settings.order[t]?.length ? settings.order[t]! : defaults[t] ?? [];
    // Show every provider that supports this field: ordered ones first, the rest after.
    const rest = providers.filter((p) => p.targets.includes(t) && !base.includes(p.id)).map((p) => p.id);
    return [...base, ...rest];
  };

  function toggle(id: string) {
    setSettings((s) => ({
      ...s,
      disabledProviders: s.disabledProviders.includes(id)
        ? s.disabledProviders.filter((x) => x !== id)
        : [...s.disabledProviders, id],
    }));
  }

  function move(t: Target, index: number, dir: -1 | 1) {
    const list = orderOf(t);
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    setSettings((s) => ({ ...s, order: { ...s.order, [t]: list } }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/enrichment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save");
      setProviders(j.providers ?? providers);
      setSettings(j.settings ?? settings);
      setMessage("Saved. New jobs use this order.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function resetOrder() {
    setSettings((s) => ({ ...s, order: {} }));
  }

  return (
    <section className="mb-6 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-ink">Enrichment providers (waterfall)</h2>
      <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
        Each field has its own order and stops at the first accepted result. A provider is only
        called when its key is saved above and its switch is on. Reorder after the pilot by
        accepted contacts per dollar, not database size.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Fields</th>
              <th className="py-2 pr-3">Key</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">On</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => {
              const enabled = !settings.disabledProviders.includes(p.id);
              return (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2 pr-3">
                    <a href={p.docsUrl} target="_blank" rel="noreferrer" className="font-medium text-ink hover:underline">
                      {p.name}
                    </a>
                    <span className="ml-2 text-[11px] text-ink-faint">
                      {p.paid ? "paid" : "free"}
                      {p.async ? " · async" : ""} · v{p.version}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-ink-muted">
                    {p.targets.map((t) => TARGETS.find((x) => x.id === t)?.label ?? t).join(", ")}
                  </td>
                  <td className="py-2 pr-3">
                    {p.configured ? (
                      <span className="text-emerald-700 dark:text-emerald-400">{p.paid ? "Configured" : "Not needed"}</span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">Missing</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-ink-muted">
                    {p.configured && enabled ? "Used in jobs" : !p.configured ? "Add key to use" : "Switched off"}
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      aria-label={`Use ${p.name}`}
                      checked={enabled}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 accent-[var(--brand-600,#4f46e5)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {TARGETS.map((t) => (
          <div key={t.id} className="rounded-xl border border-border/70 p-3">
            <p className="text-[12px] font-semibold text-ink">{t.label}</p>
            <ol className="mt-2 space-y-1">
              {orderOf(t.id).map((id, i, list) => {
                const p = byId.get(id);
                const usable = p && p.configured && !settings.disabledProviders.includes(id);
                return (
                  <li key={id} className="flex items-center gap-2 text-[13px]">
                    <span className="w-5 text-right text-ink-faint">{i + 1}.</span>
                    <span className={usable ? "text-ink" : "text-ink-faint line-through"}>{p?.name ?? id}</span>
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        className="rounded px-1.5 text-ink-muted hover:bg-brand-50 disabled:opacity-30"
                        onClick={() => move(t.id, i, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${p?.name ?? id} up`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 text-ink-muted hover:bg-brand-50 disabled:opacity-30"
                        onClick={() => move(t.id, i, 1)}
                        disabled={i === list.length - 1}
                        aria-label={`Move ${p?.name ?? id} down`}
                      >
                        ↓
                      </button>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => void save()} loading={busy}>
          Save provider settings
        </Button>
        <Button size="sm" variant="ghost" onClick={resetOrder}>
          Reset to default order
        </Button>
        {message ? <p className="text-[13px] text-ink-muted">{message}</p> : null}
      </div>
    </section>
  );
}
