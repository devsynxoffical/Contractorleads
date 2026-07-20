"use client";

import { useEffect, useRef } from "react";
import { recordMarketingVisit } from "@/lib/client/marketing-track";

/** Sets `cl_mkt_vid` cookie and records visit for marketing outreach. */
export function MarketingVisitTracker() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void recordMarketingVisit();
  }, []);

  return null;
}
