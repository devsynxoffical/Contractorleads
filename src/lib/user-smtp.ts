import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto-secret";

export type SmtpPayload = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string | null;
};

export function createSmtpTransport(cfg: SmtpPayload) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.username,
      pass: cfg.password,
    },
  });
}

export async function getUserSmtpConfig(userId: string): Promise<SmtpPayload | null> {
  const row = await prisma.userSmtpSettings.findUnique({ where: { userId } });
  if (!row || !row.enabled) return null;
  return {
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    password: decryptSecret(row.passwordEnc),
    fromEmail: row.fromEmail,
    fromName: row.fromName,
  };
}

export async function sendViaUserSmtp(opts: {
  userId: string;
  to: string;
  subject: string;
  text: string;
}) {
  const cfg = await getUserSmtpConfig(opts.userId);
  if (!cfg) {
    throw new Error("SMTP is not configured. Add your SMTP settings under Settings.");
  }
  const transport = createSmtpTransport(cfg);
  const from = cfg.fromName
    ? `"${cfg.fromName}" <${cfg.fromEmail}>`
    : cfg.fromEmail;
  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  });
}

export function renderSequenceTemplate(
  template: string,
  vars: Record<string, string>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}
