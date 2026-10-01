import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyEmailBatch, type EmailVerificationResult } from "@/lib/email-verifier";

export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const segmentId = typeof body.segmentId === "string" ? body.segmentId.trim() : null;
  const leadIds = Array.isArray(body.leadIds)
    ? (body.leadIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())))
    : null;
  const skipSmtp = Boolean(body.skipSmtp);

  // Mode A: Verify & Clean an existing saved Segment
  if (segmentId) {
    const segment = await prisma.leadSegment.findFirst({
      where: { id: segmentId, userId: user.id },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    let targetLeadIds: string[] = [];
    if (segment.leadIdsJson) {
      try {
        const parsed = JSON.parse(segment.leadIdsJson);
        if (Array.isArray(parsed)) targetLeadIds = parsed;
      } catch {
        /* fallback to filter */
      }
    }

    // If no leadIdsJson, query leads belonging to user matching segment
    let leadsToVerify: Array<{ id: string; email: string | null; businessName: string }> = [];
    if (targetLeadIds.length > 0) {
      leadsToVerify = await prisma.lead.findMany({
        where: { id: { in: targetLeadIds } },
        select: { id: true, email: true, businessName: true },
      });
    } else {
      const where: Record<string, unknown> = {};
      if (segment.industry && segment.industry !== "all") {
        where.industry = { contains: segment.industry, mode: "insensitive" };
      }
      if (segment.country) where.country = segment.country;
      if (segment.state) where.state = segment.state;
      if (segment.city) where.city = { contains: segment.city, mode: "insensitive" };

      leadsToVerify = await prisma.lead.findMany({
        where,
        select: { id: true, email: true, businessName: true },
        take: 2500,
        orderBy: { createdAt: "desc" },
      });
    }

    // Extract emails to triple check
    const leadsWithEmail = leadsToVerify.filter((l) => Boolean(l.email && l.email.includes("@")));
    const emailList = leadsWithEmail.map((l) => l.email!.trim().toLowerCase());

    const summary = await verifyEmailBatch(emailList, {
      skipSmtp,
      concurrency: 8,
    });

    const resultMap = new Map<string, EmailVerificationResult>();
    for (const res of summary.results) {
      resultMap.set(res.normalizedEmail.toLowerCase(), res);
      resultMap.set(res.email.toLowerCase(), res);
    }

    // Filter out non-working / dead / invalid emails
    const validLeadIds: string[] = [];
    const removedLeadIds: string[] = [];
    const invalidEmails: string[] = [];

    for (const lead of leadsToVerify) {
      if (!lead.email) {
        // Lead has no email — remove from outreach segment
        removedLeadIds.push(lead.id);
        continue;
      }
      const norm = lead.email.trim().toLowerCase();
      const verified = resultMap.get(norm);
      if (verified && verified.status === "invalid") {
        removedLeadIds.push(lead.id);
        invalidEmails.push(norm);
      } else {
        validLeadIds.push(lead.id);
      }
    }

    // Update lead verificationStatus in DB
    if (invalidEmails.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: removedLeadIds } },
        data: { verificationStatus: "invalid" },
      }).catch(() => {});
    }
    if (validLeadIds.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: validLeadIds } },
        data: { verificationStatus: "verified" },
      }).catch(() => {});
    }

    // Update the segment with only verified working leads
    const updatedSegment = await prisma.leadSegment.update({
      where: { id: segment.id },
      data: {
        leadCount: validLeadIds.length,
        leadIdsJson: JSON.stringify(validLeadIds),
      },
      select: {
        id: true,
        name: true,
        leadCount: true,
        industry: true,
        country: true,
        state: true,
        city: true,
      },
    });

    return NextResponse.json({
      ok: true,
      segmentId: segment.id,
      segmentName: segment.name,
      totalChecked: leadsToVerify.length,
      validCount: validLeadIds.length,
      invalidCount: removedLeadIds.length,
      removedCount: removedLeadIds.length,
      remainingCount: validLeadIds.length,
      invalidEmails: invalidEmails.slice(0, 50),
      summary,
      segment: updatedSegment,
    });
  }

  // Mode B: Directly verify a list of lead IDs (from live scraped leads in Lead Finder)
  if (leadIds && leadIds.length > 0) {
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, email: true, businessName: true },
    });

    const leadsWithEmail = leads.filter((l) => Boolean(l.email && l.email.includes("@")));
    const emailList = leadsWithEmail.map((l) => l.email!.trim().toLowerCase());

    const summary = await verifyEmailBatch(emailList, {
      skipSmtp,
      concurrency: 8,
    });

    const resultMap = new Map<string, EmailVerificationResult>();
    for (const res of summary.results) {
      resultMap.set(res.normalizedEmail.toLowerCase(), res);
      resultMap.set(res.email.toLowerCase(), res);
    }

    const validLeadIds: string[] = [];
    const invalidLeadIds: string[] = [];
    const invalidEmails: string[] = [];

    for (const lead of leads) {
      if (!lead.email) {
        invalidLeadIds.push(lead.id);
        continue;
      }
      const norm = lead.email.trim().toLowerCase();
      const verified = resultMap.get(norm);
      if (verified && verified.status === "invalid") {
        invalidLeadIds.push(lead.id);
        invalidEmails.push(norm);
      } else {
        validLeadIds.push(lead.id);
      }
    }

    // Persist verification status
    if (invalidLeadIds.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: invalidLeadIds } },
        data: { verificationStatus: "invalid" },
      }).catch(() => {});
    }
    if (validLeadIds.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: validLeadIds } },
        data: { verificationStatus: "verified" },
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      totalChecked: leads.length,
      validCount: validLeadIds.length,
      invalidCount: invalidLeadIds.length,
      validLeadIds,
      invalidLeadIds,
      invalidEmails: invalidEmails.slice(0, 50),
      summary,
    });
  }

  // Mode C: Directly verify a raw list of email strings
  const emails = Array.isArray(body.emails)
    ? (body.emails.filter((e): e is string => typeof e === "string" && Boolean(e.trim())))
    : [];

  if (!emails.length) {
    return NextResponse.json(
      { error: "Provide segmentId, leadIds, or emails to verify." },
      { status: 400 },
    );
  }

  const summary = await verifyEmailBatch(emails, {
    skipSmtp,
    concurrency: 8,
  });

  return NextResponse.json({
    ok: true,
    totalChecked: emails.length,
    validCount: summary.valid,
    invalidCount: summary.invalid,
    riskyCount: summary.risky,
    summary,
  });
}
