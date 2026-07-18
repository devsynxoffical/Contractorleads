"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";

type Activity = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  user: {
    email: string;
    companyName: string | null;
    name: string | null;
    role: string;
  };
};

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then((r) => r.json())
      .then((d) => {
        setActivities(d.activities ?? []);
        setTotal(d.total ?? 0);
      });
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Activity log"
        description="Platform-wide actions from agencies and admins."
        actions={
          <a
            href="/api/admin/activity/export"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-ink-muted"
          >
            Export CSV
          </a>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <ul className="divide-y divide-border/60">
          {activities.map((a) => (
            <li key={a.id} className="px-4 py-3 text-[13px]">
              <p className="font-medium text-ink">{a.message}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">
                <span className="uppercase">{a.type}</span> ·{" "}
                {a.user.companyName || a.user.name || a.user.email} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {activities.length === 0 && (
            <li className="px-4 py-8 text-ink-muted">No activity yet.</li>
          )}
        </ul>
        <p className="border-t border-border/60 px-4 py-2 text-[12px] text-ink-faint">
          {total} events
        </p>
      </div>
    </div>
  );
}
