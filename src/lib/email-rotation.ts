import { prisma } from "@/lib/prisma";

export type EmailRotationConfig = {
  strategy: "even-distribution" | "round-robin" | "weighted";
  emailsPerDomain: number; // e.g. 2 emails per domain
  autoBalance: boolean; // auto-balance: total_leads / total_domains
  delaySeconds: number; // delay between each email send in seconds (e.g. 2)
  dailyLimitPerDomain: number; // max per domain/mailbox per day (e.g. 50)
};

export const DEFAULT_ROTATION_CONFIG: EmailRotationConfig = {
  strategy: "even-distribution",
  emailsPerDomain: 2,
  autoBalance: true,
  delaySeconds: 2,
  dailyLimitPerDomain: 50,
};

const STORAGE_PREFIX = "__EMAIL_ROTATION_CONFIG__:";

export async function getUserRotationConfig(userId: string): Promise<EmailRotationConfig> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCustomInstructions: true },
    });

    const raw = user?.aiCustomInstructions || "";
    if (raw.includes(STORAGE_PREFIX)) {
      const jsonStr = raw.split(STORAGE_PREFIX)[1]?.split("\n")[0]?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        return {
          strategy:
            parsed.strategy === "round-robin" || parsed.strategy === "weighted"
              ? parsed.strategy
              : "even-distribution",
          emailsPerDomain: Math.max(1, Number(parsed.emailsPerDomain) || 2),
          autoBalance: parsed.autoBalance !== false,
          delaySeconds: Math.max(0, Math.min(60, Number(parsed.delaySeconds) ?? 2)),
          dailyLimitPerDomain: Math.max(1, Number(parsed.dailyLimitPerDomain) || 50),
        };
      }
    }
  } catch {
    // fallback
  }

  return { ...DEFAULT_ROTATION_CONFIG };
}

export async function saveUserRotationConfig(
  userId: string,
  config: Partial<EmailRotationConfig>,
): Promise<EmailRotationConfig> {
  const current = await getUserRotationConfig(userId);
  const updated: EmailRotationConfig = {
    strategy:
      config.strategy === "round-robin" || config.strategy === "weighted"
        ? config.strategy
        : config.strategy === "even-distribution"
          ? "even-distribution"
          : current.strategy,
    emailsPerDomain: Math.max(1, Number(config.emailsPerDomain) || current.emailsPerDomain),
    autoBalance: config.autoBalance !== undefined ? Boolean(config.autoBalance) : current.autoBalance,
    delaySeconds: Math.max(0, Math.min(60, Number(config.delaySeconds) ?? current.delaySeconds)),
    dailyLimitPerDomain: Math.max(1, Number(config.dailyLimitPerDomain) || current.dailyLimitPerDomain),
  };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCustomInstructions: true },
  });

  let raw = user?.aiCustomInstructions || "";
  const marker = `${STORAGE_PREFIX}${JSON.stringify(updated)}`;

  if (raw.includes(STORAGE_PREFIX)) {
    const lines = raw.split("\n");
    const filtered = lines.filter((l) => !l.startsWith(STORAGE_PREFIX));
    raw = [...filtered, marker].filter(Boolean).join("\n");
  } else {
    raw = raw ? `${raw}\n${marker}` : marker;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { aiCustomInstructions: raw },
  });

  return updated;
}
