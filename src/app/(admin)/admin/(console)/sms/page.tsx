"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SmsMetricsDashboard } from "@/components/sms/sms-metrics-dashboard";

export default function AdminSmsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SMS dashboard"
        description="Platform-wide Twilio SMS volume, delivery, replies, Messaging add-on usage, and per-agency activity."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/communications"
              className="rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold text-ink"
            >
              Email dashboard →
            </Link>
            <Link
              href="/admin/system"
              className="rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold text-ink"
            >
              Twilio settings →
            </Link>
          </div>
        }
      />

      <SmsMetricsDashboard
        endpoint="/api/admin/sms"
        leadHref={(id) => `/admin/leads/${id}`}
      />
    </div>
  );
}
