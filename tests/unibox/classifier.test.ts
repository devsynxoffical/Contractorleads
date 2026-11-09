import { describe, expect, it } from "vitest";
import {
  classifyReply,
  extractFollowUpDate,
  extractReturnDate,
  stripQuoted,
} from "@/lib/unibox/classifier";

const RECEIVED = new Date("2026-11-06T12:00:00Z");
const c = (body: string, subject = "Re: Quick question", headers?: Record<string, string>, fromEmail = "lead@acme.com") =>
  classifyReply({ subject, body, headers, fromEmail, mailboxEmail: "frank@frankmillernetwork.com", receivedAt: RECEIVED });
const ymd = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

describe("spec examples (Unibox trigger keywords, real reply examples)", () => {
  const cases: Array<[string, string]> = [
    ["Thanks for reaching out! This actually looks really relevant to what we're working on. Can you send me more details on pricing and how it works?", "interested"],
    ["Hi, we're not looking for this right now but maybe reach out to me again in Q1 next year — things might be different then.", "bad_timing"],
    ["Please remove me from your list. We already use a solution for this and are happy with it.", "not_interested"],
    ["Hi, I'm out of the office until November 20th. For urgent matters, please contact John at john@company.com.", "out_of_office"],
    ["Thank you for contacting us. Your message has been received and a ticket (#4829) has been created. Our team will respond within 24 hours.", "automatic_reply"],
    ["I think you've got the wrong person — marketing isn't my area. You'd want to speak to our CMO, Sarah at sarah@company.com.", "wrong_person"],
    ["Sounds interesting but we're in the middle of a restructure right now. Not the best time. Try again in 3 months.", "bad_timing"],
    ["Honestly not interested. We tried something similar last year and it didn't work for us. Good luck though.", "not_interested"],
    ["I've actually forwarded this to my colleague Tom who leads our partnerships team — he'd be a better fit for this conversation.", "referral"],
    ["Let's hop on a 20 minute call this week. What does your Thursday look like?", "interested"],
    ["We appreciate you reaching out but this isn't relevant to our business at this stage.", "not_interested"],
    ["Perfect timing actually — we were just discussing this in our last meeting. Can you share a case study?", "interested"],
    ["I'm on annual leave until 25th November. I'll be back in the office and will respond then.", "out_of_office"],
    ["Budget's frozen until April. If you can follow up then, we might be in a better position to explore.", "bad_timing"],
  ];
  it.each(cases)("%s", (body, label) => {
    expect(c(body).label).toBe(label);
  });
});

describe("extraction", () => {
  it("OOO return date + 1 day", () => {
    expect(ymd(c("Hi, I'm out of the office until November 20th.").followUpAt)).toBe("2026-11-21");
    expect(ymd(c("I'm on annual leave until 25th November.").followUpAt)).toBe("2026-11-26");
    expect(ymd(extractReturnDate("I am away, back on 1/5", RECEIVED))).toBe("2027-01-05");
  });
  it("bad timing follow-up dates", () => {
    expect(ymd(extractFollowUpDate("reach out again in Q1 next year", RECEIVED))).toBe("2027-01-01");
    expect(ymd(extractFollowUpDate("try again in 3 months", RECEIVED))).toBe("2027-02-04");
    expect(ymd(extractFollowUpDate("budget's frozen until April", RECEIVED))).toBe("2027-04-01");
    expect(ymd(extractFollowUpDate("maybe next quarter", RECEIVED))).toBe("2027-01-01");
    expect(extractFollowUpDate("let me think about it", RECEIVED)).toBeNull();
  });
  it("referred contacts", () => {
    expect(c("I think you've got the wrong person. You'd want to speak to our CMO, Sarah at sarah@company.com.").referred).toEqual({
      email: "sarah@company.com",
      name: "Sarah",
    });
    expect(c("I've forwarded this to my colleague Tom who runs partnerships.").referred).toEqual({ name: "Tom" });
  });
});

describe("headers run first (rule 3)", () => {
  it("Auto-Submitted header wins over positive words", () => {
    const r = c("Thanks, sounds great! We will get back to you.", "Re: Quick question", { "auto-submitted": "auto-generated" });
    expect(r.label).toBe("automatic_reply");
  });
  it("an RFC 3834 out-of-office still gets Out of Office with its date", () => {
    const r = c("I am currently out of the office until Nov 20.", "Automatic reply: Quick question", { "auto-submitted": "auto-replied" });
    expect(r.label).toBe("out_of_office");
    expect(ymd(r.followUpAt)).toBe("2026-11-21");
  });
  it("'Automatic reply:' without OOO wording is an automatic reply", () => {
    expect(c("We received your email and will respond shortly.", "Automatic reply: Quick question").label).toBe("automatic_reply");
  });
  it("Precedence: bulk", () => {
    expect(c("Hello", "Newsletter", { precedence: "bulk" }).label).toBe("automatic_reply");
  });
  it("bounces are flagged", () => {
    const r = classifyReply({
      subject: "Delivery Status Notification (Failure)",
      body: "Address not found. 550 5.1.1 The email account that you tried to reach does not exist.",
      fromEmail: "mailer-daemon@googlemail.com",
    });
    expect(r).toMatchObject({ label: "automatic_reply", bounce: true });
  });
});

describe("edge cases", () => {
  it("our quoted pitch never triggers a label", () => {
    const body = "ok\n\nOn Tue, Nov 4, 2026 at 9:00 AM Frank <frank@x.com> wrote:\n> Would you be interested in a quick call? Let's connect.";
    expect(c(body).label).toBe("unlabelled");
    expect(stripQuoted(body)).toBe("ok");
  });
  it("Outlook quoted block is stripped", () => {
    const body = "Not for us, thanks.\n\nFrom: Frank <frank@x.com>\nSent: Tuesday\nSubject: Quick question\n\nAre you interested?";
    expect(c(body).label).toBe("not_interested");
  });
  it("'not interested right now' is bad timing, but removal requests stay a hard no", () => {
    expect(c("Not interested right now, maybe next year.").label).toBe("bad_timing");
    expect(c("Not interested right now. Please remove me.").label).toBe("not_interested");
  });
  it("'not interested' is never read as interested", () => {
    expect(c("I'm not interested.").label).toBe("not_interested");
  });
  it("meeting and closed labels are never auto-applied", () => {
    const r = c("Confirmed, see you Thursday at 3pm. Meeting booked. Deal closed.");
    expect(["meeting_booked", "meeting_completed", "closed"]).not.toContain(r.label);
  });
  it("curly apostrophes are normalised", () => {
    expect(c("Let’s chat next week").label).toBe("interested");
  });
  it("unmatched replies stay unlabelled", () => {
    expect(c("Who is this?").label).toBe("unlabelled");
  });
});
