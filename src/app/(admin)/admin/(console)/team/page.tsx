"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PERMISSIONS,
  MANAGER_ROLE,
  SUB_ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  type AdminPermissionKey,
} from "@/lib/admin-permissions";

type Template = {
  id: string;
  role: string;
  label: string;
  permissions: AdminPermissionKey[];
};

type StaffRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminTeamPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [activeRole, setActiveRole] = useState<string>(MANAGER_ROLE);
  const [draftPerms, setDraftPerms] = useState<Set<AdminPermissionKey>>(
    new Set()
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    name: "",
    password: "",
    role: MANAGER_ROLE,
  });

  async function load() {
    const [rolesRes, staffRes] = await Promise.all([
      fetch("/api/admin/roles"),
      fetch("/api/admin/staff"),
    ]);
    if (!rolesRes.ok || !staffRes.ok) {
      setMessage("Failed to load team data (Super Admin only).");
      return;
    }
    const rolesData = await rolesRes.json();
    const staffData = await staffRes.json();
    setTemplates(rolesData.templates ?? []);
    setStaff(staffData.staff ?? []);
    const current =
      (rolesData.templates as Template[] | undefined)?.find(
        (t) => t.role === activeRole
      ) ??
      (rolesData.templates as Template[] | undefined)?.[0];
    if (current) {
      setActiveRole(current.role);
      setDraftPerms(new Set(current.permissions));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTemplate(role: string) {
    const t = templates.find((x) => x.role === role);
    setActiveRole(role);
    setDraftPerms(new Set(t?.permissions ?? []));
  }

  function togglePerm(key: AdminPermissionKey) {
    setDraftPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function saveTemplate() {
    setBusy("template");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          permissions: [...draftPerms],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage(`${data.template.label} permissions saved`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setCreateForm({
        email: "",
        name: "",
        password: "",
        role: MANAGER_ROLE,
      });
      setMessage(`Created ${data.staff.email}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function updateStaff(
    id: string,
    patch: Partial<{ role: string; isActive: boolean; password: string }>
  ) {
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMessage("Staff updated");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteStaff(id: string, email: string) {
    if (!confirm(`Permanently delete staff account ${email}?`)) return;
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage("Staff deleted");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Team & Roles"
        description="Edit Manager / Sub Admin permission templates and create staff accounts that can only access /admin."
      />

      {message && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      )}

      <section className="mb-8 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Role templates</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Changes apply to every staff member with that role. Super Admins always
          have full access.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {[MANAGER_ROLE, SUB_ADMIN_ROLE].map((role) => {
            const t = templates.find((x) => x.role === role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => selectTemplate(role)}
                className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${
                  activeRole === role
                    ? "bg-brand-50 text-brand-700"
                    : "bg-[#faf8fc] text-ink-muted"
                }`}
              >
                {t?.label ?? role}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_PERMISSIONS.map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-[#faf8fc] px-3 py-2.5 text-[13px]"
            >
              <input
                type="checkbox"
                checked={draftPerms.has(p.key)}
                onChange={() => togglePerm(p.key)}
              />
              <span>
                <span className="font-medium text-ink">{p.label}</span>
                <span className="mt-0.5 block text-[11px] text-ink-faint">
                  {p.key}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <Button loading={busy === "template"} onClick={saveTemplate}>
            {busy === "template" ? "Saving…" : "Save template"}
          </Button>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Create staff member</h2>
        <form
          onSubmit={createStaff}
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Email</span>
            <input
              required
              type="email"
              className="saas-input mt-1"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Name</span>
            <input
              className="saas-input mt-1"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Password</span>
            <input
              required
              type="password"
              minLength={8}
              className="saas-input mt-1"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Role</span>
            <select
              className="saas-input mt-1"
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({ ...createForm, role: e.target.value })
              }
            >
              <option value={MANAGER_ROLE}>Manager</option>
              <option value={SUB_ADMIN_ROLE}>Sub Admin</option>
              <option value={SUPER_ADMIN_ROLE}>Super Admin</option>
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" loading={busy === "create"}>
              {busy === "create" ? "Creating…" : "Create staff"}
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    {row.name || row.email}
                  </p>
                  <p className="text-[12px] text-ink-muted">{row.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="saas-input max-w-[160px]"
                    value={row.role}
                    disabled={busy === row.id}
                    onChange={(e) =>
                      updateStaff(row.id, { role: e.target.value })
                    }
                  >
                    <option value={SUPER_ADMIN_ROLE}>Super Admin</option>
                    <option value={MANAGER_ROLE}>Manager</option>
                    <option value={SUB_ADMIN_ROLE}>Sub Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.isActive ? "text-emerald-700" : "text-red-600"
                    }
                  >
                    {row.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy === row.id}
                    onClick={() =>
                      updateStaff(row.id, { isActive: !row.isActive })
                    }
                  >
                    {row.isActive ? "Suspend" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy === row.id}
                    onClick={() => {
                      const password = prompt(
                        "New password (min 8 characters):"
                      );
                      if (!password) return;
                      updateStaff(row.id, { password });
                    }}
                  >
                    Reset password
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy === row.id}
                    onClick={() => deleteStaff(row.id, row.email)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-ink-muted">
                  No staff accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
