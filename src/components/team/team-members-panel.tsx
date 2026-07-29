"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineClipboardDocument,
  HiOutlineLockClosed,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { planLabel, teamSeatLimit } from "@/lib/plans";
import { openUpgradePlanModal } from "@/lib/client/upgrade-plan";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  invitedAt: string;
  acceptedAt: string | null;
};

type OwnerInfo = {
  email: string;
  name: string | null;
  companyName: string | null;
};

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "pending") return "Pending";
  return status;
}

export function TeamMembersPanel({
  plan,
  locked,
  ownerEmail,
  ownerName,
}: {
  plan: string;
  locked: boolean;
  ownerEmail: string;
  ownerName?: string | null;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [seatLimit, setSeatLimit] = useState(teamSeatLimit(plan));
  const [owner, setOwner] = useState<OwnerInfo>({
    email: ownerEmail,
    name: ownerName ?? null,
    companyName: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      if (data.owner) {
        setOwner({
          email: data.owner.email || ownerEmail,
          name: data.owner.name ?? ownerName ?? null,
          companyName: data.owner.companyName ?? null,
        });
      }
    } catch {
      setError("Could not load team");
    } finally {
      setLoading(false);
    }
  }, [plan, ownerEmail, ownerName]);

  useEffect(() => {
    if (!locked) void load();
    else setLoading(false);
  }, [load, locked]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
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
      if (data.emailSent) {
        setSuccess(`Invite sent to ${data.member?.email || "teammate"}.`);
      } else {
        setSuccess(
          data.inviteUrl
            ? "Seat saved. Email could not send — copy the invite link from the teammate row."
            : "Seat saved, but the invite email could not be sent.",
        );
        if (data.emailError) setError(data.emailError);
      }
      await load();
    } catch {
      setError("Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function resendInvite(id: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resendId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not resend invite");
        return;
      }
      setSuccess(
        data.emailSent
          ? "Invite email resent."
          : "Invite refreshed. Copy the link if email failed.",
      );
      if (!data.emailSent && data.emailError) setError(data.emailError);
      await load();
      if (data.inviteUrl && typeof navigator !== "undefined") {
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
          setSuccess((s) => `${s || "Invite ready."} Link copied.`);
        } catch {
          /* ignore */
        }
      }
    } catch {
      setError("Could not resend invite");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resendId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.inviteUrl) {
        setError(data.error || "Could not create invite link");
        return;
      }
      await navigator.clipboard.writeText(data.inviteUrl);
      setSuccess("Invite link copied.");
      await load();
    } catch {
      setError("Could not copy invite link");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this teammate?")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/team?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not remove");
        return;
      }
      setSuccess("Teammate removed.");
      await load();
    } catch {
      setError("Could not remove");
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(id: string, role: string) {
    setBusy(true);
    setError(null);
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

  useEffect(() => {
    if (locked) openUpgradePlanModal("teams");
  }, [locked]);

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
          <Button type="button" onClick={() => openUpgradePlanModal("teams")}>
            Upgrade plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usedSeats = 1 + members.filter((m) => m.status !== "revoked").length;
  const seatsFull = usedSeats >= seatLimit;

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
          {success ? (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              {success}
            </p>
          ) : null}
          {seatsFull ? (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              Seat limit reached. Remove someone or upgrade for more seats.
            </p>
          ) : null}

          <form
            onSubmit={invite}
            className="grid gap-3 rounded-xl border border-border bg-[var(--input-bg)] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_140px_auto]"
          >
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Name</Label>
              <Input
                id="team-name"
                placeholder="Alex Rivera"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={busy || seatsFull}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-email">Work email</Label>
              <Input
                id="team-email"
                type="email"
                required
                placeholder="work@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={busy || seatsFull}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-role">Role</Label>
              <select
                id="team-role"
                className="saas-input h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px]"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={busy || seatsFull}
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={busy || seatsFull}
                loading={busy}
              >
                <HiOutlinePlus className="h-4 w-4" />
                Invite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">
                {owner.name || "You"} (owner)
              </p>
              <p className="truncate text-[12px] text-ink-muted">
                {owner.email} · Full workspace access
              </p>
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
                    {m.email}
                    {m.acceptedAt
                      ? ` · joined ${new Date(m.acceptedAt).toLocaleDateString()}`
                      : m.invitedAt
                        ? ` · invited ${new Date(m.invitedAt).toLocaleDateString()}`
                        : ""}
                  </p>
                  <span
                    className={cn(
                      "mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      m.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800",
                    )}
                  >
                    {statusLabel(m.status)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                  {m.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => resendInvite(m.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
                        title="Resend invite email"
                      >
                        <HiOutlineArrowPath className="h-3.5 w-3.5" />
                        Resend
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => copyInvite(m.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
                        title="Copy invite link"
                      >
                        <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
                        Copy link
                      </button>
                    </>
                  ) : null}
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
