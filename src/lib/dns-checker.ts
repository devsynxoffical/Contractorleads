import { promises as dns } from "node:dns";

/** "unknown" = the lookup itself failed (timeout, resolver error), so nothing is claimed either way. */
export type DnsStatus = "pass" | "warn" | "fail" | "unknown";

/** DNS answers that mean "this record does not exist" (as opposed to "could not look it up"). */
function isNoRecord(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return ["ENOTFOUND", "ENODATA", "NXDOMAIN", "ENONAME"].includes(code ?? "");
}

export type RecordCheckResult = {
  status: DnsStatus;
  record: string | null;
  reason: string;
  expected?: string;
  instructions?: string;
};

export type DomainDnsReport = {
  domain: string;
  checkedAt: string;
  provider: "google" | "microsoft" | "hostinger" | "godaddy" | "custom";
  overallStatus: DnsStatus;
  spf: RecordCheckResult;
  dkim: RecordCheckResult & { selector: string };
  dmarc: RecordCheckResult;
  mx: RecordCheckResult & { mailServers: string[] };
};

const COMMON_DKIM_SELECTORS = [
  // Hostinger
  "hostingermail-a",
  "hostingermail-b",
  "hostingermail-c",
  // Microsoft 365 (also GoDaddy Microsoft 365 email)
  "selector1",
  "selector2",
  // Google Workspace
  "google",
  // Common generic selectors
  "default",
  "dkim",
  "mail",
  "s1",
  "s2",
  "k1",
  "k2",
  "zoho",
];

/**
 * Check SPF record for a domain
 */
export async function checkSpf(domain: string): Promise<RecordCheckResult> {
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const joined = txtRecords.map((r) => r.join(""));
    const spfRecords = joined.filter((r) => r.startsWith("v=spf1"));

    if (spfRecords.length === 0) {
      return {
        status: "fail",
        record: null,
        reason: "No SPF record found. Emails sent without SPF will fail DMARC and trigger spam filters.",
        expected: "v=spf1 include:_spf.google.com ~all (or your mail host include)",
        instructions: "Add a TXT record with host '@' and value 'v=spf1 include:<provider_include> ~all'.",
      };
    }

    if (spfRecords.length > 1) {
      return {
        status: "fail",
        record: spfRecords.join(" | "),
        reason: `Multiple SPF records found (${spfRecords.length}). RFC 7208 mandates exactly ONE SPF record per domain.`,
        instructions: "Merge all include: directives into a single TXT record.",
      };
    }

    const rec = spfRecords[0];

    // Check ending
    if (rec.endsWith("+all")) {
      return {
        status: "fail",
        record: rec,
        reason: "SPF ends with '+all' which allows anyone in the world to spoof your domain.",
        instructions: "Change '+all' to '~all' or '-all'.",
      };
    }

    if (rec.endsWith("?all")) {
      return {
        status: "warn",
        record: rec,
        reason: "SPF ends with '?all' (neutral policy). It provides weak deliverability protection.",
        instructions: "Update '?all' to '~all' (SoftFail) or '-all' (HardFail).",
      };
    }

    return {
      status: "pass",
      record: rec,
      reason: "Valid SPF record configured with secure policy.",
    };
  } catch (err: any) {
    if (isNoRecord(err)) {
      return {
        status: "fail",
        record: null,
        reason: "No SPF record: the domain has no TXT records.",
        instructions: "Add a TXT record with host '@' and value 'v=spf1 include:<provider_include> ~all'.",
      };
    }
    return {
      status: "unknown",
      record: null,
      reason: `Could not check SPF right now (${err.code || err.message || "DNS error"}). Re-check in a minute.`,
    };
  }
}

/**
 * Check DKIM record for a domain across common selectors or user-provided selector
 */
export async function checkDkim(
  domain: string,
  preferredSelector?: string
): Promise<RecordCheckResult & { selector: string }> {
  const selectorsToTest = preferredSelector
    ? [preferredSelector, ...COMMON_DKIM_SELECTORS.filter((s) => s !== preferredSelector)]
    : COMMON_DKIM_SELECTORS;

  // Look up every selector in parallel; DKIM keys are often CNAMEs, which resolveTxt follows.
  const lookups = await Promise.all(
    selectorsToTest.map(async (sel) => {
      try {
        const records = await dns.resolveTxt(`${sel}._domainkey.${domain}`);
        return { sel, joined: records.map((r) => r.join("")).join(""), err: null as unknown };
      } catch (err: unknown) {
        return { sel, joined: "", err };
      }
    }),
  );

  const found = lookups.find((l) => /v=DKIM1/i.test(l.joined) || /(^|;)\s*p=[A-Za-z0-9+/]/.test(l.joined));
  if (found) {
    // A 1024-bit RSA key is ~216 base64 chars; 2048-bit is ~392.
    const key = (found.joined.match(/p=([A-Za-z0-9+/=]+)/) || [])[1] || "";
    const isWeak = key.length > 0 && key.length < 300;
    return {
      status: isWeak ? "warn" : "pass",
      selector: found.sel,
      record: found.joined.slice(0, 80) + (found.joined.length > 80 ? "..." : ""),
      reason: isWeak
        ? `DKIM key found on selector "${found.sel}", but it looks shorter than 2048-bit.`
        : `DKIM key found on selector "${found.sel}".`,
    };
  }

  // Every lookup failed with a resolver error (not "no such record"): we could not check.
  if (lookups.every((l) => l.err && !isNoRecord(l.err))) {
    return {
      status: "unknown",
      selector: preferredSelector || "",
      record: null,
      reason: "Could not check DKIM right now (DNS lookups failed). Re-check in a minute.",
    };
  }

  return {
    status: "warn",
    selector: preferredSelector || "",
    record: null,
    reason: `No DKIM key found on the common selectors (${selectorsToTest.slice(0, 6).join(", ")}…). If your provider uses another selector, DKIM may still be set up; otherwise turn on DKIM in your email host's DNS settings.`,
    instructions: "Enable DKIM in your email provider (Hostinger: Emails → your domain → DNS records) and add the record it gives you.",
  };
}

/**
 * Check DMARC policy on _dmarc.domain
 */
export async function checkDmarc(domain: string): Promise<RecordCheckResult> {
  const dmarcHost = `_dmarc.${domain}`;
  try {
    const txtRecords = await dns.resolveTxt(dmarcHost);
    const joined = txtRecords.map((r) => r.join("")).join("");

    if (!joined.includes("v=DMARC1")) {
      return {
        status: "fail",
        record: joined || null,
        reason: "TXT record exists at _dmarc but is missing the 'v=DMARC1' tag.",
        instructions: "Set TXT at _dmarc with 'v=DMARC1; p=none; rua=mailto:...'",
      };
    }

    if (joined.includes("p=reject") || joined.includes("p=quarantine")) {
      return {
        status: "pass",
        record: joined,
        reason: "Optimal DMARC protection (quarantine or reject policy active).",
      };
    }

    if (joined.includes("p=none")) {
      return {
        status: "pass",
        record: joined,
        reason: "Valid DMARC policy active (p=none compliant with Google & Yahoo 2024 sender guidelines).",
        instructions: "Optional: Advance to 'p=quarantine' after initial ramp-up for enhanced spoof defense.",
      };
    }

    return {
      status: "warn",
      record: joined,
      reason: "DMARC record found, but it has no p= policy tag.",
      instructions: "Add a policy, e.g. 'v=DMARC1; p=none; rua=mailto:dmarc@yourdomain'.",
    };
  } catch (err: any) {
    if (!isNoRecord(err)) {
      return {
        status: "unknown",
        record: null,
        reason: `Could not check DMARC right now (${err.code || err.message || "DNS error"}). Re-check in a minute.`,
      };
    }
    return {
      status: "fail",
      record: null,
      reason: "No DMARC record found at _dmarc." + domain,
      expected: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      instructions: `Add a TXT record for host '_dmarc' with value 'v=DMARC1; p=none; rua=mailto:dmarc@${domain}'.`,
    };
  }
}

/**
 * Check MX records for a domain
 */
export async function checkMx(
  domain: string
): Promise<RecordCheckResult & { mailServers: string[] }> {
  try {
    const mxRecords = await dns.resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        status: "fail",
        record: null,
        mailServers: [],
        reason: "No MX records found. Receiving servers reject emails from domains with no MX.",
        instructions: "Point MX records to your mail server (Google, Microsoft, Hostinger, etc.).",
      };
    }

    const servers = mxRecords
      .sort((a, b) => a.priority - b.priority)
      .map((m) => `${m.priority} ${m.exchange}`);

    return {
      status: "pass",
      record: servers.slice(0, 2).join(", ") + (servers.length > 2 ? ` (+${servers.length - 2} more)` : ""),
      mailServers: servers,
      reason: `Verified ${mxRecords.length} mail exchange server(s).`,
    };
  } catch (err: any) {
    if (!isNoRecord(err)) {
      return {
        status: "unknown",
        record: null,
        mailServers: [],
        reason: `Could not check MX right now (${err.code || err.message || "DNS error"}). Re-check in a minute.`,
      };
    }
    return {
      status: "fail",
      record: null,
      mailServers: [],
      reason: "No MX records: this domain cannot receive mail, and many servers reject mail from it.",
      instructions: "Point MX records to your mail server (Google, Microsoft, Hostinger, etc.).",
    };
  }
}

/**
 * Detect email provider from MX and SPF
 */
export function detectProvider(
  mxRecords: string[],
  spfRecord?: string | null
): "google" | "microsoft" | "hostinger" | "godaddy" | "custom" {
  const hay = `${mxRecords.join(" ")} ${spfRecord || ""}`.toLowerCase();
  if (hay.includes("google") || hay.includes("aspmx")) return "google";
  if (hay.includes("outlook") || hay.includes("protection.outlook.com") || hay.includes("microsoft")) return "microsoft";
  if (hay.includes("hostinger") || hay.includes("titan.email")) return "hostinger";
  if (hay.includes("secureserver.net") || hay.includes("godaddy")) return "godaddy";
  return "custom";
}

/**
 * Full DNS report for a domain
 */
export async function checkDomainDns(
  domain: string,
  preferredSelector?: string
): Promise<DomainDnsReport> {
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  const [spf, dkim, dmarc, mx] = await Promise.all([
    checkSpf(cleanDomain),
    checkDkim(cleanDomain, preferredSelector),
    checkDmarc(cleanDomain),
    checkMx(cleanDomain),
  ]);

  const provider = detectProvider(mx.mailServers, spf.record);

  const statuses = [spf.status, dkim.status, dmarc.status, mx.status];
  let overallStatus: DnsStatus = "pass";
  if (statuses.includes("fail")) overallStatus = "fail";
  else if (statuses.includes("unknown")) overallStatus = "unknown";
  else if (statuses.includes("warn")) overallStatus = "warn";

  return {
    domain: cleanDomain,
    checkedAt: new Date().toISOString(),
    provider,
    overallStatus,
    spf,
    dkim,
    dmarc,
    mx,
  };
}

/**
 * Generate 1-click copyable DNS setup instructions for Fix Drawer
 */
export function getDnsFixInstructions(
  domain: string,
  provider: "google" | "microsoft" | "hostinger" | "godaddy" | "custom"
) {
  const cleanDomain = domain.toLowerCase().trim();

  const configs: Record<string, { spf: string; dkimHost: string; dkimVal: string; dmarc: string; mx: Array<{ host: string; priority: number; target: string }> }> = {
    google: {
      spf: "v=spf1 include:_spf.google.com ~all",
      dkimHost: "google._domainkey",
      dkimVal: "Generate it in Google Admin → Apps → Gmail → Authenticate email, then paste that exact value here.",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [{ host: "@", priority: 1, target: "smtp.google.com" }],
    },
    microsoft: {
      spf: "v=spf1 include:spf.protection.outlook.com -all",
      dkimHost: "selector1._domainkey",
      dkimVal: "CNAME given in Microsoft 365 Defender → Email authentication → DKIM (one for selector1 and selector2).",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [{ host: "@", priority: 0, target: `${cleanDomain.replace(/\./g, "-")}.mail.protection.outlook.com` }],
    },
    hostinger: {
      spf: "v=spf1 include:_spf.mail.hostinger.com ~all",
      dkimHost: "hostingermail-a._domainkey",
      dkimVal: "CNAME values shown in hPanel → Emails → your domain → DNS records (hostingermail-a, -b and -c).",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [
        { host: "@", priority: 5, target: "mx1.hostinger.com" },
        { host: "@", priority: 10, target: "mx2.hostinger.com" },
      ],
    },
    godaddy: {
      spf: "v=spf1 include:secureserver.net ~all",
      dkimHost: "selector1._domainkey",
      dkimVal: "Turn on DKIM in your GoDaddy email settings; it gives the exact record (Microsoft 365 email uses selector1 / selector2).",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [
        { host: "@", priority: 0, target: "smtp.secureserver.net" },
        { host: "@", priority: 10, target: "mailstore1.secureserver.net" },
      ],
    },
    custom: {
      spf: "v=spf1 a mx ~all",
      dkimHost: "default._domainkey",
      dkimVal: "The DKIM public key from your mail server or email provider.",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${cleanDomain}`,
      mx: [{ host: "@", priority: 10, target: `mail.${cleanDomain}` }],
    },
  };

  return configs[provider] || configs.custom;
}
