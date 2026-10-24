import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkDomainDns, getDnsFixInstructions } from "@/lib/dns-checker";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const domain = (body.domain || "").toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  try {
    const report = await checkDomainDns(domain);

    // Update in database cache
    const updated = await prisma.domainDnsCache.upsert({
      where: { domain },
      update: {
        provider: report.provider,
        overallStatus: report.overallStatus,
        spfStatus: report.spf.status,
        spfRecord: report.spf.record,
        dkimStatus: report.dkim.status,
        dkimSelector: report.dkim.selector,
        dkimRecord: report.dkim.record,
        dmarcStatus: report.dmarc.status,
        dmarcRecord: report.dmarc.record,
        mxStatus: report.mx.status,
        mxRecords: report.mx.record,
        lastCheckedAt: new Date(),
      },
      create: {
        domain,
        provider: report.provider,
        overallStatus: report.overallStatus,
        spfStatus: report.spf.status,
        spfRecord: report.spf.record,
        dkimStatus: report.dkim.status,
        dkimSelector: report.dkim.selector,
        dkimRecord: report.dkim.record,
        dmarcStatus: report.dmarc.status,
        dmarcRecord: report.dmarc.record,
        mxStatus: report.mx.status,
        mxRecords: report.mx.record,
      },
    });

    const fixInstructions = getDnsFixInstructions(domain, report.provider);

    return NextResponse.json({
      ok: true,
      report,
      cached: updated,
      fixInstructions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `DNS check failed: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
