"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineLockClosed,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { planLabel, teamSeatLimit } from "@/lib/plans";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  invitedAt: string;
  acceptedAt: string | null;
};

export function TeamMembersPanel({
  plan,
  locked,
}: {
  plan: string;
  locked: boolean;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [seatLimit, setSeatLimit] = useState(teamSeatLimit(plan));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "member",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load team");
        setMembers([]);
        return;
      }
      setMembers(data.members || []);
      setSeatLimit(data.seatLimit ?? teamSeatLimit(plan));
    } catch {
      setError("Could not load team");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (!locked) void load();
    else setLoading(false);
  }, [load, locked]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invite failed");
        return;
      }
      setForm({ name: "", email: "", role: "member" });
      await load();
    } catch {
      setError("Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this teammate?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/team?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not remove");
        return;
      }
      await load();
    } catch {
      setError("Could not remove");
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(id: string, role: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update role");
        return;
      }
      await load();
    } catch {
      setError("Could not update role");
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <HiOutlineLockClosed className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink">
                Users &amp; teams is on Agency
              </p>
              <p className="mt-1 max-w-lg text-[13px] text-ink-muted">
                You&apos;re on {planLabel(plan)}. Upgrade to Agency to invite
                seats, assign roles, and share your credit pool across the team.
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button>View Agency plan</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const usedSeats = 1 + members.filter((m) => m.status !== "revoked").length;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HiOutlineUserGroup className="h-5 w-5 text-brand-600" />
              Team seats
            </CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              {usedSeats} of {seatLimit} seats used · {planLabel(plan)} plan
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{
                width: `${Math.min(100, (usedSeats / Math.max(seatLimit, 1)) * 100)}%`,
              }}
            />
          </div>

          {error ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}

          <form
            onSubmit={invite}
            className="grid gap-3 rounded-xl border border-border bg-[var(--input-bg)] p-4 sm:grid-cols-[1fr_1.2fr_140px_auto]"
          >
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="email"
              required
              placeholder="work@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              className="saas-input h-10 rounded-xl border border-border bg-white px-3 text-[13px]"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button type="submit" disabled={busy || usedSeats >= seatLimit}>
              <HiOutlinePlus className="h-4 w-4" />
              Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">You (owner)</p>
              <p className="text-[12px] text-ink-muted">Full workspace access</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Owner
            </span>
          </div>

          {loading ? (
            <p className="py-6 text-center text-[13px] text-ink-muted">
              Loading team…
            </p>
          ) : members.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-muted">
              No teammates yet — invite your first seat above.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {m.name || m.email}
                  </p>
                  <p className="truncate text-[12px] text-ink-muted">
                    {m.email} · {m.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="h-8 rounded-lg border border-border bg-white px-2 text-[12px]"
                    value={m.role}
                    disabled={busy}
                    onChange={(e) => updateRole(m.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeMember(m.id)}
                    className="rounded-lg p-2 text-ink-faint transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove teammate"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
