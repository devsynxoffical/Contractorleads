export type OutreachHook = {
  id: number;
  label: string;
  badge: string;
  shortDesc: string;
  subject: string;
  body: string;
};

export const OUTREACH_HOOKS: OutreachHook[] = [
  {
    id: 1,
    label: "Hook 1: Local Overflow & Territory",
    badge: "Hook 1",
    shortDesc: "High-intent homeowner quote requests & project overflow for their city.",
    subject: "Quick question for {{businessName}} in {{city}}",
    body: `Hi {{firstName}},

I came across {{businessName}} while researching top {{industry}} contractors in {{city}}.

We're currently generating high-intent homeowner quote requests in {{city}} and looking for 1 reliable local partner to take on our extra project volume this month.

Are you currently taking on new projects in {{city}}, or is your schedule completely booked up?

Best regards,
{{myName}}
{{myCompany}}`,
  },
  {
    id: 2,
    label: "Hook 2: Urgent Client Inquiries",
    badge: "Hook 2",
    shortDesc: "Homeowners requesting estimates right now who need a contractor.",
    subject: "Homeowner quote requests in {{city}} — {{businessName}}",
    body: `Hi {{firstName}},

Quick inquiry — we have active homeowners in {{city}} requesting estimates for {{industry}} work and need to hand them over to an experienced local contractor.

Do you have room on your schedule for 3–5 additional high-ticket jobs over the next few weeks?

If yes, let me know if you have 5 minutes for a quick chat this week.

Best regards,
{{myName}}
{{myCompany}}`,
  },
  {
    id: 3,
    label: "Hook 3: Subcontractor & Partnership",
    badge: "Hook 3",
    shortDesc: "Direct commercial & residential subcontractor collaboration.",
    subject: "Partnership opportunity with {{businessName}}",
    body: `Hi {{firstName}},

I've been following the work {{businessName}} is doing across {{city}} and wanted to connect directly.

We have commercial and residential {{industry}} contracts lining up in your area and are looking for qualified local partners to collaborate with.

Would you be open to a quick 5-minute introduction this week to explore if we could work together?

Best regards,
{{myName}}
{{myCompany}}`,
  },
  {
    id: 4,
    label: "Hook 4: Quick Opportunity Audit",
    badge: "Hook 4",
    shortDesc: "Free value insight showing missed revenue and jobs in their market.",
    subject: "Quick idea for {{businessName}} in {{city}}",
    body: `Hi {{firstName}},

I took a look at {{businessName}}'s presence in {{city}} and noticed an easy opportunity to capture an extra 8–12 high-margin {{industry}} projects every month.

Would you be open to a brief 3-minute chat or me sending over a short breakdown?

Best regards,
{{myName}}
{{myCompany}}`,
  },
  {
    id: 5,
    label: "Hook 5: Casual 5-Min Intro",
    badge: "Hook 5",
    shortDesc: "Short, low-friction outreach for busy business owners.",
    subject: "Quick 5-min intro — {{businessName}}",
    body: `Hi {{firstName}},

I know you're busy running {{businessName}}, so I'll keep this short.

We work with established {{industry}} contractors in {{city}} to help keep their crews consistently booked with qualified projects.

Do you have 5 minutes this Thursday or Friday for a quick phone chat?

Best regards,
{{myName}}
{{myCompany}}`,
  },
];

/** Replace template variables with lead values for single-lead compose preview */
export function compileHookForLead(
  hook: OutreachHook,
  lead?: {
    businessName?: string | null;
    ownerName?: string | null;
    city?: string | null;
    industry?: string | null;
  } | null,
  sender?: {
    ownerName?: string | null;
    name?: string | null;
    companyName?: string | null;
  } | null,
) {
  const businessName = lead?.businessName || "{{businessName}}";
  const firstName =
    (lead?.ownerName || "").trim().split(/\s+/)[0] ||
    lead?.businessName ||
    "there";
  const city = lead?.city || "{{city}}";
  const industry = lead?.industry || "{{industry}}";
  const myName = sender?.ownerName || sender?.name || "{{myName}}";
  const myCompany = sender?.companyName || "{{myCompany}}";

  const replaceTags = (text: string) =>
    text
      .replace(/\{\{businessName\}\}/g, businessName)
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{ownerName\}\}/g, lead?.ownerName || businessName)
      .replace(/\{\{city\}\}/g, city)
      .replace(/\{\{industry\}\}/g, industry)
      .replace(/\{\{myName\}\}/g, myName)
      .replace(/\{\{myCompany\}\}/g, myCompany);

  return {
    subject: replaceTags(hook.subject),
    body: replaceTags(hook.body),
  };
}
