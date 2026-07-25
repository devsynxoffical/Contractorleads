"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineClipboardDocument,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope,
  HiOutlineMegaphone,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Script = {
  id: string;
  type: string;
  title: string | null;
  content: string;
  relatedLeadId: string | null;
  createdAt: string | Date;
};

function typeLabel(type: string) {
  return type.replace(/_/g, " ");
}

function typeTone(type: string) {
  const t = type.toLowerCase();
  if (t.includes("sms")) return "bg-emerald-50 text-emerald-800 ring-emerald-100";
  if (t.includes("email")) return "bg-sky-50 text-sky-800 ring-sky-100";
  if (t.includes("call") || t.includes("script"))
    return "bg-violet-50 text-violet-800 ring-violet-100";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function formatWhen(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ScriptsLibrary({ initialScripts }: { initialScripts: Script[] }) {
  const [scripts, setScripts] = useState(initialScripts);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter(
      (s) =>
        s.content.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q),
    );
  }, [scripts, query]);

  function startEdit(script: Script) {
    setOpenId(script.id);
    setEditingId(script.id);
    setDraftTitle(script.title || "");
    setDraftContent(script.content);
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftTitle("");
    setDraftContent("");
  }

  async function saveEdit(id: string) {
    if (busyId) return;
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          content: draftContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not save script");
        return;
      }
      setScripts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                title: data.script.title,
                content: data.script.content,
              }
            : s,
        ),
      );
      setEditingId(null);
      setMessage("Script saved");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (busyId) return;
    if (!confirm("Delete this script permanently?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/scripts/${id}`, { method: "DELETE" });
      setScripts((prev) => prev.filter((s) => s.id !== id));
      if (openId === id) setOpenId(null);
      if (editingId === id) cancelEdit();
    } finally {
      setBusyId(null);
    }
  }

  async function copyContent(script: Script) {
    try {
      await navigator.clipboard.writeText(script.content);
      setCopiedId(script.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setMessage("Could not copy — select the text manually");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/80 bg-[var(--panel-solid)] p-4 shadow-[var(--shadow-card)] sm:p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          How to use My Scripts
        </p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl bg-[var(--input-bg)] px-3 py-3 text-[13px] text-ink-muted">
            <span className="font-semibold text-ink">1. Create</span>
            <p className="mt-1 leading-snug">
              Generate copy in{" "}
              <Link href="/ask-expert" className="font-semibold text-brand-600 hover:underline">
                Ask Expert
              </Link>{" "}
              or Outreach on a lead, then save it here.
            </p>
          </li>
          <li className="rounded-xl bg-[var(--input-bg)] px-3 py-3 text-[13px] text-ink-muted">
            <span className="font-semibold text-ink">2. Edit</span>
            <p className="mt-1 leading-snug">
              Open any script, click <strong className="text-ink">Edit</strong>,
              tweak the title or body, then save.
            </p>
          </li>
          <li className="rounded-xl bg-[var(--input-bg)] px-3 py-3 text-[13px] text-ink-muted">
            <span className="font-semibold text-ink">3. Reuse</span>
            <p className="mt-1 leading-snug">
              Copy into Gmail/SMS, or open the related lead to send from outreach.
            </p>
          </li>
        </ol>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search scripts by title, type, or content…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="saas-input h-10 w-full max-w-md"
        />
        <p className="text-[12px] text-ink-faint">
          {filtered.length} of {scripts.length} script
          {scripts.length === 1 ? "" : "s"}
        </p>
      </div>

      {message ? (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3">
        {filtered.map((script) => {
          const open = openId === script.id;
          const editing = editingId === script.id;
          const busy = busyId === script.id;

          return (
            <article
              key={script.id}
              className={cn(
                "rounded-2xl border bg-[var(--panel-solid)] shadow-[var(--shadow-card)] transition",
                open
                  ? "border-brand-300 ring-1 ring-brand-200/70"
                  : "border-border/80 hover:border-brand-200",
              )}
            >
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    if (editing) return;
                    setOpenId(open ? null : script.id);
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                        typeTone(script.type),
                      )}
                    >
                      {typeLabel(script.type)}
                    </span>
                    <span className="text-[11px] text-ink-faint">
                      {formatWhen(script.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-[family-name:var(--font-display)] text-[16px] font-semibold text-ink">
                    {script.title || "Untitled script"}
                  </p>
                  {!open ? (
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
                      {script.content}
                    </p>
                  ) : null}
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Copy"
                    onClick={() => copyContent(script)}
                  >
                    {copiedId === script.id ? (
                      <HiOutlineCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <HiOutlineClipboardDocument className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    disabled={busy}
                    onClick={() => startEdit(script)}
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    disabled={busy}
                    onClick={() => remove(script.id)}
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {open ? (
                <div className="border-t border-border/70 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                  {editing ? (
                    <div className="space-y-3">
                      <label className="block text-[12px]">
                        <span className="font-medium text-ink-muted">Title</span>
                        <input
                          className="saas-input mt-1"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          placeholder="e.g. Cold email — roofing Austin"
                        />
                      </label>
                      <label className="block text-[12px]">
                        <span className="font-medium text-ink-muted">
                          Script body
                        </span>
                        <textarea
                          className="saas-input mt-1 min-h-[220px] resize-y font-mono text-[13px] leading-relaxed"
                          value={draftContent}
                          onChange={(e) => setDraftContent(e.target.value)}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          loading={busy}
                          onClick={() => saveEdit(script.id)}
                        >
                          Save changes
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={cancelEdit}
                        >
                          <HiOutlineXMark className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <pre className="whitespace-pre-wrap rounded-xl border border-border/70 bg-[var(--input-bg)] p-4 text-[13px] leading-relaxed text-ink">
                        {script.content}
                      </pre>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => startEdit(script)}
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" />
                          Edit script
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => copyContent(script)}
                        >
                          <HiOutlineClipboardDocument className="h-4 w-4" />
                          {copiedId === script.id ? "Copied" : "Copy"}
                        </Button>
                        {script.relatedLeadId ? (
                          <Link
                            href={`/leads/${script.relatedLeadId}`}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand-300 hover:text-brand-700"
                          >
                            <HiOutlineMegaphone className="h-4 w-4" />
                            Open related lead
                          </Link>
                        ) : (
                          <Link
                            href="/ask-expert"
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand-300 hover:text-brand-700"
                          >
                            <HiOutlineArrowPath className="h-4 w-4" />
                            Generate another
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}

        {!filtered.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-[var(--panel-solid)] px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <HiOutlineEnvelope className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
              {scripts.length ? "No matches" : "No scripts yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-muted">
              {scripts.length
                ? "Try a different search term."
                : "Generate outreach or strategy copy, save it, then edit and reuse it here — without spending credits again."}
            </p>
            {!scripts.length ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/ask-expert"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                  Ask Expert
                </Link>
                <Link
                  href="/leads/search"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-[13px] font-semibold text-ink transition hover:border-brand-300"
                >
                  Find a lead → outreach
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
