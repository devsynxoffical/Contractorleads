"use client";

import { useMemo, useState } from "react";

/**
 * Cold email subject line tester. A transparent checklist (length, spam-trigger words,
 * capitals, punctuation, fake "Re:", personalization), not a deliverability guarantee.
 */
const SPAM_WORDS = [
  "free", "guarantee", "guaranteed", "act now", "limited time", "click here", "buy now", "urgent", "winner",
  "100%", "risk-free", "risk free", "no obligation", "cash", "earn money", "make money", "double your",
  "best price", "lowest price", "special promotion", "exclusive deal", "congratulations", "$$$", "amazing",
  "once in a lifetime", "increase sales", "100% free", "order now", "don't delete", "dear friend",
];

type Check = { ok: boolean; label: string; detail: string; weight: number };

export function analyzeSubject(raw: string) {
  const s = raw.trim();
  const lower = s.toLowerCase();
  const words = s.split(/\s+/).filter(Boolean);
  const spam = SPAM_WORDS.filter((w) => new RegExp(`(^|[^a-z])${w.replace(/[$%]/g, "\\$&")}([^a-z]|$)`, "i").test(lower));
  const caps = words.filter((w) => w.length > 2 && /[A-Z]/.test(w) && w === w.toUpperCase() && /[A-Z]{3,}/.test(w));
  const emoji = (s.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  const checks: Check[] = [
    { ok: s.length >= 15 && s.length <= 50, label: "Length", detail: `${s.length} characters (aim for 15 to 50 so it fits on a phone).`, weight: 20 },
    { ok: words.length >= 2 && words.length <= 8, label: "Word count", detail: `${words.length} words (2 to 8 reads like a person wrote it).`, weight: 10 },
    { ok: spam.length === 0, label: "Spam-trigger words", detail: spam.length ? `Remove: ${spam.join(", ")}.` : "None found.", weight: 25 },
    { ok: caps.length === 0, label: "All-caps words", detail: caps.length ? `Lower-case: ${caps.join(", ")}.` : "None found.", weight: 10 },
    { ok: !/[!?]{2,}|!/.test(s), label: "Exclamation marks", detail: /!/.test(s) ? "Drop the exclamation marks; they read as marketing." : "None found.", weight: 10 },
    { ok: !/^\s*(re|fwd?)\s*:/i.test(s), label: "No fake Re:/Fwd:", detail: /^\s*(re|fwd?)\s*:/i.test(s) ? "A fake Re: on a first email misleads the reader and is a CAN-SPAM risk." : "Good.", weight: 15 },
    { ok: emoji === 0, label: "Emoji", detail: emoji ? `${emoji} emoji; plain text looks more personal in B2B email.` : "None found.", weight: 5 },
    { ok: /\{\{\s*\w+\s*\}\}|\[[a-z ]+\]/i.test(s) || /\b(your|you)\b/i.test(s), label: "Personal or relevant", detail: "Mention their company, city or a {{token}} so it reads as written for them.", weight: 5 },
  ];
  const score = s ? checks.reduce((a, c) => a + (c.ok ? c.weight : 0), 0) : 0;
  return { score, checks };
}

export function SubjectLineTester() {
  const [subject, setSubject] = useState("Quick question about {{company}}'s Google reviews");
  const r = useMemo(() => analyzeSubject(subject), [subject]);
  const band = r.score >= 80 ? "text-emerald-700" : r.score >= 60 ? "text-amber-700" : "text-rose-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <label htmlFor="subject-line" className="text-[13px] font-semibold text-slate-700">
        Your subject line
      </label>
      <input
        id="subject-line"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={200}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-4 text-[15px] text-slate-900 focus:border-fuchsia-500 focus:outline-none"
      />
      <p className={`mt-4 text-[28px] font-bold ${band}`} aria-live="polite">
        {r.score}/100
      </p>
      <ul className="mt-3 space-y-2">
        {r.checks.map((c) => (
          <li key={c.label} className="flex gap-2.5 text-[14px]">
            <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`} aria-hidden>
              {c.ok ? "✓" : "!"}
            </span>
            <span>
              <b className="text-slate-900">{c.label}:</b> <span className="text-slate-600">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
