import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isMetaConfigured } from "@/lib/services/facebook";
import { isNinjaPearConfigured } from "@/lib/services/ninjapear";

export default function FacebookAdsPage() {
  const metaConnected = isMetaConfigured();
  const ninjaConfigured = isNinjaPearConfigured();

  return (
    <div className="page-pad page-enter">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          Facebook & enrichment integrations
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Connect Meta and NinjaPear to enrich social profiles. LinkedIn URLs are
          discovered from websites + Serper (Proxycurl is shut down).
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meta / Facebook Ad Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div
              className={`inline-flex rounded-lg px-3 py-1 text-[12px] font-semibold ${
                metaConnected
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              {metaConnected ? "Connected" : "Not configured"}
            </div>
            <p className="text-ink-muted">
              Used for Facebook page lookup and Meta Ads Library searches on lead
              profiles. Without keys, the app opens the public Ads Library link.
            </p>
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3 font-mono text-[12px] text-ink">
              <p>META_APP_ID=your-app-id</p>
              <p>META_APP_SECRET=your-app-secret</p>
              <p className="mt-2 text-ink-faint">
                # or META_ACCESS_TOKEN for a user token with ads_read
              </p>
            </div>
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Create a Meta app →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NinjaPear (company enrichment)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div
              className={`inline-flex rounded-lg px-3 py-1 text-[12px] font-semibold ${
                ninjaConfigured
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              {ninjaConfigured ? "Connected" : "Not configured"}
            </div>
            <p className="text-ink-muted">
              LinkedIn + social discovery is free by default (website scrape +
              Brave Search). Optional NinjaPear adds executives / extra socials.
              Serper speeds up search if you add a key.
            </p>
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3 font-mono text-[12px] text-ink">
              <p className="text-ink-faint"># free — no key needed</p>
              <p className="mt-2">NINJAPEAR_API_KEY=optional</p>
              <p>SERPER_API_KEY=optional-faster</p>
            </div>
            <a
              href="https://nubela.co/dashboard/api/#keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Create NinjaPear API key →
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>How to use on leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-ink-muted">
          <p>
            1. Open any lead from Lead Finder or All Leads.
          </p>
          <p>
            2. Click <strong className="text-ink">Fetch</strong> under Social &
            review profiles to pull LinkedIn, Facebook, Instagram, and more.
          </p>
          <p>
            3. Click <strong className="text-ink">Check ads</strong> in the
            Facebook Ads Library card to see if they run Meta ads.
          </p>
          <p>
            4. Use <strong className="text-ink">Re-verify</strong> to refresh
            the AI verification score after fetching profiles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
