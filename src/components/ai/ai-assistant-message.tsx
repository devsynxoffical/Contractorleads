"use client";

import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "link"; label: string; href: string };

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;

  for (const match of text.matchAll(LINK_RE)) {
    const index = match.index ?? 0;
    if (index > last) {
      segments.push({ kind: "text", value: text.slice(last, index) });
    }
    segments.push({ kind: "link", label: match[1], href: match[2] });
    last = index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ kind: "text", value: text.slice(last) });
  }

  return segments.length ? segments : [{ kind: "text", value: text }];
}

function isInAppHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

/** Renders assistant text with in-app markdown links as action buttons. */
export function AiAssistantMessage({ text }: { text: string }) {
  const segments = parseSegments(text);

  return (
    <div className="space-y-2">
      {segments.map((segment, i) => {
        if (segment.kind === "text") {
          const trimmed = segment.value.trim();
          if (!trimmed) return null;
          return (
            <p key={i} className="whitespace-pre-wrap">
              {segment.value}
            </p>
          );
        }

        if (isInAppHref(segment.href)) {
          return (
            <Link
              key={i}
              href={segment.href}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[12px] font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-100"
            >
              {segment.label}
              <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </Link>
          );
        }

        return (
          <a
            key={i}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 underline"
          >
            {segment.label}
          </a>
        );
      })}
    </div>
  );
}
