"use client";

import Image from "next/image";
import {
  LOGO_GRADIENT,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { SectionLabel } from "@/components/ui/section";
import { AiAssistantWorkspace } from "@/components/ai/ai-assistant-workspace";
import {
  HiOutlineDocumentText,
  HiOutlineSparkles,
} from "react-icons/hi2";

export function AskExpertClient({
  userName,
}: {
  userName?: string | null;
}) {
  return (
    <div className="page-pad page-enter relative min-h-[calc(100vh-8rem)]">
      <div className="mesh-bg absolute inset-0 -z-10 rounded-2xl" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="animate-float relative flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[var(--shadow-card)]">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="animate-soft-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
          </div>
          <div>
            <SectionLabel>AI assistant</SectionLabel>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Ask <span className="gradient-text">Contractor Leads</span>
            </h1>
            <p className="text-[13px] text-ink-muted">
              Chat history, multi-turn answers, and growth help for your agency
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryActionLink href="/scripts">
            <HiOutlineDocumentText className="h-4 w-4" />
            My Scripts
          </SecondaryActionLink>
          <SecondaryActionLink href="/leads/search">
            <HiOutlineSparkles className="h-4 w-4" />
            Lead Finder
          </SecondaryActionLink>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px]">
        <AiAssistantWorkspace userName={userName} showAskExpertLink={false} />
        <p className="mt-3 text-center text-[12px] text-ink-faint">
          Tip: complete{" "}
          <a
            href="/settings"
            className="font-medium text-brand-500 hover:underline"
          >
            Settings
          </a>{" "}
          so answers match your services &amp; geo.{" "}
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ background: LOGO_GRADIENT }}
          >
            1.59 credits / message
          </span>
        </p>
      </div>
    </div>
  );
}
