/** Re-export shared audit types/helpers from the live crawler. */
export type { WebsiteAudit, SitePageFinding, SitePageKey } from "@/lib/services/website-audit";
export {
  emptyWebsiteAudit,
  pendingWebsiteAudit,
} from "@/lib/services/website-audit";
