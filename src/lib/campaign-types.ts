export type CampaignAttachment = {
  id: string;
  name: string;
  size?: number; // size in bytes
  type?: string; // MIME type or extension like "pdf"
  url?: string;
  contentBase64?: string;
  placement?: "top" | "bottom" | "custom";
};

export type CampaignHook = {
  id: string; // "A" | "B" | "C" | "D"
  label: string; // "Hook A: Local Overflow & Territory"
  badge: string; // "Hook A"
  subject: string;
  body: string;
  active: boolean;
  attachments?: CampaignAttachment[];
  enableUnsubscribe?: boolean;
  unsubscribeText?: string;
};

export type CampaignFollowUpStep = {
  id: string; // "1", "2", ...
  stepNumber: number; // 1 to 7
  label: string; // "Follow-Up 1: Value"
  dayDelay: number; // days after previous step
  subject: string;
  body: string;
  active: boolean;
  sendingTime?: string; // "09:00"
  sendingDays?: string[]; // ["mon", "tue", "wed", "thu", "fri"]
  attachments?: CampaignAttachment[];
  enableUnsubscribe?: boolean;
  unsubscribeText?: string;
};

export const DEFAULT_DAY0_HOOKS: CampaignHook[] = [
  {
    id: "A",
    label: "Hook A: Local Overflow & Territory",
    badge: "Hook A",
    subject: "Quick question for {{businessName}} in {{city}}",
    body: `Hi {{firstName}},

I came across {{businessName}} while researching top {{industry}} contractors in {{city}}.

We're currently generating high-intent homeowner quote requests in {{city}} and looking for 1 reliable local partner to take on our extra project volume this month.

Are you currently taking on new projects in {{city}}, or is your schedule completely booked up?

Best regards,
{{fromName}}`,
    active: true,
  },
  {
    id: "B",
    label: "Hook B: Urgent Client Inquiries",
    badge: "Hook B",
    subject: "Homeowner quote requests in {{city}} — {{businessName}}",
    body: `Hi {{firstName}},

Quick inquiry — we have active homeowners in {{city}} requesting estimates for {{industry}} work and need to hand them over to an experienced local contractor.

Do you have room on your schedule for 3–5 additional high-ticket jobs over the next few weeks?

If yes, let me know if you have 5 minutes for a quick chat this week.

Best regards,
{{fromName}}`,
    active: true,
  },
  {
    id: "C",
    label: "Hook C: Subcontractor & Partnership",
    badge: "Hook C",
    subject: "Partnership opportunity with {{businessName}}",
    body: `Hi {{firstName}},

I've been following the work {{businessName}} is doing across {{city}} and wanted to connect directly.

We have commercial and residential {{industry}} contracts lining up in your area and are looking for qualified local partners to collaborate with.

Would you be open to a quick 5-minute introduction this week to explore if we could work together?

Best regards,
{{fromName}}`,
    active: true,
  },
  {
    id: "D",
    label: "Hook D: Quick Opportunity Audit",
    badge: "Hook D",
    subject: "Quick idea for {{businessName}} in {{city}}",
    body: `Hi {{firstName}},

I took a look at {{businessName}}'s presence in {{city}} and noticed an easy opportunity to capture an extra 8–12 high-margin {{industry}} projects every month.

Would you be open to a brief 3-minute chat or me sending over a short breakdown?

Best regards,
{{fromName}}`,
    active: true,
  },
];

export const DEFAULT_FOLLOWUP_SEQUENCE: CampaignFollowUpStep[] = [
  {
    id: "1",
    stepNumber: 1,
    label: "Follow-Up 1: Value",
    dayDelay: 2,
    subject: "Re: {{lastSubject}}",
    body: `Hi {{firstName}},

Following up on my previous note. We just had another homeowner in {{city}} reach out regarding {{industry}} work.

Wanted to double check if {{businessName}} is currently accepting new estimate requests, or if you're fully booked?

Best,
{{fromName}}`,
    active: true,
  },
  {
    id: "2",
    stepNumber: 2,
    label: "Follow-Up 2: Proof & Results",
    dayDelay: 3,
    subject: "Re: Quick question for {{businessName}}",
    body: `Hi {{firstName}},

Just wanted to share a quick example — we helped another local {{industry}} team in your region add 14 booked installation jobs last month by filtering out price-shoppers and routing only ready-to-buy homeowners.

Would you like to see how we could do the same for {{businessName}}?

Best,
{{fromName}}`,
    active: true,
  },
  {
    id: "3",
    stepNumber: 3,
    label: "Follow-Up 3: Education & Insights",
    dayDelay: 3,
    subject: "Idea for {{businessName}}'s schedule this month",
    body: `Hi {{firstName}},

Most {{industry}} business owners we speak with tell us that dealing with unqualified tire-kickers wastes hours of estimator time.

Our system pre-qualifies job scope, timeline, and budget before any homeowner info gets sent over.

Open to a brief 4-minute call to see if this fits your current goals?

Best,
{{fromName}}`,
    active: true,
  },
  {
    id: "4",
    stepNumber: 4,
    label: "Follow-Up 4: Access & Exclusive Territory",
    dayDelay: 4,
    subject: "Exclusive {{industry}} territory in {{city}}",
    body: `Hi {{firstName}},

We only work with 1 primary contractor per territory in {{city}} so we don't create internal competition.

Before we reach out to another provider in your zip codes, I wanted to give {{businessName}} first priority.

Are you available for a 5-minute conversation tomorrow or Friday?

Best,
{{fromName}}`,
    active: true,
  },
  {
    id: "5",
    stepNumber: 5,
    label: "Follow-Up 5: Value + Case Study",
    dayDelay: 4,
    subject: "{{businessName}} — quick follow-up",
    body: `Hi {{firstName}},

I know you're busy running job sites, so I'll keep this simple.

If we could consistently send you 5–8 pre-screened {{industry}} opportunities every month without any upfront retainer, would that be of interest?

Let me know with a quick reply.

Best,
{{fromName}}`,
    active: true,
  },
  {
    id: "6",
    stepNumber: 6,
    label: "Follow-Up 6: Direct Conversation",
    dayDelay: 5,
    subject: "Checking in one last time — {{businessName}}",
    body: `Hi {{firstName}},

I haven't heard back, so I assume you're either completely slammed with jobs right now or this isn't a priority.

Either way, no worries at all! Just let me know so I don't keep bugging your inbox.

Best,
{{fromName}}`,
    active: true,
  },
  {
    id: "7",
    stepNumber: 7,
    label: "Follow-Up 7: Offer & Final Note",
    dayDelay: 6,
    subject: "Closing the loop for {{businessName}}",
    body: `Hi {{firstName}},

I'm going to assume the timing isn't right for {{businessName}} and close out your file for now.

If you ever need extra {{industry}} project volume in {{city}} down the road, feel free to reply directly to this email anytime.

Wishing you and your team continued success!

Best regards,
{{fromName}}`,
    active: true,
  },
];

/** Parse hooks JSON or return defaults */
export function parseCampaignHooks(hooksJson?: string | null): CampaignHook[] {
  if (!hooksJson) return DEFAULT_DAY0_HOOKS;
  try {
    const parsed = JSON.parse(hooksJson);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* fallback */
  }
  return DEFAULT_DAY0_HOOKS;
}

/** Parse follow-up steps JSON or return defaults */
export function parseCampaignSteps(stepsJson?: string | null): CampaignFollowUpStep[] {
  if (!stepsJson) return DEFAULT_FOLLOWUP_SEQUENCE;
  try {
    const parsed = JSON.parse(stepsJson);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* fallback */
  }
  return DEFAULT_FOLLOWUP_SEQUENCE;
}

export type CampaignWeeklyRampUp = {
  enabled: boolean;
  startDailyLimit: number; // e.g. 5 emails/day
  increasePerWeek: number; // e.g. 5 emails/day every week
  maxDailyCeiling: number; // e.g. 35 emails/day
};

export type CampaignMailboxLimitsConfig = {
  customLimits?: Record<string, number>;
  rampUp?: CampaignWeeklyRampUp;
};

/** Render campaign email template with prospect variables */
export function renderCampaignTemplate(
  template: string,
  prospect: {
    businessName: string;
    ownerName?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  },
  senderName: string = "Our Team",
  extraVars: Record<string, string> = {}
): string {
  const firstName =
    (prospect.ownerName || "").trim().split(/\s+/)[0] ||
    prospect.businessName ||
    "there";

  const vars: Record<string, string> = {
    businessName: prospect.businessName || "your business",
    ownerName: prospect.ownerName || prospect.businessName || "there",
    firstName,
    city: prospect.city || "your area",
    state: prospect.state || "",
    country: prospect.country || "US",
    fromName: senderName,
    ...extraVars,
  };

  let rendered = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Converts rich text / markdown into email-safe, high-deliverability HTML.
 * Supports bold (**text**), italics (*text*), underline (<u>text</u>),
 * strikethrough (~~text~~), hyperlinks ([label](url)), quotes (> quote),
 * lists (- item or 1. item), attachments (top/bottom/custom), and unsubscribe.
 */
export function formatEmailBodyToHtml(
  rawBody: string,
  options?: {
    attachments?: CampaignAttachment[];
    enableUnsubscribe?: boolean;
    unsubscribeText?: string;
    unsubscribeUrl?: string;
  }
): string {
  let content = rawBody || "";

  // 1. Handle Custom Inline Attachments: {{attachment:filename}} or {{attachment:id}}
  const attachments = options?.attachments || [];
  const topAttachments: CampaignAttachment[] = [];
  const bottomAttachments: CampaignAttachment[] = [];

  for (const att of attachments) {
    const placement = att.placement || "bottom";
    const attTagRegex = new RegExp(
      `{{\\s*attachment:(${att.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${att.id})\\s*}}`,
      "gi"
    );

    const attBadgeHtml = `<div style="display:inline-flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #cbd5e1;padding:6px 12px;border-radius:8px;font-size:12px;color:#1e293b;margin:6px 0;">📎 <strong>${att.name}</strong>${att.size ? ` <span style="color:#64748b;font-size:11px;">(${formatBytes(att.size)})</span>` : ""}</div>`;

    if (placement === "custom" && attTagRegex.test(content)) {
      content = content.replace(attTagRegex, attBadgeHtml);
    } else if (placement === "top") {
      topAttachments.push(att);
    } else {
      bottomAttachments.push(att);
    }
  }

  // 2. Unsubscribe inline tag {{unsubscribe}}
  const unsubText =
    options?.unsubscribeText?.trim() ||
    "If you do not wish to receive further emails from us, click here to unsubscribe or reply STOP.";
  const unsubUrl = options?.unsubscribeUrl || "#unsubscribe";

  const hasUnsubTag = /{{\\s*unsubscribe\\s*}}/gi.test(content);
  if (hasUnsubTag) {
    const unsubLinkHtml = `<a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">${unsubText}</a>`;
    content = content.replace(/{{\\s*unsubscribe\\s*}}/gi, unsubLinkHtml);
  }

  // 3. Markdown Formatting
  // Escape angle brackets that are NOT part of allowed HTML tags
  content = content
    .replace(/&/g, "&amp;")
    .replace(/<(?!\/?(u|strong|em|s|a|div|span|br|p|blockquote|ul|ol|li)\b[^>]*>)/gi, "&lt;");

  // Bold: **text**
  content = content.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic: *text* (excluding bold)
  content = content.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, "$1<em>$2</em>$3");

  // Strikethrough: ~~text~~
  content = content.replace(/~~([^~]+)~~/g, "<s>$1</s>");

  // Hyperlinks: [label](url)
  content = content.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;font-weight:500;">$1</a>'
  );

  // Monospace inline code: `code`
  content = content.replace(
    /`([^`\n]+)`/g,
    '<code style="background:#f1f5f9;border:1px solid #e2e8f0;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:#0f172a;">$1</code>'
  );

  // Convert line breaks and paragraphs
  const paragraphs = content.split(/\n{2,}/);
  const formattedParagraphs = paragraphs.map((para) => {
    const lines = para.split("\n");
    // Check blockquote
    if (lines.every((l) => l.trim().startsWith("&gt;") || l.trim().startsWith(">"))) {
      const qText = lines
        .map((l) => l.replace(/^(&gt;|>)\s?/, ""))
        .join("<br/>");
      return `<blockquote style="border-left:3px solid #cbd5e1;padding-left:12px;margin:8px 0;color:#64748b;font-style:italic;">${qText}</blockquote>`;
    }
    // Check bullet list
    if (lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "))) {
      const items = lines
        .map((l) => `<li style="margin-bottom:4px;">${l.replace(/^[-*]\s+/, "")}</li>`)
        .join("");
      return `<ul style="margin:8px 0 12px 20px;padding:0;">${items}</ul>`;
    }
    // Check numbered list
    if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
      const items = lines
        .map((l) => `<li style="margin-bottom:4px;">${l.replace(/^\d+\.\s+/, "")}</li>`)
        .join("");
      return `<ol style="margin:8px 0 12px 20px;padding:0;">${items}</ol>`;
    }
    return `<p style="margin:0 0 12px 0;line-height:1.5;">${lines.join("<br/>")}</p>`;
  });

  let fullHtml = formattedParagraphs.join("");

  // Prepend Top Attachments
  if (topAttachments.length > 0) {
    const topHtml = `
      <div style="margin-bottom:16px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">📎 Attached Files (${topAttachments.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${topAttachments
            .map(
              (a) =>
                `<span style="display:inline-flex;align-items:center;gap:6px;background:#ffffff;border:1px solid #cbd5e1;padding:5px 10px;border-radius:6px;font-size:12px;color:#1e293b;font-weight:600;">📎 ${a.name} <span style="color:#64748b;font-size:11px;font-weight:400;">(${formatBytes(a.size)})</span></span>`
            )
            .join("")}
        </div>
      </div>
    `;
    fullHtml = topHtml + fullHtml;
  }

  // Append Bottom Attachments
  if (bottomAttachments.length > 0) {
    const bottomHtml = `
      <div style="margin-top:20px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">📎 Attachments (${bottomAttachments.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${bottomAttachments
            .map(
              (a) =>
                `<span style="display:inline-flex;align-items:center;gap:6px;background:#ffffff;border:1px solid #cbd5e1;padding:6px 12px;border-radius:6px;font-size:12px;color:#1e293b;font-weight:600;">📄 ${a.name} <span style="color:#64748b;font-size:11px;font-weight:400;">(${formatBytes(a.size)})</span></span>`
            )
            .join("")}
        </div>
      </div>
    `;
    fullHtml = fullHtml + bottomHtml;
  }

  // Append Unsubscribe Footer if enabled and not already placed via {{unsubscribe}}
  if (options?.enableUnsubscribe && !hasUnsubTag) {
    const footerTextWithLink = unsubText.includes("click here to unsubscribe")
      ? unsubText.replace(
          /click here to unsubscribe/i,
          `<a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">click here to unsubscribe</a>`
        )
      : `${unsubText} · <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>`;

    const footerHtml = `
      <div style="margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.4;">
        ${footerTextWithLink}
      </div>
    `;
    fullHtml = fullHtml + footerHtml;
  }

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#1e293b;line-height:1.6;">${fullHtml}</div>`;
}
