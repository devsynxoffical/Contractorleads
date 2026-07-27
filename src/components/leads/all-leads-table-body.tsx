"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HiOutlineViewColumns } from "react-icons/hi2";

export type AllLeadsTableRow = {
  id: string;
  businessName: string;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  foundAt: Date;
};

export function AllLeadsTableBody({
  leads,
  pipelineLeadIds,
}: {
  leads: AllLeadsTableRow[];
  pipelineLeadIds: string[];
}) {
  const router = useRouter();
  const pipelineSet = useMemo(() => new Set(pipelineLeadIds), [pipelineLeadIds]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addableIds = useMemo(
    () => leads.filter((l) => !pipelineSet.has(l.id)).map((l) => l.id),
    [leads, pipelineSet],
  );

  const allSelected =
    addableIds.length > 0 && addableIds.every((id) => selected.has(id));

  function toggle(leadId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(addableIds));
  }

  async function addToPipeline() {
    if (!selected.size || busy) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch("/api/leads/bulk-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: [...selected] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add to pipeline");
      const added = json.added ?? 0;
      const skipped = json.skipped ?? 0;
      if (added > 0) {
        setFeedback(
          `Added ${added} lead${added === 1 ? "" : "s"} to pipeline` +
            (skipped > 0 ? ` · ${skipped} already saved` : ""),
        );
        setSelected(new Set());
        router.refresh();
      } else if (skipped > 0) {
        setFeedback("Selected leads are already in your pipeline.");
        setSelected(new Set());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to pipeline");
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <>
      {leads.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#faf8fb] px-4 py-3">
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={allSelected}
              onChange={toggleAll}
              disabled={!addableIds.length}
            />
            {selectedCount > 0
              ? `${selectedCount} selected`
              : "Select all to add to pipeline"}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {feedback ? (
              <span className="text-[12px] font-medium text-emerald-700">{feedback}</span>
            ) : null}
            {error ? (
              <span className="text-[12px] font-medium text-rose-700">{error}</span>
            ) : null}
            <Button
              size="sm"
              loading={busy}
              disabled={selectedCount === 0 || busy}
              onClick={() => void addToPipeline()}
            >
              <HiOutlineViewColumns className="h-4 w-4" />
              Add {selectedCount || ""} to pipeline
            </Button>
          </div>
        </div>
      ) : null}

      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-[#faf8fb] text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="w-10 px-4 py-3 font-medium" aria-label="Select" />
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Industry</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="px-4 py-3 font-medium">Found</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const href = `/leads/${lead.id}?from=all`;
            const inPipeline = pipelineSet.has(lead.id);
            const checked = selected.has(lead.id);
            return (
              <tr
                key={lead.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(href)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(href);
                  }
                }}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-brand-50/50"
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600 disabled:opacity-40"
                    checked={checked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggle(lead.id)}
                    disabled={inPipeline}
                    title={
                      inPipeline
                        ? "Already in pipeline"
                        : "Select to add to pipeline"
                    }
                  />
                </td>
                <td className="px-4 py-3.5 font-medium text-ink">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {lead.businessName}
                    {inPipeline ? (
                      <Badge variant="brand" className="text-[10px] uppercase">
                        Saved
                      </Badge>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-ink-muted">
                  {lead.industry ?? "—"}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-medium">
                  {lead.leadScore}
                </td>
                <td className="px-4 py-3.5">
                  <Badge
                    variant={
                      lead.qualityTier === "hot"
                        ? "hot"
                        : lead.qualityTier === "warm"
                          ? "warm"
                          : "nurture"
                    }
                  >
                    {lead.qualityTier ?? "nurture"}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-[12px] tabular-nums text-ink-muted">
                  {lead.foundAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
