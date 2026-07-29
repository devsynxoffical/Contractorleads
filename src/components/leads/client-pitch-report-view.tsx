"use client";

import { cn } from "@/lib/utils";

type Block =
  | { kind: "title"; text: string }
  | { kind: "meta"; text: string }
  | { kind: "section"; title: string; body: string[] }
  | { kind: "para"; text: string };

function parseReport(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  // Opening title / meta lines before first numbered section
  const preface: string[] = [];
  while (i < lines.length && !/^\d+\)\s+/.test(lines[i].trim())) {
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
    const match = line.match(/^(\d+)\)\s+(.+)$/);
    if (match) {
      const title = `${match[1]}) ${match[2]}`;
      i += 1;
      const body: string[] = [];
      while (i < lines.length && !/^\d+\)\s+/.test(lines[i].trim())) {
        body.push(lines[i]);
        i += 1;
      }
      // trim trailing blank lines
      while (body.length && !body[body.length - 1].trim()) body.pop();
      blocks.push({ kind: "section", title, body });
      continue;
    }
    if (line) blocks.push({ kind: "para", text: line });
    i += 1;
  }

  return blocks;
}

export function ClientPitchReportView({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseReport(content);

  return (
    <article
      className={cn(
        "space-y-5 bg-white px-5 py-6 sm:px-7 sm:py-8",
        className,
      )}
    >
      {blocks.map((block, idx) => {
        if (block.kind === "title") {
          return (
            <h3
              key={idx}
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink sm:text-2xl"
            >
              {block.text}
            </h3>
          );
        }
        if (block.kind === "meta") {
          return (
            <p key={idx} className="text-[13px] text-ink-muted">
              {block.text}
            </p>
          );
        }
        if (block.kind === "para") {
          return (
            <p key={idx} className="text-[14px] leading-relaxed text-ink">
              {block.text}
            </p>
          );
        }
        return (
          <section
            key={idx}
            className="rounded-2xl border border-border/80 bg-[#faf8fc]/70 px-4 py-4 sm:px-5"
          >
            <h4 className="text-[14px] font-semibold text-brand-800">
              {block.title}
            </h4>
            <div className="mt-2.5 space-y-2 text-[13.5px] leading-relaxed text-ink">
              {block.body.map((line, j) => {
                const t = line.trim();
                if (!t) return <div key={j} className="h-2" />;
                if (/^[•\-\*]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
                  return (
                    <p key={j} className="pl-1 text-ink">
                      {t.replace(/^[-\*]\s+/, "• ")}
                    </p>
                  );
                }
                return (
                  <p key={j} className="text-ink">
                    {t}
                  </p>
                );
              })}
            </div>
          </section>
        );
      })}
    </article>
  );
}
