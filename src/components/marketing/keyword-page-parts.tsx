import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import { HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";
import { SPEAKABLE_CLASS } from "@/components/seo/json-ld";

/** Shared blocks for the keyword landing pages (/contractor-email-list, /businesses-without-websites, ...). */

export function HeroChecks({ items }: { items: string[] }) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] font-medium text-white/80">
      {items.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" aria-hidden />
          {t}
        </span>
      ))}
    </div>
  );
}

export function QuickAnswer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6 sm:p-8">
      <p className={`${SPEAKABLE_CLASS} text-[16px] leading-relaxed text-slate-700`}>{children}</p>
    </div>
  );
}

export function StepCards({
  steps,
}: {
  steps: Array<{ icon: ComponentType<{ className?: string }>; title: string; text: string }>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, text }, i) => (
        <div key={title} className="relative rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
          <span className="absolute right-5 top-5 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-violet-100">
            {i + 1}
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-md">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="mt-4 text-[17px] font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{text}</p>
        </div>
      ))}
    </div>
  );
}

/** Question-led content blocks: an H3 question with a direct answer underneath. */
export function AnswerBlocks({ items }: { items: Array<{ q: string; a: ReactNode }> }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
      {items.map((it) => (
        <article key={it.q} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-[17px] font-bold text-slate-900">{it.q}</h3>
          <div className="mt-2 space-y-3 text-[14.5px] leading-relaxed text-slate-600">{it.a}</div>
        </article>
      ))}
    </div>
  );
}

/** Real product screenshot (dashboard of the app). */
export function ProductProof({ caption }: { caption: string }) {
  return (
    <figure className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <Image
          src="/lighttheme2.png"
          alt="Contractor Leads dashboard with lead counts, credits and the quick lead search by trade and area"
          width={2940}
          height={1672}
          sizes="(min-width: 1024px) 1000px, 100vw"
          className="h-auto w-full rounded-2xl"
        />
      </div>
      <figcaption className="mt-3 text-center text-[13px] text-slate-500">{caption}</figcaption>
    </figure>
  );
}

export function CompareTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<[string, ...Array<boolean | string>]>;
}) {
  const last = headers.length - 2;
  return (
    <div className="mx-auto max-w-4xl overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left text-[14px]">
        <thead className="bg-slate-50 text-[12.5px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            {headers.map((h, i) => (
              <th key={h || "feature"} scope="col" className={`px-4 py-3 ${i === headers.length - 1 ? "text-fuchsia-700" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(([label, ...cells]) => (
            <tr key={label}>
              <th scope="row" className="px-4 py-3 font-semibold text-slate-900">
                {label}
              </th>
              {cells.map((c, i) => (
                <td key={i} className={`px-4 py-3 ${i === last ? "bg-fuchsia-50/50" : ""}`}>
                  {c === true ? (
                    <HiOutlineCheck className="h-5 w-5 text-emerald-600" aria-label="Yes" />
                  ) : c === false ? (
                    <HiOutlineXMark className="h-5 w-5 text-slate-300" aria-label="No" />
                  ) : (
                    <span className="text-slate-600">{c}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FaqList({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  return (
    <dl className="mx-auto max-w-3xl divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white px-6">
      {faqs.map((f) => (
        <div key={f.q} className="py-5">
          <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
          <dd className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{f.a}</dd>
        </div>
      ))}
    </dl>
  );
}
