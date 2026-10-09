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
  decisionMakerFound?: boolean;
  decisionMakerName?: string | null;
  decisionMakerRole?: string | null;
  decisionMakerEmail?: string | null;
  decisionMakerDirectPhone?: string | null;
  businessAgeYears?: number | null;
  businessMaturity?: string | null;
  employeeCount?: number | null;
  companySizeCategory?: string | null;
  smeQualityScore?: number | null;
  isLowPriorityOrExcluded?: boolean;
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
              className="h-5 w-5 accent-brand-600"
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

      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border bg-[#faf8fb] text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="w-10 px-4 py-3 font-medium" aria-label="Select" />
            <th className="px-4 py-3 font-medium">Business & Industry</th>
            <th className="px-4 py-3 font-medium">Verified Decision-Maker</th>
            <th className="px-4 py-3 font-medium">Business Age</th>
            <th className="px-4 py-3 font-medium">Team Size</th>
            <th className="px-4 py-3 font-medium">SME Score</th>
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const href = `/leads/${lead.id}?from=all`;
            const inPipeline = pipelineSet.has(lead.id);
            const checked = selected.has(lead.id);
            const dmFound = Boolean(lead.decisionMakerFound || lead.decisionMakerName);
            const displayScore =
              typeof lead.smeQualityScore === "number" && lead.smeQualityScore > 0
                ? lead.smeQualityScore
                : (lead.leadScore && lead.leadScore > 0 ? lead.leadScore : 70);

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
                    className="h-5 w-5 accent-brand-600 disabled:opacity-40"
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
                  <div className="flex flex-col gap-0.5">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink hover:text-brand-600">
                        {lead.businessName}
                      </span>
                      {inPipeline ? (
                        <Badge variant="brand" className="text-[10px] uppercase">
                          Saved
                        </Badge>
                      ) : null}
                      {lead.isLowPriorityOrExcluded ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                          Excluded / 30+ yr
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[12px] text-ink-muted">
                      {lead.industry ?? "General Contractor"}
                    </span>
                  </div>
                </td>

                {/* Verified Decision-Maker column */}
                <td className="px-4 py-3.5">
                  {dmFound && lead.decisionMakerName ? (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                        <span>{lead.decisionMakerName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
                        <span className="rounded bg-emerald-50 px-1.5 py-0.2 font-medium text-emerald-800">
                          {lead.decisionMakerRole ?? "Decision-Maker"}
                        </span>
                        {lead.decisionMakerEmail ? (
                          <span title="Direct email available" className="text-emerald-600 font-semibold">
                            ✉️ Direct
                          </span>
                        ) : null}
                        {lead.decisionMakerDirectPhone ? (
                          <span title="Direct phone available" className="text-emerald-600 font-semibold">
                            📞 Direct
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50/80 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      <span>⚠️ Gatekeeper only</span>
                    </span>
                  )}
                </td>

                {/* Business Age */}
                <td className="px-4 py-3.5 text-[13px]">
                  {lead.businessAgeYears != null ? (
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink">
                        {lead.businessAgeYears} yr{lead.businessAgeYears === 1 ? "" : "s"}
                      </span>
                      <span className="text-[11px] capitalize text-ink-muted">
                        {lead.businessMaturity?.replace("_", " ") ?? "Operating"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[12px] text-ink-muted">—</span>
                  )}
                </td>

                {/* Company Size */}
                <td className="px-4 py-3.5 text-[13px]">
                  {lead.companySizeCategory ? (
                    <span className="inline-flex rounded-md bg-[#f4f2f7] px-2 py-0.5 text-[12px] font-medium text-ink">
                      {lead.companySizeCategory} team
                    </span>
                  ) : lead.employeeCount != null ? (
                    <span className="font-medium text-ink">
                      ~{lead.employeeCount} team
                    </span>
                  ) : (
                    <span className="text-[12px] text-ink-muted">—</span>
                  )}
                </td>

                {/* SME Quality Score */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[12px] font-bold tabular-nums ${
                        displayScore >= 75
                          ? "bg-emerald-50 text-emerald-700"
                          : displayScore >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {displayScore}/100
                    </span>
                  </div>
                </td>

                {/* Quality Tier */}
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

                {/* Actions */}
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
