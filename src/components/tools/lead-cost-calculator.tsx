"use client";

import { useState } from "react";

const usd = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 100 ? 2 : 0 }) : "–";

export function calcLeadCost(i: { spend: number; leads: number; closeRate: number; jobValue: number; margin: number }) {
  const costPerLead = i.leads > 0 ? i.spend / i.leads : NaN;
  const jobs = i.leads * (i.closeRate / 100);
  const costPerJob = jobs > 0 ? i.spend / jobs : NaN;
  const revenue = jobs * i.jobValue;
  const grossProfit = revenue * (i.margin / 100);
  const roi = i.spend > 0 ? ((grossProfit - i.spend) / i.spend) * 100 : NaN;
  const breakEvenCloseRate = i.leads > 0 && i.jobValue > 0 && i.margin > 0 ? (i.spend / (i.leads * i.jobValue * (i.margin / 100))) * 100 : NaN;
  return { costPerLead, jobs, costPerJob, revenue, grossProfit, roi, breakEvenCloseRate };
}

function Field({ id, label, value, onChange, suffix }: { id: string; label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label htmlFor={id} className="block text-[13px] font-semibold text-slate-700">
      {label}
      <div className="mt-1.5 flex items-center rounded-xl border border-slate-300 focus-within:border-fuchsia-500">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-full rounded-xl bg-transparent px-4 text-[15px] text-slate-900 focus:outline-none"
        />
        {suffix ? <span className="pr-4 text-[13px] text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

/** Contractor lead cost and ROI: what a marketing channel really costs per job won. */
export function LeadCostCalculator() {
  const [spend, setSpend] = useState(2000);
  const [leads, setLeads] = useState(40);
  const [closeRate, setCloseRate] = useState(25);
  const [jobValue, setJobValue] = useState(9000);
  const [margin, setMargin] = useState(35);
  const r = calcLeadCost({ spend, leads, closeRate, jobValue, margin });
  const out: Array<[string, string]> = [
    ["Cost per lead", usd(r.costPerLead)],
    ["Jobs won per month", Number.isFinite(r.jobs) ? r.jobs.toFixed(1) : "–"],
    ["Cost per job won", usd(r.costPerJob)],
    ["Revenue from these jobs", usd(r.revenue)],
    ["Gross profit", usd(r.grossProfit)],
    ["Return on marketing spend", Number.isFinite(r.roi) ? `${Math.round(r.roi)}%` : "–"],
    ["Break-even close rate", Number.isFinite(r.breakEvenCloseRate) ? `${r.breakEvenCloseRate.toFixed(1)}%` : "–"],
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="lc-spend" label="Monthly marketing spend" value={spend} onChange={setSpend} suffix="USD" />
        <Field id="lc-leads" label="Leads per month" value={leads} onChange={setLeads} />
        <Field id="lc-close" label="Close rate" value={closeRate} onChange={setCloseRate} suffix="%" />
        <Field id="lc-job" label="Average job value" value={jobValue} onChange={setJobValue} suffix="USD" />
        <Field id="lc-margin" label="Gross margin" value={margin} onChange={setMargin} suffix="%" />
      </div>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2" aria-live="polite">
        {out.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
            <dd className="mt-1 text-[20px] font-bold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[12.5px] text-slate-500">Example values only; enter the contractor&apos;s own numbers. Nothing you type is stored.</p>
    </div>
  );
}
