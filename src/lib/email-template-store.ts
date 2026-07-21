import { prisma } from "@/lib/prisma";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  EMAIL_TEMPLATE_KEYS,
  type EmailTemplateFields,
  type EmailTemplateKey,
} from "@/lib/email-template-defaults";

function rowToFields(row: {
  key: string;
  label: string;
  enabled: boolean;
  subject: string;
  preheader: string;
  heroTitle: string;
  heroSubtitle: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
  feature1Title: string | null;
  feature1Body: string | null;
  feature2Title: string | null;
  feature2Body: string | null;
  feature3Title: string | null;
  feature3Body: string | null;
  secondaryTitle: string | null;
  secondaryBody: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaPath: string | null;
}): EmailTemplateFields {
  const key = row.key as EmailTemplateKey;
  return {
    key,
    label: row.label,
    enabled: row.enabled,
    subject: row.subject,
    preheader: row.preheader,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    headline: row.headline,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaPath: row.ctaPath,
    feature1Title: row.feature1Title ?? "",
    feature1Body: row.feature1Body ?? "",
    feature2Title: row.feature2Title ?? "",
    feature2Body: row.feature2Body ?? "",
    feature3Title: row.feature3Title ?? "",
    feature3Body: row.feature3Body ?? "",
    secondaryTitle: row.secondaryTitle ?? "",
    secondaryBody: row.secondaryBody ?? "",
    secondaryCtaLabel: row.secondaryCtaLabel ?? "",
    secondaryCtaPath: row.secondaryCtaPath ?? "",
  };
}

export async function ensureEmailTemplatesSeeded() {
  for (const key of EMAIL_TEMPLATE_KEYS) {
    const def = EMAIL_TEMPLATE_DEFAULTS[key];
    await prisma.emailTemplate.upsert({
      where: { key },
      create: {
        key: def.key,
        label: def.label,
        enabled: def.enabled,
        subject: def.subject,
        preheader: def.preheader,
        heroTitle: def.heroTitle,
        heroSubtitle: def.heroSubtitle,
        headline: def.headline,
        body: def.body,
        ctaLabel: def.ctaLabel,
        ctaPath: def.ctaPath,
        feature1Title: def.feature1Title || null,
        feature1Body: def.feature1Body || null,
        feature2Title: def.feature2Title || null,
        feature2Body: def.feature2Body || null,
        feature3Title: def.feature3Title || null,
        feature3Body: def.feature3Body || null,
        secondaryTitle: def.secondaryTitle || null,
        secondaryBody: def.secondaryBody || null,
        secondaryCtaLabel: def.secondaryCtaLabel || null,
        secondaryCtaPath: def.secondaryCtaPath || null,
      },
      update: {},
    });
  }
}

export async function listEmailTemplates(): Promise<EmailTemplateFields[]> {
  await ensureEmailTemplatesSeeded();
  const rows = await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
  return rows.map(rowToFields);
}

export async function getEmailTemplate(
  key: EmailTemplateKey,
): Promise<EmailTemplateFields> {
  await ensureEmailTemplatesSeeded();
  const row = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!row) return EMAIL_TEMPLATE_DEFAULTS[key];
  return rowToFields(row);
}

export async function saveEmailTemplate(
  key: EmailTemplateKey,
  patch: Partial<EmailTemplateFields>,
): Promise<EmailTemplateFields> {
  await ensureEmailTemplatesSeeded();
  const data = {
    ...(patch.label !== undefined ? { label: patch.label } : {}),
    ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
    ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
    ...(patch.preheader !== undefined ? { preheader: patch.preheader } : {}),
    ...(patch.heroTitle !== undefined ? { heroTitle: patch.heroTitle } : {}),
    ...(patch.heroSubtitle !== undefined
      ? { heroSubtitle: patch.heroSubtitle }
      : {}),
    ...(patch.headline !== undefined ? { headline: patch.headline } : {}),
    ...(patch.body !== undefined ? { body: patch.body } : {}),
    ...(patch.ctaLabel !== undefined ? { ctaLabel: patch.ctaLabel } : {}),
    ...(patch.ctaPath !== undefined ? { ctaPath: patch.ctaPath } : {}),
    ...(patch.feature1Title !== undefined
      ? { feature1Title: patch.feature1Title || null }
      : {}),
    ...(patch.feature1Body !== undefined
      ? { feature1Body: patch.feature1Body || null }
      : {}),
    ...(patch.feature2Title !== undefined
      ? { feature2Title: patch.feature2Title || null }
      : {}),
    ...(patch.feature2Body !== undefined
      ? { feature2Body: patch.feature2Body || null }
      : {}),
    ...(patch.feature3Title !== undefined
      ? { feature3Title: patch.feature3Title || null }
      : {}),
    ...(patch.feature3Body !== undefined
      ? { feature3Body: patch.feature3Body || null }
      : {}),
    ...(patch.secondaryTitle !== undefined
      ? { secondaryTitle: patch.secondaryTitle || null }
      : {}),
    ...(patch.secondaryBody !== undefined
      ? { secondaryBody: patch.secondaryBody || null }
      : {}),
    ...(patch.secondaryCtaLabel !== undefined
      ? { secondaryCtaLabel: patch.secondaryCtaLabel || null }
      : {}),
    ...(patch.secondaryCtaPath !== undefined
      ? { secondaryCtaPath: patch.secondaryCtaPath || null }
      : {}),
  };
  const row = await prisma.emailTemplate.update({ where: { key }, data });
  return rowToFields(row);
}

export async function resetEmailTemplate(
  key: EmailTemplateKey,
): Promise<EmailTemplateFields> {
  const def = EMAIL_TEMPLATE_DEFAULTS[key];
  const row = await prisma.emailTemplate.upsert({
    where: { key },
    create: {
      key: def.key,
      label: def.label,
      enabled: def.enabled,
      subject: def.subject,
      preheader: def.preheader,
      heroTitle: def.heroTitle,
      heroSubtitle: def.heroSubtitle,
      headline: def.headline,
      body: def.body,
      ctaLabel: def.ctaLabel,
      ctaPath: def.ctaPath,
      feature1Title: def.feature1Title || null,
      feature1Body: def.feature1Body || null,
      feature2Title: def.feature2Title || null,
      feature2Body: def.feature2Body || null,
      feature3Title: def.feature3Title || null,
      feature3Body: def.feature3Body || null,
      secondaryTitle: def.secondaryTitle || null,
      secondaryBody: def.secondaryBody || null,
      secondaryCtaLabel: def.secondaryCtaLabel || null,
      secondaryCtaPath: def.secondaryCtaPath || null,
    },
    update: {
      label: def.label,
      enabled: def.enabled,
      subject: def.subject,
      preheader: def.preheader,
      heroTitle: def.heroTitle,
      heroSubtitle: def.heroSubtitle,
      headline: def.headline,
      body: def.body,
      ctaLabel: def.ctaLabel,
      ctaPath: def.ctaPath,
      feature1Title: def.feature1Title || null,
      feature1Body: def.feature1Body || null,
      feature2Title: def.feature2Title || null,
      feature2Body: def.feature2Body || null,
      feature3Title: def.feature3Title || null,
      feature3Body: def.feature3Body || null,
      secondaryTitle: def.secondaryTitle || null,
      secondaryBody: def.secondaryBody || null,
      secondaryCtaLabel: def.secondaryCtaLabel || null,
      secondaryCtaPath: def.secondaryCtaPath || null,
    },
  });
  return rowToFields(row);
}
