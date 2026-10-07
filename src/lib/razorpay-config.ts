import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto-secret";

export type RazorpayBillingSecrets = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

export type RazorpayBillingStatus = {
  configured: boolean;
  liveReady: boolean;
  source: "database" | "environment" | "default" | "none";
  keyIdMasked: string | null;
  keySecretConfigured: boolean;
  webhookSecretConfigured: boolean;
  mode: "live" | "test" | "none";
};

export const DEFAULT_RAZORPAY_KEY_ID = "rzp_live_TkuAxXwVmQ7dOu";
export const DEFAULT_RAZORPAY_KEY_SECRET = "3W7JQNCRW5AFxUDg1V9XMkSh";

function fromEnv(): RazorpayBillingSecrets {
  return {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || DEFAULT_RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || DEFAULT_RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "",
  };
}

export async function getRazorpayBillingSecrets(): Promise<RazorpayBillingSecrets> {
  try {
    const row = await prisma.razorpayBillingConfig.findUnique({
      where: { id: "default" },
    });
    const env = fromEnv();
    if (!row) return env;

    const keySecret = row.keySecret ? decryptSecret(row.keySecret) : env.keySecret;
    const webhookSecret = row.webhookSecret
      ? decryptSecret(row.webhookSecret)
      : env.webhookSecret;

    return {
      keyId: row.keyId.trim() || env.keyId,
      keySecret: keySecret || env.keySecret,
      webhookSecret: webhookSecret || env.webhookSecret,
    };
  } catch {
    return fromEnv();
  }
}

export async function getRazorpayBillingStatus(): Promise<RazorpayBillingStatus> {
  const secrets = await getRazorpayBillingSecrets();
  const configured = Boolean(secrets.keyId && secrets.keySecret);
  const isLive = secrets.keyId.startsWith("rzp_live_");
  const isTest = secrets.keyId.startsWith("rzp_test_");

  let masked: string | null = null;
  if (secrets.keyId) {
    masked = secrets.keyId.length > 8
      ? `${secrets.keyId.slice(0, 8)}...${secrets.keyId.slice(-4)}`
      : secrets.keyId;
  }

  let source: RazorpayBillingStatus["source"] = "none";
  try {
    const row = await prisma.razorpayBillingConfig.findUnique({
      where: { id: "default" },
    });
    if (row && (row.keyId || row.keySecret)) {
      source = "database";
    } else if (process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET) {
      source = "environment";
    } else if (DEFAULT_RAZORPAY_KEY_ID) {
      source = "default";
    }
  } catch {
    source = "default";
  }

  return {
    configured,
    liveReady: configured && isLive,
    source,
    keyIdMasked: masked,
    keySecretConfigured: Boolean(secrets.keySecret),
    webhookSecretConfigured: Boolean(secrets.webhookSecret),
    mode: isLive ? "live" : isTest ? "test" : "none",
  };
}

export async function saveRazorpayBillingConfig(input: {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  clearKeyId?: boolean;
  clearKeySecret?: boolean;
  clearWebhookSecret?: boolean;
}) {
  const current = await prisma.razorpayBillingConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const data: {
    keyId?: string;
    keySecret?: string;
    webhookSecret?: string;
  } = {};

  if (input.clearKeyId) {
    data.keyId = "";
  } else if (input.keyId !== undefined) {
    data.keyId = input.keyId.trim();
  }

  if (input.clearKeySecret) {
    data.keySecret = "";
  } else if (input.keySecret !== undefined) {
    data.keySecret = input.keySecret ? encryptSecret(input.keySecret.trim()) : "";
  }

  if (input.clearWebhookSecret) {
    data.webhookSecret = "";
  } else if (input.webhookSecret !== undefined) {
    data.webhookSecret = input.webhookSecret
      ? encryptSecret(input.webhookSecret.trim())
      : "";
  }

  await prisma.razorpayBillingConfig.update({
    where: { id: "default" },
    data,
  });

  // Reset cached client
  const { resetRazorpayClient } = await import("@/lib/razorpay");
  resetRazorpayClient();
}
