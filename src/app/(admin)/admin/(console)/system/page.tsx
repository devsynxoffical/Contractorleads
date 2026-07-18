"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import type { EnvKeyStatus } from "@/lib/admin";

export default function AdminSystemPage() {
  const [keys, setKeys] = useState<EnvKeyStatus[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/admin/system")
      .then((r) => r.json())
      .then((d) => {
        setKeys(d.keys ?? []);
        setNote(d.note ?? "");
      });
  }, []);

  const groups = [...new Set(keys.map((k) => k.group))];

  return (
    <div>
      <AdminPageHeader
        title="System & API Keys"
        description="Which environment variables are configured. Full secrets are never shown here."
      />

      {note && (
        <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          {note}
        </p>
      )}

      <div className="space-y-5">
        {groups.map((group) => (
          <section
            key={group}
            className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]"
          >
            <h2 className="text-sm font-semibold text-ink">{group}</h2>
            <ul className="mt-3 space-y-2">
              {keys
                .filter((k) => k.group === group)
                .map((k) => (
                  <li
                    key={k.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[13px]"
                  >
                    <span className="font-mono text-[12px] text-ink">
                      {k.key}
                    </span>
                    <span className="text-[12px] text-ink-muted">
                      {k.configured ? (
                        <>
                          Configured{" "}
                          <span className="font-mono text-ink-faint">
                            {k.hint}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-amber-800">
                          Missing
                        </span>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
