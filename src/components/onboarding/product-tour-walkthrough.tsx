"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PRODUCT_TOUR_STEPS } from "@/lib/product-tour";
import { cn } from "@/lib/utils";

export function ProductTourWalkthrough({
  open,
  onCompleted,
}: {
  open: boolean;
  onCompleted: () => void;
}) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(open);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setVisible(open);
    if (open) setStep(0);
  }, [open]);

  if (!visible) return null;

  const total = PRODUCT_TOUR_STEPS.length;
  const current = PRODUCT_TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step >= total - 1;

  async function finish() {
    startTransition(async () => {
      try {
        await fetch("/api/user/product-tour", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
      } catch {
        /* still dismiss locally */
      }
      setVisible(false);
      onCompleted();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
    >
      <div className="page-enter w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-elevated)]">
        <div className="border-b border-border bg-[var(--canvas)] px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Product tour · {step + 1} of {total}
          </p>
          <div className="mt-3 flex gap-1.5">
            {PRODUCT_TOUR_STEPS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-brand-500" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>

        <div key={current.id} className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-[var(--canvas)] dark:bg-brand-500 dark:text-white">
            <Icon className="h-5 w-5" />
          </div>
          <h2
            id="product-tour-title"
            className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink"
          >
            {current.title}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            {current.body}
          </p>
          {current.bullets?.length ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] text-ink-muted">
              {current.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
          {current.href ? (
            <Link
              href={current.href}
              className="mt-4 inline-flex text-[13px] font-semibold text-brand-600 hover:underline"
              onClick={() => {
                if (isLast) void finish();
              }}
            >
              {current.hrefLabel || "Open"} →
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <button
            type="button"
            className="text-[13px] font-semibold text-ink-faint hover:text-ink-muted"
            disabled={pending}
            onClick={() => void finish()}
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                className="rounded-xl border border-border px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-[var(--input-bg)]"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
            ) : null}
            {isLast ? (
              <button
                type="button"
                disabled={pending}
                className="rounded-xl bg-ink px-4 py-2 text-[13px] font-semibold text-[var(--canvas)] dark:bg-brand-500 dark:text-white"
                onClick={() => void finish()}
              >
                {pending ? "Saving…" : "Got it — let’s go"}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-ink px-4 py-2 text-[13px] font-semibold text-[var(--canvas)] dark:bg-brand-500 dark:text-white"
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
