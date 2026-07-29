"use client";

import { cn } from "@/lib/utils";

type Block =
  | { kind: "title"; text: string }
  | { kind: "meta"; text: string }
  | { kind: "section"; num: string; title: string; body: string[] }
  | { kind: "para"; text: string };

const KNOWN_SECTION_TITLES =
  /^(cover note|what we reviewed|issues we found|why this costs you jobs|how we help|what you get|recommended next step)\b/i;

/** Real proposal sections only — not nested "1) Rewrite the homepage…". */
function isMajorSectionHeading(line: string): RegExpMatchArray | null {
  const match = line.match(/^(\d{1,2})\)\s+(.+)$/);
  if (!match) return null;
  const title = match[2].trim();
  if (KNOWN_SECTION_TITLES.test(title)) return match;
  if (title.length <= 42 && !/[,.]/.test(title) && /^[A-Z]/.test(title)) {
    const words = title.split(/\s+/);
    if (words.length <= 7) return match;
  }
  return null;
}

function parseReport(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const preface: string[] = [];
  while (i < lines.length && !isMajorSectionHeading(lines[i].trim())) {
    const t = lines[i].trim();
    if (t) preface.push(t);
    i += 1;
  }
  if (preface.length) {
    blocks.push({ kind: "title", text: preface[0] });
    for (const line of preface.slice(1)) {
      blocks.push({ kind: "meta", text: line });
    }
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    const match = isMajorSectionHeading(line);
    if (match) {
      const num = match[1];
      const title = match[2].trim();
      i += 1;
      const body: string[] = [];
      while (i < lines.length && !isMajorSectionHeading(lines[i].trim())) {
        body.push(lines[i]);
        i += 1;
      }
      while (body.length && !body[body.length - 1].trim()) body.pop();
      blocks.push({ kind: "section", num, title, body });
      continue;
    }
    if (line) blocks.push({ kind: "para", text: line });
    i += 1;
  }

  return blocks;
}

function parseMetaLine(text: string): { label: string; value: string } | null {
  const m = text.match(/^([^:]{2,48}):\s+(.+)$/);
  if (!m) return null;
  return { label: m[1], value: m[2] };
}

function BodyLines({ lines }: { lines: string[] }) {
  return (
    <div className="mt-3.5 space-y-2.5 text-[14.5px] leading-[1.75] text-ink">
      {lines.map((line, j) => {
        const t = line.trim();
        if (!t) return <div key={j} className="h-2.5" aria-hidden />;

        const bullet = t.match(/^[•\-\*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={j} className="flex gap-3">
              <span
                className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                aria-hidden
              />
              <p className="min-w-0 flex-1">{bullet[1]}</p>
            </div>
          );
        }

        const numbered = t.match(/^(\d+[.)])\s+(.*)$/);
        if (numbered) {
          return (
            <div key={j} className="flex gap-3">
              <span className="w-6 shrink-0 pt-0.5 text-[13px] font-bold tabular-nums text-brand-700">
                {numbered[1].replace(/\)$/, ".")}
              </span>
              <p className="min-w-0 flex-1">{numbered[2]}</p>
            </div>
          );
        }

        const kv = t.match(/^([^:]{2,40}):\s+(.+)$/);
        if (kv && !t.includes("http") && kv[1].length < 36) {
          return (
            <p key={j}>
              <span className="font-semibold text-ink">{kv[1]}:</span>{" "}
              <span className="text-ink-muted">{kv[2]}</span>
            </p>
          );
        }

        return <p key={j}>{t}</p>;
      })}
    </div>
  );
}

/** Professional proposal document for pitch / qualification reports. */
export function ClientPitchReportView({
  content,
  className,
  compact,
}: {
  content: string;
  className?: string;
  compact?: boolean;
}) {
  const blocks = parseReport(content);
  const title = blocks.find((b) => b.kind === "title");
  const metas = blocks.filter((b) => b.kind === "meta");
  const rest = blocks.filter((b) => b.kind !== "title" && b.kind !== "meta");
  const sectionCount = rest.filter((b) => b.kind === "section").length;

  return (
    <article
      className={cn(
        "report-doc relative overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-elevated)]",
        className,
      )}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, #c026d3 0%, #a21caf 45%, #7c3aed 100%)",
        }}
        aria-hidden
      />

      <div
        className={cn(
          "relative",
          compact ? "px-5 py-6 sm:px-7 sm:py-7" : "px-6 py-8 sm:px-10 sm:py-10",
        )}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500/80 via-brand-400/40 to-transparent"
          aria-hidden
        />

        <header className="border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
              Client proposal
            </p>
            {sectionCount > 0 ? (
              <p className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                {sectionCount} sections
              </p>
            ) : null}
          </div>

          {title ? (
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.45rem] font-semibold leading-snug tracking-tight text-ink sm:text-[1.75rem]">
              {title.text}
            </h3>
          ) : null}

          {metas.length ? (
            <dl className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {metas.map((m, idx) => {
                if (m.kind !== "meta") return null;
                const parsed = parseMetaLine(m.text);
                if (parsed) {
                  return (
                    <div key={idx} className="min-w-0">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                        {parsed.label}
                      </dt>
                      <dd className="mt-0.5 truncate text-[13px] font-medium text-ink">
                        {parsed.value}
                      </dd>
                    </div>
                  );
                }
                return (
                  <p
                    key={idx}
                    className="text-[13px] leading-relaxed text-ink-muted sm:col-span-2"
                  >
                    {m.text}
                  </p>
                );
              })}
            </dl>
          ) : null}
        </header>

        <div className={cn("mt-7", compact ? "space-y-6" : "space-y-8")}>
          {rest.map((block, idx) => {
            if (block.kind === "para") {
              return (
                <p
                  key={idx}
                  className="text-[14.5px] leading-[1.75] text-ink"
                >
                  {block.text}
                </p>
              );
            }
            if (block.kind !== "section") return null;
            return (
              <section key={idx} className="relative pl-0 sm:pl-1">
                <div className="flex items-start gap-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-bold tabular-nums text-brand-800 ring-1 ring-brand-200"
                    aria-hidden
                  >
                    {block.num}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-border/80 pb-6 last:border-0">
                    <h4 className="pt-1 font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight text-ink sm:text-[17px]">
                      {block.title}
                    </h4>
                    <BodyLines lines={block.body} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-8 border-t border-border pt-4">
          <p className="text-[11px] leading-relaxed text-ink-faint">
            Confidential proposal · Prepared for the business owner · Not for
            public distribution
          </p>
        </footer>
      </div>
    </article>
  );
}
