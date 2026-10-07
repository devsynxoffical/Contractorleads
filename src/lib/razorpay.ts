import Razorpay from "razorpay";
import crypto from "node:crypto";
import { getRazorpayBillingSecrets } from "@/lib/razorpay-config";

let cachedClient: Razorpay | null = null;
let cachedKeyId: string | null = null;

export async function getRazorpayClient(): Promise<{
  client: Razorpay;
  keyId: string;
  keySecret: string;
}> {
  const secrets = await getRazorpayBillingSecrets();
  if (!secrets.keyId || !secrets.keySecret) {
    throw new Error(
      "Razorpay is not configured. Please provide your Key ID and Key Secret.",
    );
  }
  if (!cachedClient || cachedKeyId !== secrets.keyId) {
    cachedClient = new Razorpay({
      key_id: secrets.keyId,
      key_secret: secrets.keySecret,
    });
    cachedKeyId = secrets.keyId;
  }
  return {
    client: cachedClient,
    keyId: secrets.keyId,
    keySecret: secrets.keySecret,
  };
}

export function resetRazorpayClient() {
  cachedClient = null;
  cachedKeyId = null;
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  try {
    const text = `${params.orderId}|${params.paymentId}`;
    const generated = crypto
      .createHmac("sha256", params.keySecret)
      .update(text)
      .digest("hex");
    return generated === params.signature;
  } catch {
    return false;
  }
}

export function verifyRazorpayWebhookSignature(params: {
  body: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  try {
    const generated = crypto
      .createHmac("sha256", params.webhookSecret)
      .update(params.body)
      .digest("hex");
    return generated === params.signature;
  } catch {
    return false;
  }
}

export async function isRazorpayConfigured(): Promise<boolean> {
  const secrets = await getRazorpayBillingSecrets();
  return Boolean(secrets.keyId && secrets.keySecret);
}
