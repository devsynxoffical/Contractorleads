import type { UniboxLabelId } from "./labels";

/**
 * Unibox rules engine: classify an inbound reply into one label.
 *
 * Priority (spec section 4, with Bad Timing and Referral):
 *   1. Automatic reply: headers (RFC 3834 Auto-Submitted, X-Autoreply, Precedence),
 *      bounces and ticket/system receipts. Header checks run before any keyword match.
 *   2. Out of office (subject or body). An RFC 3834 out-of-office auto-reply carries
 *      Auto-Submitted too, so it is labelled Out of Office (with its return date)
 *      rather than being lost as a generic automatic reply.
 *   3. Not interested   4. Bad timing   5. Wrong person   6. Referral   7. Interested
 *   8. Unlabelled (no rule matched; needs a human)
 *
 * Keyword rules only look at the reply itself: quoted earlier messages (our own pitch)
 * are stripped first, otherwise words from our email would trigger labels.
 * Meeting Booked, Meeting Completed and Closed are never auto-applied.
 */

export type ClassifyInput = {
  subject: string;
  body: string;
  /** Lower-case header name -> value */
  headers?: Record<string, string | undefined>;
  fromEmail?: string;
  /** Our mailbox; excluded from referral contact extraction */
  mailboxEmail?: string;
  /** When the reply was received; anchors relative dates */
  receivedAt?: Date;
};

export type ClassifyResult = {
  label: UniboxLabelId;
  /** Short explanation shown in the audit log */
  reason: string;
  /** Delivery failure: the prospect should be marked bounced */
  bounce?: boolean;
  /** Out of office return date or bad-timing follow-up date */
  followUpAt?: Date | null;
  referred?: { email?: string; name?: string } | null;
};

// ---------------------------------------------------------------------------
// Text preparation
// ---------------------------------------------------------------------------

/** Remove quoted history and signatures, keeping only what the person wrote. */
export function stripQuoted(body: string): string {
  const text = body.replace(/\r\n/g, "\n");
  const cutPatterns = [
    /^\s*On .{3,200}?wrote:\s*$/im, // Gmail / Apple Mail (single line)
    /^\s*On .{3,120}\n.{0,120}wrote:\s*$/im, // wrapped onto two lines
    /^\s*-{2,}\s*Original Message\s*-{2,}/im,
    /^\s*_{10,}\s*$/m, // Outlook separator
    /^\s*From:\s.+\n\s*(Sent|Date):\s/im, // Outlook header block
    /^\s*-{2,}\s*Forwarded message\s*-{2,}/im,
    /^\s*Le .{3,200}a écrit\s*:\s*$/im,
    /^\s*Am .{3,200}schrieb .{0,100}:\s*$/im,
  ];
  let cut = text.length;
  for (const re of cutPatterns) {
    const m = re.exec(text);
    if (m && m.index < cut) cut = m.index;
  }
  return text
    .slice(0, cut)
    .split("\n")
    .filter((l) => !/^\s*>/.test(l)) // quoted lines
    .join("\n")
    .split(/^\s*--\s*$/m)[0] // signature delimiter
    .trim();
}

function norm(s: string): string {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

const any = (text: string, patterns: RegExp[]) => patterns.find((p) => p.test(text)) ?? null;

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const BOUNCE_SUBJECT = [
  /\bdelivery status notification\b/,
  /\bundeliver(able|ed)\b/,
  /\bmail delivery (failed|failure|subsystem)\b/,
  /\breturned mail\b/,
  /\bdelivery (has )?failed\b/,
  /\bfailure notice\b/,
  /\bmessage not delivered\b/,
];
const BOUNCE_BODY = [
  /\b5\.1\.1\b/,
  /\b550[ -]5\.\d\.\d\b/,
  /\buser unknown\b/,
  /\baddress not found\b/,
  /\bmailbox (does not exist|unavailable|not found)\b/,
  /\bpermanent(ly)? fail/,
  /\bfailed permanently\b/,
  /\bcould not be delivered\b/,
];

const AUTO_SUBJECT = [
  /\bread receipt\b/,
  /\b(read|delivery) notification\b/,
  /\bauto[- ]?response\b/,
  /\[ticket ?#/,
  /\bticket #?\d+/,
  /\byour (request|message|enquiry|inquiry) (has been|was) received\b/,
  /\bsupport ticket\b/,
];
const AUTO_BODY = [
  /\bthis is an automated (message|response|reply|email)\b/,
  /\bdo not reply to this (email|message)\b/,
  /\bthis (mailbox|inbox|email address) is not monitored\b/,
  /\bautomated response\b/,
  /\bticket\b.{0,20}\b(has been|was) (created|opened|raised|logged)\b/,
  /\breference number for your (enquiry|inquiry|request)\b/,
  /\bwe have received your (message|email|request|enquiry|inquiry)\b.{0,80}\b(within|shortly|as soon as)\b/,
  /\bour team will (get back to you|respond) within\b/,
];

const OOO_SUBJECT = [
  /\bout of (the )?office\b/,
  /\booo\b/,
  /\baway from (the )?office\b/,
  /\bon vacation\b/,
  /\bannual leave\b/,
  /\bon leave\b/,
  /\bcurrently away\b/,
  /\bon holiday\b/,
  /\[ooo\]/,
];
const OOO_BODY = [
  /\bi('m| am)( currently)? (out of (the )?office|away|on (annual |parental |maternity |paternity |sick )?leave|on holiday|on vacation|travell?ing)\b/,
  /\bi (will|'ll) be (out of (the )?office|away|on leave|on holiday|on vacation)\b/,
  /\bout of (the )?office (until|till|from|through|and)\b/,
  /\bi('m| am) (currently )?out\b.{0,40}\b(until|till|returning|back on)\b/,
  /\breturning (on|to the office)\b/,
  /\bback in the office\b/,
  /\bi will return\b/,
  /\bi('ll| will) be back (on|in the office|from)\b/,
  /\blimited access to (my )?e-?mail\b/,
  /\bon (annual|parental|maternity|paternity|sick) leave\b/,
  /\b(holiday|christmas|eid) break\b/,
];

const NOT_INTERESTED = [
  /\bnot interested\b/,
  /\bno,? thank(s| you)\b/,
  /\bi'll pass\b/,
  /\b(we'll|we will) pass\b/,
  /\bhard pass\b/,
  /\bnot for us\b/,
  /\bthanks,? but no\b/,
  /\b(please )?remove (me|my email|us)\b/,
  /\bunsubscribe\b/,
  /\btake (me|us) off\b/,
  /\bstop (emailing|contacting|sending)\b/,
  /\bplease stop\b/,
  /\b(don't|do not) (contact|email) (me|us)\b/,
  /\bopt (me|us) out\b/,
  /\balready (have|use|using) (a|an|our|someone)\b/,
  /\bworking with someone else\b/,
  /\bhappy with (our|my) current\b/,
  /\bwe have (this|that|it) covered\b/,
  /\bnot looking to change\b/,
  /\b(isn't|is not|not) relevant\b/,
  /\bnot applicable\b/,
  /\bdoesn't apply to us\b/,
  /\bnot (a|the right) fit\b/,
  /\bnot what we need\b/,
  /\bno budget\b/,
  /\bcan't afford\b/,
  /\btoo expensive\b/,
  /\bstop spamming\b/,
  /\bthis is spam\b/,
  /\bhow did you get my (email|address)\b/,
  /\bi will report\b/,
];
/** Removal requests always win, even when a time is mentioned. */
const HARD_NO = [
  /\b(please )?remove (me|my email|us)\b/,
  /\bunsubscribe\b/,
  /\btake (me|us) off\b/,
  /\bstop (emailing|contacting|sending)\b/,
  /\b(don't|do not) (contact|email) (me|us)\b/,
  /\bopt (me|us) out\b/,
  /\bspam(ming)?\b/,
  /\bhow did you get my\b/,
];

const BAD_TIMING = [
  /\bnot (right )?now\b/,
  /\bbad timing\b/,
  /\bwrong time\b/,
  /\bnot (a good|the best|the right) time\b/,
  /\breach out (again |back )?(later|in|after|next|once|when)\b/,
  /\btry (me |us )?again\b/,
  /\btry (me|us) (in|after|next|later)\b/,
  /\bcheck back\b/,
  /\bcircle back\b/,
  /\bfollow up (in|after|next|then|later|once)\b/,
  /\bping me (again|in|later|next|after)\b/,
  /\brevisit (in|this|next|later)\b/,
  /\bnext (quarter|year|month|fiscal|budget)\b/,
  /\bin q[1-4]\b/,
  /\bin \d+ (weeks|months)\b/,
  /\bin (a few|a couple of) (weeks|months)\b/,
  /\bafter the (holidays|new year)\b/,
  /\btoo busy\b/,
  /\bswamped\b/,
  /\boverwhelmed\b/,
  /\bin the middle of\b/,
  /\bhectic\b/,
  /\bbudget('s| is| has been)? frozen\b/,
  /\bbudget freeze\b/,
  /\bnew fiscal year\b/,
  /\bnot in (this|our) (year's )?budget\b/,
  /\brestructur(e|ing)\b/,
  /\bleadership change\b/,
  /\blet me think about it\b/,
  /\bi'll get back to you\b/,
  /\bdiscuss (this )?internally\b/,
  /\bgive me a few weeks\b/,
];
/** Phrases that turn a "no" into "not now". */
const LATER = [
  /\b(right|just) now\b/,
  /\bat the moment\b/,
  /\bnext (quarter|year|month|fiscal)\b/,
  /\bin q[1-4]\b/,
  /\bin \d+ (weeks|months)\b/,
  /\b(reach out|try|check back|follow up|circle back)\b.{0,30}\b(later|again|in|after|next)\b/,
  /\bmaybe later\b/,
];

const WRONG_PERSON = [
  /\bwrong (person|contact)\b/,
  /\bnot the right (person|contact)\b/,
  /\byou(('ve)? got| have) the wrong\b/,
  /\bnot (in )?my (area|department|responsibility|role|remit)\b/,
  /\bisn't my (area|department|responsibility)\b/,
  /\bdoesn't fall under me\b/,
  /\bi (don't|do not) handle\b/,
  /\bi only handle\b/,
  /\bi('m| am) not involved in\b/,
  /\byou('d| would) (want|need) to (speak|talk) (to|with)\b/,
  /\bbetter to speak with\b/,
  /\b(talk|speak) to our (marketing|procurement|sales|operations|ops|it|finance)\b/,
  /\bcontact our (marketing|procurement|sales|operations|ops|it|finance)\b/,
  /\bwrong company\b/,
  /\bare you sure you mean us\b/,
  /\bwe don't do that here\b/,
];

const REFERRAL = [
  /\bforward(ed|ing) (this|it|your (email|note|message)) (on |over |along )?to\b/,
  /\blooping in\b/,
  /\bcc'?(ing|ed)\b/,
  /\bcopied in\b/,
  /\bpass(ed|ing) (this|it|your (email|note|message)) (on |along )?to\b/,
  /\bshared (this|it|your (email|note|message)) with\b/,
  /\byou should (speak|talk) (to|with) my\b/,
  /\bi know someone\b/,
  /\bmy (manager|boss|colleague|partner|director|ceo) might\b/,
  /\b(he|she|they)('d| would) be (a )?better (fit|person)\b/,
  /\bincluded our\b/,
  /\btry reaching out to\b/,
];

const INTERESTED = [
  /\b(i'm|i am|we're|we are|very|definitely|quite|really) interested\b/,
  /^interested\b/,
  /\binterested in (learning|hearing|knowing|a call|chatting|talking|this)\b/,
  /\bcount me in\b/,
  /\bsounds (good|great|interesting|promising)\b/,
  /\bwould love\b/,
  /\blove to (hear|learn|chat|talk|see)\b/,
  /\btell me more\b/,
  /\bmore (info|information|details)\b/,
  /\bsend (me |over |us )?(the |some |more )?(details|deck|info|information|pricing|case stud)/,
  /\bshare (more|a case study|case studies|the deck|pricing|your pricing)\b/,
  /\bhow much (does|do|is|would)\b/,
  /\bhow (does|would) (it|this|that) work\b/,
  /\bhow long does it take\b/,
  /\bwhat('s| is| are) (the |your )?(pricing|price|prices|cost|process|rates?)\b/,
  /\bdo you work with\b/,
  /\bwhat results\b/,
  /\blet'?s (connect|chat|talk|meet|hop on|jump on|set up|schedule|book)\b/,
  /\bschedule a (call|meeting|time|chat)\b/,
  /\bbook a (call|meeting|time)\b/,
  /\b(can|could|shall) we (talk|chat|connect|meet|hop on)\b/,
  /\bhappy to (chat|connect|talk|have a)\b/,
  /\bopen to (it|a call|a chat|exploring|learning|chatting|talking|this)\b/,
  /\b(quick|short|\d+[- ]?min(ute)?) (call|chat)\b/,
  /\bwhat does your .{1,20} look like\b/,
  /\b(perfect|good|great) timing\b/,
  /\bwe were just (discussing|talking about)\b/,
  /\bworth a (conversation|chat|call)\b/,
  /\byes,? please\b/,
  /\bthis (looks|sounds) (really )?relevant\b/,
];

// ---------------------------------------------------------------------------
// Date and contact extraction
// ---------------------------------------------------------------------------

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

function monthIndex(m: string): number {
  return MONTHS.indexOf(m.slice(0, 3).toLowerCase());
}

/** Next occurrence of month/day on or after `from` (handles year rollover). */
function nextDate(month: number, day: number, from: Date): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), month, day, 12));
  if (d.getTime() < from.getTime() - 24 * 3600 * 1000) d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d;
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 3600 * 1000);

/** Return date from an out-of-office reply ("until November 20th", "back on 25th Nov", "until 11/20"). */
export function extractReturnDate(text: string, from: Date): Date | null {
  const t = norm(text);
  const lead = "(?:until|till|returning(?: on)?|return(?:ing)? on|back(?: in the office)?(?: on)?|through|thru|available (?:on|from|after)|after)";
  const m1 = new RegExp(`${lead}\\s+(?:\\w+day,?\\s+)?${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?`).exec(t);
  if (m1) return nextDate(monthIndex(m1[1]), Number(m1[2]), from);
  const m2 = new RegExp(`${lead}\\s+(?:\\w+day,?\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+${MONTH_RE}`).exec(t);
  if (m2) return nextDate(monthIndex(m2[2]), Number(m2[1]), from);
  const m3 = new RegExp(`${lead}\\s+(\\d{1,2})[/.-](\\d{1,2})(?:[/.-](\\d{2,4}))?`).exec(t);
  if (m3) {
    const month = Number(m3[1]) - 1;
    const day = Number(m3[2]);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) return nextDate(month, day, from);
  }
  return null;
}

/** Follow-up date from a bad-timing reply ("in Q1", "in 3 months", "until April", "next year"). */
export function extractFollowUpDate(text: string, from: Date): Date | null {
  const t = norm(text);
  const q = /\bin q([1-4])\b/.exec(t);
  if (q) {
    const quarterStartMonth = (Number(q[1]) - 1) * 3;
    return nextDate(quarterStartMonth, 1, addDays(from, 1));
  }
  const n = /\bin (\d+) (week|month)s?\b/.exec(t);
  if (n) return addDays(from, Number(n[1]) * (n[2] === "week" ? 7 : 30));
  if (/\bin (a few|a couple of) weeks\b|\bgive me a few weeks\b/.test(t)) return addDays(from, 21);
  if (/\bin (a few|a couple of) months\b/.test(t)) return addDays(from, 90);
  const month = new RegExp(`\\b(?:until|till|in|after|around|by|from)\\s+(?:early\\s+|mid[- ]?|late\\s+)?${MONTH_RE}\\b`).exec(t);
  if (month) return nextDate(monthIndex(month[1]), 1, addDays(from, 1));
  if (/\bnext quarter\b/.test(t)) {
    const m = from.getUTCMonth();
    const next = (Math.floor(m / 3) + 1) * 3;
    return new Date(Date.UTC(from.getUTCFullYear() + (next >= 12 ? 1 : 0), next % 12, 1, 12));
  }
  if (/\bnext (year|fiscal)\b|\bnew fiscal year\b|\bafter the new year\b/.test(t)) {
    return new Date(Date.UTC(from.getUTCFullYear() + 1, 0, 5, 12));
  }
  if (/\bafter the holidays\b/.test(t)) return nextDate(0, 5, from);
  if (/\bnext month\b/.test(t)) return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 12));
  return null;
}

/** Contact named in a wrong-person / referral reply: an email address and, if present, a first name. */
export function extractReferredContact(
  original: string,
  exclude: string[],
): { email?: string; name?: string } | null {
  const skip = new Set(exclude.filter(Boolean).map((e) => e.toLowerCase()));
  const emails = [...original.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)]
    .map((m) => m[0].toLowerCase())
    .filter((e) => !skip.has(e));
  const email = emails[0];
  let name: string | undefined;
  const nameBeforeEmail = email
    ? new RegExp(`\\b([A-Z][a-z]{1,20})(?:\\s+[A-Z][a-z]{1,20})?\\s*(?:at|-|:|\\(|<)\\s*<?${email.replace(/[.+]/g, "\\$&")}`, "i").exec(original)
    : null;
  const nameAfterRole = /\b(?:colleague|manager|director|boss|partner|cmo|ceo|cfo|coo|cto|owner|head of [a-z]+),?\s+([A-Z][a-z]{1,20})\b/.exec(original);
  const nameAfterVerb = /\b(?:speak|talk|reach out|contact|forwarded (?:this|it) to|looping in)\s+(?:to|with)?\s*([A-Z][a-z]{1,20})\b/.exec(original);
  const candidate = nameBeforeEmail?.[1] || nameAfterRole?.[1] || nameAfterVerb?.[1];
  const notNames = new Set(["Our", "The", "Him", "Her", "Them", "Me", "Us", "You", "Our", "Sales", "Marketing", "Team", "Please"]);
  if (candidate && !notNames.has(candidate)) name = candidate;
  if (!email && !name) return null;
  return { ...(email ? { email } : {}), ...(name ? { name } : {}) };
}

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

function headerValue(h: Record<string, string | undefined> | undefined, key: string): string {
  return (h?.[key] ?? "").toString().toLowerCase().trim();
}

export function autoReplyHeaderSignal(headers?: Record<string, string | undefined>): string | null {
  const autoSubmitted = headerValue(headers, "auto-submitted");
  if (autoSubmitted && autoSubmitted !== "no") return `Auto-Submitted: ${autoSubmitted}`;
  if (headerValue(headers, "x-autoreply") === "yes") return "X-Autoreply: yes";
  if (headerValue(headers, "x-auto-reply") === "yes") return "X-Auto-Reply: yes";
  if (headerValue(headers, "x-autorespond")) return "X-Autorespond";
  const precedence = headerValue(headers, "precedence");
  if (["bulk", "auto_reply", "junk", "list"].includes(precedence)) return `Precedence: ${precedence}`;
  return null;
}

function isBounce(input: ClassifyInput, subject: string, body: string): boolean {
  const from = (input.fromEmail ?? "").toLowerCase();
  if (/^(mailer-daemon|postmaster)@/.test(from)) return true;
  if (headerValue(input.headers, "content-type").includes("multipart/report")) return true;
  if (any(subject, BOUNCE_SUBJECT) && any(body, BOUNCE_BODY)) return true;
  return false;
}

export function classifyReply(input: ClassifyInput): ClassifyResult {
  const receivedAt = input.receivedAt ?? new Date();
  const subject = norm(input.subject || "");
  const fullBody = norm(input.body || "");
  const ownText = stripQuoted(input.body || "");
  const own = norm(ownText);

  // 1a. Bounces / delivery failures
  if (isBounce(input, subject, fullBody)) {
    return { label: "automatic_reply", reason: "Delivery failure (bounce)", bounce: true };
  }

  const headerSignal = autoReplyHeaderSignal(input.headers);

  // 2. Out of office (checked before the generic auto-reply label, see header note above)
  // "Automatic reply:" alone does not mean out of office (ticket systems use it too):
  // it needs out-of-office wording in the subject or body.
  const oooSubject = any(subject, OOO_SUBJECT);
  const oooBody = any(own, OOO_BODY);
  const autoReplySubject = /^\s*(automatic reply|auto[- ]?reply|autoreply|\[auto\])\s*:?/.test(subject);
  if (oooSubject || oooBody) {
    const returnDate = extractReturnDate(ownText || input.body, receivedAt);
    return {
      label: "out_of_office",
      reason: oooBody ? "Out-of-office wording in the reply" : "Out-of-office subject",
      followUpAt: returnDate ? addDays(returnDate, 1) : null,
    };
  }

  // 1b. Automatic reply (headers first, then system subjects and wording)
  if (headerSignal) return { label: "automatic_reply", reason: headerSignal };
  const autoSubj = any(subject, AUTO_SUBJECT);
  if (autoSubj) return { label: "automatic_reply", reason: "System subject line" };
  const autoBody = any(own, AUTO_BODY);
  if (autoBody) return { label: "automatic_reply", reason: "Automated message wording" };
  if (autoReplySubject) return { label: "automatic_reply", reason: "Automatic reply subject" };

  if (!own) return { label: "unlabelled", reason: "No reply text after removing quoted history" };

  // 3. Not interested (unless it is really "not now")
  const no = any(own, NOT_INTERESTED);
  if (no) {
    const hardNo = any(own, HARD_NO);
    if (!hardNo && any(own, LATER)) {
      return {
        label: "bad_timing",
        reason: "Declined for now, with a later time mentioned",
        followUpAt: extractFollowUpDate(own, receivedAt),
      };
    }
    return { label: "not_interested", reason: hardNo ? "Asked to be removed" : "Declined" };
  }

  // 4. Bad timing
  if (any(own, BAD_TIMING)) {
    return { label: "bad_timing", reason: "Not the right time", followUpAt: extractFollowUpDate(own, receivedAt) };
  }

  const exclude = [input.fromEmail ?? "", input.mailboxEmail ?? ""];
  // 5. Wrong person
  if (any(own, WRONG_PERSON)) {
    return { label: "wrong_person", reason: "Not the right contact", referred: extractReferredContact(ownText, exclude) };
  }
  // 6. Referral
  if (any(own, REFERRAL)) {
    return { label: "referral", reason: "Referred to someone else", referred: extractReferredContact(ownText, exclude) };
  }
  // 7. Interested
  if (any(own, INTERESTED)) return { label: "interested", reason: "Positive intent" };

  return { label: "unlabelled", reason: "No rule matched" };
}
