"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export type AllLeadsTableRow = {
  id: string;
  businessName: string;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  foundAt: Date;
};

export function AllLeadsTableBody({ leads }: { leads: AllLeadsTableRow[] }) {
  const router = useRouter();

  return (
    <tbody>
      {leads.map((lead) => {
        const href = `/leads/${lead.id}?from=all`;
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
            <td className="px-4 py-3.5 font-medium text-ink">
              {lead.businessName}
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
  );
}
