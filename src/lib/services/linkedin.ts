const LINKEDIN_HOST = "www.linkedin.com";

export type LinkedInCandidate = {
  url: string;
  type: "company" | "owner" | "founder";
  confidence: number;
};

export function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === LINKEDIN_HOST &&
      (parsed.pathname.startsWith("/company/") ||
        parsed.pathname.startsWith("/in/"))
    );
  } catch {
    return false;
  }
}

export async function verifyLinkedInUrl(url: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  if (!isValidLinkedInUrl(url)) {
    return { valid: false, reason: "Invalid URL format" };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadFlowVerifier/1.0; +https://leadflowusa.com)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404 || response.status === 410) {
      return { valid: false, reason: "Page not found" };
    }

    const html = await response.text();
    const blockedPhrases = [
      "Page Not Found",
      "Profile Unavailable",
      "Company Not Found",
      "This page doesn't exist",
    ];

    if (blockedPhrases.some((phrase) => html.includes(phrase))) {
      return { valid: false, reason: "Profile unavailable" };
    }

    return { valid: response.ok };
  } catch {
    return { valid: false, reason: "Verification failed" };
  }
}

export async function resolveLinkedIn(
  businessName: string,
  location: string,
  industry: string,
  ownerName?: string | null
): Promise<{
  url: string | null;
  type: string;
  confidence: number;
}> {
  const apiKey = process.env.LINKEDIN_DATA_API_KEY;
  const candidates: LinkedInCandidate[] = [];

  if (apiKey) {
    try {
      const query = encodeURIComponent(`${businessName} ${location} ${industry}`);
      const response = await fetch(
        `https://nubela.co/proxycurl/api/v2/linkedin/company/resolve?company_domain=&company_name=${query}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as { url?: string };
        if (data.url && isValidLinkedInUrl(data.url)) {
          candidates.push({ url: data.url, type: "company", confidence: 96 });
        }
      }
    } catch {
      // Fall through — never fabricate
    }
  }

  if (ownerName && apiKey) {
    try {
      const response = await fetch(
        `https://nubela.co/proxycurl/api/linkedin/profile/resolve?first_name=${encodeURIComponent(ownerName.split(" ")[0] || "")}&last_name=${encodeURIComponent(ownerName.split(" ").slice(1).join(" ") || "")}&company_domain=`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as { url?: string };
        if (data.url && isValidLinkedInUrl(data.url)) {
          candidates.push({ url: data.url, type: "owner", confidence: 95 });
        }
      }
    } catch {
      // Fall through
    }
  }

  const company = candidates.find((c) => c.type === "company");
  if (company) {
    const check = await verifyLinkedInUrl(company.url);
    if (check.valid && company.confidence >= 95) {
      return { url: company.url, type: "company", confidence: company.confidence };
    }
  }

  const owner = candidates.find((c) => c.type === "owner" || c.type === "founder");
  if (owner) {
    const check = await verifyLinkedInUrl(owner.url);
    if (check.valid && owner.confidence >= 95) {
      return { url: owner.url, type: owner.type, confidence: owner.confidence };
    }
  }

  return { url: null, type: "none", confidence: 0 };
}
