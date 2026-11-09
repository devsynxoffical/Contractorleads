/**
 * Unibox threading + campaign matching against Postgres (skipped without DATABASE_URL).
 */
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ingestInboundEmail } from "@/lib/lead-email";
import { backfillThreads, setThreadLabel } from "@/lib/unibox/threads";

const d = process.env.DATABASE_URL ? describe : describe.skip;
const created: string[] = [];
const uniq = () => Math.random().toString(36).slice(2, 8);

async function workspace() {
  const u = await prisma.user.create({ data: { email: `ub-${uniq()}@example.test`, passwordHash: "x" } });
  created.push(u.id);
  return u;
}

async function campaignWithSend(userId: string, prospectEmail: string, name = "Roofers TX") {
  const c = await prisma.campaign.create({ data: { userId, name, status: "active" } });
  const p = await prisma.campaignProspect.create({
    data: { campaignId: c.id, businessName: "Acme Roofing", email: prospectEmail, status: "in_progress", lastSentAt: new Date() },
  });
  const messageId = `<${uniq()}.${uniq()}@mail.frankmillernetwork.com>`;
  await prisma.campaignLog.create({
    data: {
      campaignId: c.id,
      prospectId: p.id,
      stepIndex: 0,
      fromEmail: "frank@frankmillernetwork.com",
      toEmail: prospectEmail,
      subject: "Quick question",
      body: "Hi there",
      status: "sent",
      messageId,
    },
  });
  return { campaign: c, prospect: p, messageId };
}

const reply = (userId: string, from: string, body: string, extra: Partial<Parameters<typeof ingestInboundEmail>[0]> = {}) =>
  ingestInboundEmail({
    userId,
    fromEmail: from,
    toEmail: "frank@frankmillernetwork.com",
    subject: "Re: Quick question",
    body,
    messageId: `<${uniq()}@acme.test>`,
    receivedAt: new Date(),
    ...extra,
  });

async function threadOf(emailId: string) {
  const e = await prisma.leadEmail.findUnique({ where: { id: emailId }, include: { thread: true } });
  return e!.thread!;
}

d("unibox threading", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("matches the campaign by In-Reply-To, labels it, and stops that workspace's sequence", async () => {
    const u = await workspace();
    const email = `ethan-${uniq()}@roofingagency.us`;
    const { campaign, prospect, messageId } = await campaignWithSend(u.id, email);
    const r = await reply(u.id, email, "Sounds interesting, can you send me more details on pricing?", { inReplyTo: messageId });
    expect(r.matched).toBe(true);
    const t = await threadOf((r as { emailId: string }).emailId);
    expect(t).toMatchObject({ campaignId: campaign.id, prospectId: prospect.id, campaignMatch: "in_reply_to", label: "interested", labelSource: "auto", unread: true });
    expect((await prisma.campaignProspect.findUnique({ where: { id: prospect.id } }))!.status).toBe("replied");
    const hist = await prisma.inboxLabelHistory.findMany({ where: { threadId: t.id } });
    expect(hist).toHaveLength(1);
    expect(hist[0]).toMatchObject({ newLabel: "interested", changeType: "auto", changedBy: null });
  });

  it("a second reply joins the same thread (rule 6) and a vague reply keeps the label", async () => {
    const u = await workspace();
    const email = `amy-${uniq()}@plumbco.us`;
    const { messageId } = await campaignWithSend(u.id, email);
    const first = await reply(u.id, email, "Let's hop on a call this week.", { inReplyTo: messageId, messageId: "<first-1@plumbco.us>" });
    const second = await reply(u.id, email, "Thursday 3pm works.", { inReplyTo: "<our-reply@frank>", references: `${messageId} <first-1@plumbco.us>` });
    const t1 = await threadOf((first as { emailId: string }).emailId);
    const t2 = await threadOf((second as { emailId: string }).emailId);
    expect(t2.id).toBe(t1.id);
    expect(t2.messageCount).toBe(2);
    expect(t2.label).toBe("interested");
    expect(await prisma.inboxThread.count({ where: { userId: u.id } })).toBe(1);
  });

  it("auto-tagging never overrides a manual label; manual changes are logged", async () => {
    const u = await workspace();
    const email = `bo-${uniq()}@hvacpro.us`;
    const { messageId } = await campaignWithSend(u.id, email);
    const first = await reply(u.id, email, "Interested, tell me more.", { inReplyTo: messageId });
    const t = await threadOf((first as { emailId: string }).emailId);
    await setThreadLabel(u.id, t.id, "meeting_booked");
    await reply(u.id, email, "Actually please remove me.", { references: messageId });
    const after = await prisma.inboxThread.findUnique({ where: { id: t.id } });
    expect(after).toMatchObject({ label: "meeting_booked", labelSource: "manual" });
    const hist = await prisma.inboxLabelHistory.findMany({ where: { threadId: t.id }, orderBy: { createdAt: "asc" } });
    expect(hist.map((h) => [h.newLabel, h.changeType, h.changedBy])).toEqual([
      ["interested", "auto", null],
      ["meeting_booked", "manual", u.id],
    ]);
  });

  it("workspace isolation: a reply never stops another workspace's campaign (rule 7)", async () => {
    const a = await workspace();
    const b = await workspace();
    const email = `shared-${uniq()}@electric.us`;
    const sa = await campaignWithSend(a.id, email, "A");
    const sb = await campaignWithSend(b.id, email, "B");
    await reply(a.id, email, "Not interested, thanks.", { inReplyTo: sa.messageId });
    expect((await prisma.campaignProspect.findUnique({ where: { id: sa.prospect.id } }))!.status).toBe("replied");
    expect((await prisma.campaignProspect.findUnique({ where: { id: sb.prospect.id } }))!.status).toBe("in_progress");
    expect(await prisma.inboxThread.count({ where: { userId: b.id } })).toBe(0);
    // B's Message-ID cannot pull a reply into B's campaign from A's workspace
    const cross = await reply(a.id, email, "hello", { inReplyTo: sb.messageId });
    const t = await threadOf((cross as { emailId: string }).emailId);
    expect(t.campaignId).toBe(sa.campaign.id); // matched by prospect email within A only
  });

  it("falls back to the prospect's campaign when there are no thread headers", async () => {
    const u = await workspace();
    const email = `cy-${uniq()}@solar.us`;
    const { campaign } = await campaignWithSend(u.id, email);
    const r = await reply(u.id, email, "Who is this?", { inReplyTo: undefined });
    const t = await threadOf((r as { emailId: string }).emailId);
    expect(t).toMatchObject({ campaignId: campaign.id, campaignMatch: "prospect_email", label: "unlabelled" });
  });

  it("bounce from mailer-daemon files under the prospect and marks it bounced", async () => {
    const u = await workspace();
    const email = `gone-${uniq()}@roofers.us`;
    const { campaign, prospect } = await campaignWithSend(u.id, email);
    const r = await ingestInboundEmail({
      userId: u.id,
      fromEmail: "mailer-daemon@googlemail.com",
      toEmail: "frank@frankmillernetwork.com",
      subject: "Delivery Status Notification (Failure)",
      body: `Address not found\nFinal-Recipient: rfc822; ${email}\nStatus: 5.1.1`,
      headers: { "content-type": "multipart/report; report-type=delivery-status" },
    });
    const t = await threadOf((r as { emailId: string }).emailId);
    expect(t).toMatchObject({ contactEmail: email, campaignId: campaign.id, label: "automatic_reply" });
    expect((await prisma.campaignProspect.findUnique({ where: { id: prospect.id } }))!.status).toBe("bounced");
  });

  it("RFC 3834 out-of-office gets Out of Office with a follow-up date", async () => {
    const u = await workspace();
    const email = `away-${uniq()}@gc.us`;
    const { messageId } = await campaignWithSend(u.id, email);
    const r = await reply(u.id, email, "I'm out of the office until November 20th.", {
      inReplyTo: messageId,
      subject: "Automatic reply: Quick question",
      headers: { "auto-submitted": "auto-replied" },
      receivedAt: new Date("2026-11-06T12:00:00Z"),
    });
    const t = await threadOf((r as { emailId: string }).emailId);
    expect(t.label).toBe("out_of_office");
    expect(t.followUpAt?.toISOString().slice(0, 10)).toBe("2026-11-21");
  });

  it("backfill threads replies that arrived before the Unibox, as read", async () => {
    const u = await workspace();
    const lead = await prisma.lead.create({ data: { businessName: "Old Co", email: `old-${uniq()}@old.us` } });
    try {
      await prisma.leadEmail.create({
        data: { userId: u.id, leadId: lead.id, direction: "inbound", fromEmail: lead.email!, toEmail: "frank@frankmillernetwork.com", subject: "Re: hi", body: "No thanks.", status: "received" },
      });
      expect(await backfillThreads(u.id)).toBe(1);
      const t = await prisma.inboxThread.findFirst({ where: { userId: u.id } });
      expect(t).toMatchObject({ label: "not_interested", unread: false, campaignId: null });
      expect(await backfillThreads(u.id)).toBe(0);
    } finally {
      await prisma.leadEmail.deleteMany({ where: { leadId: lead.id } });
      await prisma.lead.delete({ where: { id: lead.id } });
    }
  });
});
