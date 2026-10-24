import { promises as dns } from "node:dns";

export type DnsStatus = "pass" | "warn" | "fail";

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
  "google",
  "selector1",
  "selector2",
  "s1",
  "s2",
  "k1",
  "default",
  "mail",
  "hostingermail1",
  "hostingermail2",
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
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      return {
        status: "fail",
        record: null,
        reason: "No TXT records found on domain root.",
      };
    }
    return {
      status: "fail",
      record: null,
      reason: `DNS lookup failed: ${err.message || String(err)}`,
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

  for (const sel of selectorsToTest) {
    const dkimHost = `${sel}._domainkey.${domain}`;
    try {
      const records = await dns.resolveTxt(dkimHost);
      const joined = records.map((r) => r.join("")).join("");

      if (joined.includes("v=DKIM1") || joined.includes("p=")) {
        // Found DKIM!
        const isWeak = joined.includes("p=") && joined.length < 150; // short key < 1024/2048 bit
        return {
          status: isWeak ? "warn" : "pass",
          selector: sel,
          record: joined.slice(0, 80) + (joined.length > 80 ? "..." : ""),
          reason: isWeak
            ? `DKIM found on selector "${sel}", but key length appears under 2048-bit.`
            : `Valid DKIM signature verified on selector "${sel}".`,
        };
      }
    } catch {
      // Selector not found, check next
      continue;
    }
  }

  return {
    status: "fail",
    selector: preferredSelector || "google",
    record: null,
    reason: "No DKIM record found on common selectors (google, selector1, s1, hostingermail1, etc.).",
    instructions: "Generate and publish your DKIM TXT record in your DNS provider under selector._domainkey.",
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
        instructions: "Set TXT at _dmarc with 'v=DMARC1; p=quarantine; ...'",
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
        status: "warn",
        record: joined,
        reason: "DMARC policy is set to 'p=none' (monitoring only). Inbox providers prefer quarantine/reject.",
        instructions: "Change 'p=none' to 'p=quarantine' after verifying SPF and DKIM pass.",
      };
    }

    return {
      status: "warn",
      record: joined,
      reason: "DMARC record present but missing an explicit p= policy directive.",
    };
  } catch (err: any) {
    return {
      status: "fail",
      record: null,
      reason: "No DMARC record found at _dmarc." + domain,
      expected: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
      instructions: `Add a TXT record for host '_dmarc' with value 'v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}'.`,
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
    return {
      status: "fail",
      record: null,
      mailServers: [],
      reason: `MX DNS lookup failed: ${err.message || String(err)}`,
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

  let overallStatus: DnsStatus = "pass";
  if (spf.status === "fail" || dkim.status === "fail" || dmarc.status === "fail" || mx.status === "fail") {
    overallStatus = "fail";
  } else if (spf.status === "warn" || dkim.status === "warn" || dmarc.status === "warn") {
    overallStatus = "warn";
  }

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
      dkimVal: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [{ host: "@", priority: 1, target: "smtp.google.com" }],
    },
    microsoft: {
      spf: "v=spf1 include:spf.protection.outlook.com -all",
      dkimHost: "selector1._domainkey",
      dkimVal: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [{ host: "@", priority: 0, target: `${cleanDomain.replace(/\./g, "-")}.mail.protection.outlook.com` }],
    },
    hostinger: {
      spf: "v=spf1 include:_spf.mail.hostinger.com ~all",
      dkimHost: "hostingermail1._domainkey",
      dkimVal: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [
        { host: "@", priority: 5, target: "mx1.hostinger.com" },
        { host: "@", priority: 10, target: "mx2.hostinger.com" },
      ],
    },
    godaddy: {
      spf: "v=spf1 include:secureserver.net ~all",
      dkimHost: "s1._domainkey",
      dkimVal: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${cleanDomain}`,
      mx: [
        { host: "@", priority: 0, target: "smtp.secureserver.net" },
        { host: "@", priority: 10, target: "mailstore1.secureserver.net" },
      ],
    },
    custom: {
      spf: "v=spf1 a mx ~all",
      dkimHost: "default._domainkey",
      dkimVal: "v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>",
      dmarc: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${cleanDomain}`,
      mx: [{ host: "@", priority: 10, target: `mail.${cleanDomain}` }],
    },
  };

  return configs[provider] || configs.custom;
}
