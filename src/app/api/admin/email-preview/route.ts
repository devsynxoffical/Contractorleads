import { NextResponse } from "next/server";
import { requirePermission, getSessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";
import {
  EMAIL_TEMPLATE_KEYS,
  type EmailTemplateFields,
  type EmailTemplateKey,
} from "@/lib/email-template-defaults";
import {
  getEmailTemplate,
  listEmailTemplates,
  resetEmailTemplate,
  saveEmailTemplate,
} from "@/lib/email-template-store";
import { renderManagedTemplate } from "@/lib/email-templates";

function isKey(v: unknown): v is EmailTemplateKey {
  return (
    typeof v === "string" &&
    (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(v)
  );
}

function sampleVars(key: EmailTemplateKey) {
  const base = appBaseUrl();
  const common = {
    name: "Alex",
    industry: "Roofing",
    location: "in Austin, TX",
    leadCount: 12,
    hotCount: 5,
    warmCount: 4,
  };
  if (key === "verify") {
    return {
      vars: common,
      ctaUrl: `${base}/verify-email?token=sample`,
    };
  }
  if (key === "reset") {
    return {
      vars: common,
      ctaUrl: `${base}/reset-password?token=sample`,
      links: {
        unsubscribeUrl: `${base}/email/unsubscribe?token=sample`,
        preferencesUrl: `${base}/email/preferences?token=sample`,
      },
    };
  }
  if (key === "scrape") {
    return {
      vars: common,
      ctaUrl: `${base}/leads/search`,
      scrapeStats: {
        leadCount: 12,
        hotCount: 5,
        warmCount: 4,
      },
      sampleNames: [
        "Summit Roofing Co",
        "Lone Star Roof Pros",
        "Hill Country Roofing",
        "Austin Peak Roofing",
        "Capitol City Roofers",
      ],
      links: {
        unsubscribeUrl: `${base}/email/unsubscribe?token=sample`,
        preferencesUrl: `${base}/email/preferences?token=sample`,
      },
    };
  }
  return {
    vars: common,
    links: {
      unsubscribeUrl: `${base}/email/unsubscribe?token=sample`,
      preferencesUrl: `${base}/email/preferences?token=sample`,
    },
  };
}

function renderPreview(template: EmailTemplateFields) {
  const sample = sampleVars(template.key);
  return renderManagedTemplate({
    template,
    ...sample,
  });
}

function pickTemplateFields(
  body: Record<string, unknown>,
): Partial<EmailTemplateFields> {
  const keys: (keyof EmailTemplateFields)[] = [
    "label",
    "enabled",
    "subject",
    "preheader",
    "heroTitle",
    "heroSubtitle",
    "headline",
    "body",
    "ctaLabel",
    "ctaPath",
    "feature1Title",
    "feature1Body",
    "feature2Title",
    "feature2Body",
    "feature3Title",
    "feature3Body",
    "secondaryTitle",
    "secondaryBody",
    "secondaryCtaLabel",
    "secondaryCtaPath",
  ];
  const out: Partial<EmailTemplateFields> = {};
  for (const k of keys) {
    if (body[k] === undefined) continue;
    if (k === "enabled") {
      out.enabled = Boolean(body[k]);
      continue;
    }
    out[k] = String(body[k] ?? "") as never;
  }
  return out;
}

function mergeDraft(
  base: EmailTemplateFields,
  patch: Partial<EmailTemplateFields>,
): EmailTemplateFields {
  return { ...base, ...patch, key: base.key };
}

/** List templates or preview one. GET ?type=verify|welcome|reset|scrape */
export async function GET(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type");

  if (!typeParam || typeParam === "all") {
    const templates = await listEmailTemplates();
    return NextResponse.json({ templates });
  }

  if (!isKey(typeParam)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const template = await getEmailTemplate(typeParam);
  const preview = renderPreview(template);
  return NextResponse.json({
    type: typeParam,
    template,
    subject: preview.subject,
    html: preview.html,
    text: preview.text,
  });
}

/**
 * Manage templates:
 * - action: save | reset | preview | send
 */
export async function POST(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const action = String(body.action || "send");
  const type = body.type;
  if (!isKey(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (action === "reset") {
    const template = await resetEmailTemplate(type);
    const preview = renderPreview(template);
    return NextResponse.json({
      ok: true,
      template,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
      message: "Template reset to defaults.",
    });
  }

  if (action === "save") {
    const patch = pickTemplateFields(body);
    const template = await saveEmailTemplate(type, patch);
    const preview = renderPreview(template);
    return NextResponse.json({
      ok: true,
      template,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
      message: "Template saved. Live emails will use this content.",
    });
  }

  const saved = await getEmailTemplate(type);
  const draft = mergeDraft(saved, pickTemplateFields(body));
  const preview = renderPreview(draft);

  if (action === "preview") {
    return NextResponse.json({
      ok: true,
      template: draft,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
    });
  }

  if (action === "send") {
    const session = await getSessionUser();
    const to = String(body.to || session?.email || "").trim();
    if (!to) {
      return NextResponse.json({ error: "Missing to email" }, { status: 400 });
    }
    const sent = await sendEmail({
      to,
      subject: `[TEST] ${preview.subject}`,
      html: preview.html,
      text: preview.text,
      tags: ["email-preview", type],
    });
    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.error || "Send failed" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      mocked: sent.mocked ?? false,
      to,
      type,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
      message: sent.mocked
        ? "No RESEND_API_KEY — email logged to server console (mocked)."
        : `Test email sent to ${to}`,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
